use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogPayload {
    pub level: String,
    pub message: String,
    pub timestamp: String,
}

pub fn emit_log(app_handle: &AppHandle, level: &str, message: &str) {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .to_string();
    
    let _ = app_handle.emit("app-log", LogPayload {
        level: level.to_string(),
        message: message.to_string(),
        timestamp,
    });
    
    // Also log to standard output for debugging
    match level {
        "info" => log::info!("{}", message),
        "warn" => log::warn!("{}", message),
        "error" => log::error!("{}", message),
        _ => log::debug!("{}", message),
    }
}

#[macro_export]
macro_rules! log_info {
    ($app:expr, $($arg:tt)*) => {
        $crate::minecraft::logger::emit_log($app, "info", &format!($($arg)*))
    };
}

#[macro_export]
macro_rules! log_warn {
    ($app:expr, $($arg:tt)*) => {
        $crate::minecraft::logger::emit_log($app, "warn", &format!($($arg)*))
    };
}

#[macro_export]
macro_rules! log_error {
    ($app:expr, $($arg:tt)*) => {
        $crate::minecraft::logger::emit_log($app, "error", &format!($($arg)*))
    };
}
