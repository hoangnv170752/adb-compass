use crate::adb::executor::AdbExecutor;
use crate::command_utils::TokioCommandExt;
use crate::error::AppError;
use serde_json::{json, Value};
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;

pub struct AgentManager {
    executor: AdbExecutor,
    port: u16,
}

impl AgentManager {
    pub fn new(executor: AdbExecutor) -> Self {
        Self {
            executor,
            port: 12345,
        }
    }

    /// Prepare and start the agent on the specified device.
    pub async fn start_agent(&self, device_id: &str) -> Result<(), AppError> {
        // 1. Push the JAR to the device
        // Get agent.jar path relative to adb binary location
        let adb_path = self.executor.get_adb_path();
        let agent_path = adb_path
            .parent()
            .map(|p| p.join("agent.jar"))
            .unwrap_or_else(|| std::path::PathBuf::from("binaries/agent.jar"));
        
        let agent_path_str = agent_path.to_string_lossy();
        eprintln!("[Agent] Using agent.jar path: {}", agent_path_str);

        // Push command: adb -s <id> push <path> /data/local/tmp/agent.jar
        let output = tokio::process::Command::new(adb_path)
            .hide_window()
            .args([
                "-s",
                device_id,
                "push",
                &agent_path_str as &str,
                "/data/local/tmp/agent.jar",
            ])
            .output()
            .await
            .map_err(|e| AppError::from(crate::error::AdbError::ExecutionFailed(e.to_string())))?;

        if !output.status.success() {
            return Err(AppError::from(crate::error::AdbError::ExecutionFailed(
                String::from_utf8_lossy(&output.stderr).to_string(),
            )));
        }

        // 2. Start the agent using app_process
        let start_cmd = format!(
            "CLASSPATH=/data/local/tmp/agent.jar app_process / com.h1dr0n.adbcompass.Main {}",
            self.port
        );

        // We start it in background
        tokio::process::Command::new(adb_path)
            .hide_window()
            .args(["-s", device_id, "shell", &start_cmd])
            .spawn()
            .map_err(|e| AppError::from(crate::error::AdbError::ExecutionFailed(e.to_string())))?;

        // 3. Setup port forwarding
        let forward_output = tokio::process::Command::new(adb_path)
            .hide_window()
            .args([
                "-s",
                device_id,
                "forward",
                &format!("tcp:{}", self.port),
                &format!("tcp:{}", self.port),
            ])
            .output()
            .await
            .map_err(|e| AppError::from(crate::error::AdbError::ExecutionFailed(e.to_string())))?;

        if !forward_output.status.success() {
            return Err(AppError::from(crate::error::AdbError::ExecutionFailed(
                String::from_utf8_lossy(&forward_output.stderr).to_string(),
            )));
        }

        // Give it a moment to start
        tokio::time::sleep(Duration::from_millis(1500)).await;

        Ok(())
    }

    /// Ensures the agent is running and connected. If not, attempts to start it.
    async fn ensure_agent(&self, device_id: &str) -> Result<TcpStream, AppError> {
        let addr = format!("127.0.0.1:{}", self.port);

        // Try to connect first
        match tokio::time::timeout(Duration::from_secs(1), TcpStream::connect(&addr)).await {
            Ok(Ok(stream)) => Ok(stream),
            _ => {
                // Connection failed, try to start the agent
                self.start_agent(device_id).await?;

                // Try to connect again after starting
                tokio::time::timeout(Duration::from_secs(2), TcpStream::connect(&addr))
                    .await
                    .map_err(|_| {
                        AppError::from(crate::error::AdbError::ExecutionFailed(
                            "Failed to connect to agent after start timeout".to_string(),
                        ))
                    })?
                    .map_err(|e| {
                        AppError::from(crate::error::AdbError::ExecutionFailed(format!(
                            "Socket connect failed after agent start: {}",
                            e
                        )))
                    })
            }
        }
    }

    /// Send a command to the agent and receive a response.
    pub async fn send_command(
        &self,
        device_id: &str,
        cmd_type: &str,
        data: Value,
    ) -> Result<Value, AppError> {
        let mut stream = self.ensure_agent(device_id).await?;

        let request = json!({
            "type": cmd_type,
            "data": data
        });

        let mut request_str = request.to_string();
        request_str.push('\n');

        stream
            .write_all(request_str.as_bytes())
            .await
            .map_err(|e| AppError::from(crate::error::AdbError::ExecutionFailed(e.to_string())))?;

        let mut reader = BufReader::new(stream);
        let mut response_str = String::new();
        reader.read_line(&mut response_str).await.map_err(|e| {
            AppError::from(crate::error::AdbError::ExecutionFailed(format!(
                "Read failure: {}",
                e
            )))
        })?;

        let response: Value = serde_json::from_str(&response_str).map_err(|e| {
            AppError::from(crate::error::AdbError::ExecutionFailed(format!(
                "JSON parse error: {}",
                e
            )))
        })?;

        Ok(response)
    }

    pub async fn list_files_fast(&self, device_id: &str, path: &str) -> Result<Value, AppError> {
        let resp = self
            .send_command(device_id, "LIST_FILES", json!({ "path": path }))
            .await?;
        let data = resp["data"]["files"].clone();
        Ok(if data.is_null() { json!([]) } else { data })
    }

    pub async fn get_apps_full(
        &self,
        device_id: &str,
        include_system: bool,
    ) -> Result<Value, AppError> {
        let resp = self
            .send_command(
                device_id,
                "GET_APPS",
                json!({ "include_system": include_system }),
            )
            .await?;
        let data = resp["data"]["apps"].clone();
        Ok(if data.is_null() { json!([]) } else { data })
    }

    pub async fn get_app_icon(&self, device_id: &str, package: &str) -> Result<Value, AppError> {
        let resp = self
            .send_command(device_id, "GET_ICON", json!({ "package": package }))
            .await?;
        let data = resp["data"]["icon"].clone();
        Ok(if data.is_null() { json!("") } else { data })
    }

    pub async fn get_performance_stats(&self, device_id: &str) -> Result<Value, AppError> {
        let resp = self.send_command(device_id, "GET_STATS", json!({})).await?;
        let data = resp["data"]["stats"].clone();
        Ok(if data.is_null() {
            json!({ "cpu": 0, "ram": 0 })
        } else {
            data
        })
    }

    pub async fn get_clipboard(&self, device_id: &str) -> Result<Value, AppError> {
        let resp = self
            .send_command(device_id, "GET_CLIPBOARD", json!({}))
            .await?;
        let data = resp["data"]["text"].clone();
        Ok(if data.is_null() { json!("") } else { data })
    }

    pub async fn set_clipboard(&self, device_id: &str, text: &str) -> Result<Value, AppError> {
        let resp = self
            .send_command(device_id, "SET_CLIPBOARD", json!({ "text": text }))
            .await?;
        let data = resp["data"]["success"].clone();
        Ok(if data.is_null() { json!(false) } else { data })
    }

    pub async fn inject_tap(&self, device_id: &str, x: i32, y: i32) -> Result<Value, AppError> {
        let resp = self
            .send_command(
                device_id,
                "INJECT_INPUT",
                json!({ "input_type": "TAP", "x": x, "y": y }),
            )
            .await?;
        let data = resp["data"]["success"].clone();
        Ok(if data.is_null() { json!(false) } else { data })
    }

    pub async fn build_index(&self, device_id: &str, path: &str) -> Result<Value, AppError> {
        let resp = self
            .send_command(device_id, "INDEX_FILES", json!({ "path": path }))
            .await?;
        let data = resp["data"]["status"].clone();
        Ok(if data.is_null() { json!("") } else { data })
    }

    pub async fn search_files_fast(&self, device_id: &str, query: &str) -> Result<Value, AppError> {
        let resp = self
            .send_command(device_id, "SEARCH_FILES", json!({ "query": query }))
            .await?;
        let data = resp["data"].clone();
        Ok(if data.is_null() {
            json!({ "results": [], "is_indexing": false })
        } else {
            data
        })
    }
}
