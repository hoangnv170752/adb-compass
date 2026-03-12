// DeviceHub - Error Types
// Centralized error handling for the application

use serde::Serialize;

/// Application-wide error type
#[derive(Debug, Clone, Serialize)]
pub struct AppError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl AppError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details: None,
        }
    }

    pub fn with_details(code: &str, message: &str, details: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details: Some(details.to_string()),
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}

/// ADB-specific errors
#[derive(Debug, Clone, Serialize)]
pub enum AdbError {
    NotFound,
    ExecutionFailed(String),
    ParseError(String),
    DeviceNotFound(String),
    Unauthorized(String),
    Timeout,
}

impl From<AdbError> for AppError {
    fn from(err: AdbError) -> Self {
        match err {
            AdbError::NotFound => AppError::new(
                "ADB_NOT_FOUND",
                "ADB executable not found. Please ensure Android platform-tools are installed.",
            ),
            AdbError::ExecutionFailed(msg) => AppError::with_details(
                "ADB_EXECUTION_FAILED",
                "Failed to execute ADB command",
                &msg,
            ),
            AdbError::ParseError(msg) => AppError::with_details(
                "ADB_PARSE_ERROR",
                "Failed to parse ADB output",
                &msg,
            ),
            AdbError::DeviceNotFound(id) => AppError::with_details(
                "DEVICE_NOT_FOUND",
                "Device not found or disconnected",
                &id,
            ),
            AdbError::Unauthorized(id) => AppError::with_details(
                "DEVICE_UNAUTHORIZED",
                "Device requires USB debugging authorization",
                &id,
            ),
            AdbError::Timeout => AppError::new(
                "ADB_TIMEOUT",
                "ADB command timed out",
            ),
        }
    }
}
