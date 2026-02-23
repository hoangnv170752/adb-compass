// ADB Client - Low-level ADB process execution
// Handles finding ADB path, command execution with timeouts and retries.

use crate::command_utils::hidden_command;
use crate::error::{AdbError, AppError};
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::time::Duration;
use wait_timeout::ChildExt;

/// Default timeout for standard ADB commands
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);
/// Default retry attempts for transient failures
const DEFAULT_RETRIES: u32 = 1;

/// Configuration for ADB command execution
#[derive(Debug, Clone)]
pub struct ExecutionConfig {
    pub timeout: Duration,
    pub retries: u32,
    pub hidden: bool,
}

impl Default for ExecutionConfig {
    fn default() -> Self {
        Self {
            timeout: DEFAULT_TIMEOUT,
            retries: DEFAULT_RETRIES,
            hidden: true,
        }
    }
}

/// A low-level client for executing ADB commands.
/// This client is responsible for managing the ADB executable path and
/// ensuring commands are executed safely across different platforms.
pub struct AdbClient {
    adb_path: PathBuf,
}

impl AdbClient {
    /// Initialize a new ADB client, automatically discovering the ADB path.
    pub fn new() -> Self {
        Self {
            adb_path: Self::discover_adb(),
        }
    }

    /// Initialize an ADB client with a specific path.
    pub fn with_path<P: AsRef<Path>>(path: P) -> Self {
        Self {
            adb_path: path.as_ref().to_path_buf(),
        }
    }

    /// Get the path to the ADB executable being used.
    pub fn adb_path(&self) -> &PathBuf {
        &self.adb_path
    }

    /// Legend/Legacy support for direct Command builders.
    pub fn run_with_retry<F>(
        &self,
        mut command_builder: F,
        timeout: Duration,
        retries: u32,
    ) -> Result<Output, AppError>
    where
        F: FnMut() -> Command,
    {
        let mut last_error = AppError::from(AdbError::ExecutionFailed("No attempts made".into()));

        for attempt in 0..=retries {
            if attempt > 0 {
                std::thread::sleep(Duration::from_millis(1000));
            }

            let mut cmd = command_builder();
            cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

            match self.wait_for_process(&mut cmd, timeout) {
                Ok(output) => return Ok(output),
                Err(e) => last_error = e,
            }
        }

        Err(last_error)
    }

    /// Run an ADB command with default configuration.
    pub fn execute(&self, args: &[&str]) -> Result<Output, AppError> {
        self.execute_with_config(args, &ExecutionConfig::default())
    }

    /// Run an ADB command with a specific configuration.
    pub fn execute_with_config(
        &self,
        args: &[&str],
        config: &ExecutionConfig,
    ) -> Result<Output, AppError> {
        let mut last_error = AppError::from(AdbError::ExecutionFailed("No attempts made".into()));

        eprintln!("[ADB] execute_with_config: args={:?}, path={:?}", args, self.adb_path);

        for attempt in 0..=config.retries {
            if attempt > 0 {
                std::thread::sleep(Duration::from_millis(1000));
            }

            let mut cmd = if config.hidden {
                hidden_command(&self.adb_path)
            } else {
                Command::new(&self.adb_path)
            };

            cmd.args(args);

            match self.wait_for_process(&mut cmd, config.timeout) {
                Ok(output) => {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    eprintln!("[ADB] Success: status={}, stdout_len={}, stderr_len={}", 
                        output.status, stdout.len(), stderr.len());
                    if !stderr.is_empty() {
                        eprintln!("[ADB] stderr: {}", stderr);
                    }
                    return Ok(output);
                },
                Err(e) => {
                    eprintln!("[ADB] Error on attempt {}: {:?}", attempt, e);
                    last_error = e;
                }
            }
        }

        eprintln!("[ADB] All attempts failed: {:?}", last_error);
        Err(last_error)
    }

    /// Helper to spawn and wait for a process with timeout.
    fn wait_for_process(&self, cmd: &mut Command, timeout: Duration) -> Result<Output, AppError> {
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        eprintln!("[ADB] Spawning process: {:?}", self.adb_path);
        
        let mut child = cmd.spawn().map_err(|e| {
            eprintln!("[ADB] Spawn error: {}", e);
            AppError::from(AdbError::ExecutionFailed(format!(
                "Failed to spawn process '{}': {}",
                self.adb_path.display(),
                e
            )))
        })?;

        match child
            .wait_timeout(timeout)
            .map_err(|e| AppError::from(AdbError::ExecutionFailed(format!("Wait error: {}", e))))?
        {
            Some(_) => child.wait_with_output().map_err(|e| {
                AppError::from(AdbError::ExecutionFailed(format!("Output error: {}", e)))
            }),
            None => {
                let _ = child.kill();
                let _ = child.wait();
                Err(AppError::from(AdbError::ExecutionFailed(
                    "Command timed out".into(),
                )))
            }
        }
    }

    /// Discover the ADB path by checking bundled locations and the system path.
    fn discover_adb() -> PathBuf {
        let path = Self::find_bundled_adb().unwrap_or_else(|| PathBuf::from("adb"));
        eprintln!("[ADB] Discovered ADB path: {:?}", path);
        path
    }

    /// Check for bundled ADB in common application directories.
    fn find_bundled_adb() -> Option<PathBuf> {
        let exe_path = std::env::current_exe().ok()?;
        let exe_dir = exe_path.parent()?;
        let exe_name = if cfg!(target_os = "windows") {
            "adb.exe"
        } else {
            "adb"
        };

        let possible_paths = [
            // macOS app bundle: Contents/MacOS/../Resources/binaries/adb
            exe_dir
                .parent()
                .map(|p| p.join("Resources").join("binaries").join(exe_name)),
            // Development paths
            exe_dir
                .parent()
                .and_then(|p| p.parent())
                .map(|p| p.join("binaries").join(exe_name)),
            exe_dir
                .parent()
                .and_then(|p| p.parent())
                .and_then(|p| p.parent())
                .map(|p| p.join("src-tauri").join("binaries").join(exe_name)),
            // Production paths (Windows/Linux)
            Some(exe_dir.join("resources").join("binaries").join(exe_name)),
            Some(exe_dir.join("binaries").join(exe_name)),
            Some(exe_dir.join(exe_name)),
            Some(exe_dir.join("resources").join(exe_name)),
            // CWD Fallbacks
            Some(PathBuf::from("binaries").join(exe_name)),
            Some(PathBuf::from("src-tauri").join("binaries").join(exe_name)),
        ];

        possible_paths.into_iter().flatten().find(|p| p.exists())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adb_client_initialization() {
        let client = AdbClient::new();
        assert!(!client.adb_path().as_os_str().is_empty());
    }

    #[test]
    fn test_adb_client_with_custom_path() {
        let path = PathBuf::from("/usr/local/bin/adb_test");
        let client = AdbClient::with_path(&path);
        assert_eq!(client.adb_path(), &path);
    }
}
