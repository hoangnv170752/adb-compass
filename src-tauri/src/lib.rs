// DeviceHub - Main Library
// Entry point for the Tauri application

pub mod adb;
pub mod apk;
pub mod command_utils;
pub mod commands;
pub mod error;
pub mod requirements;
pub mod services;

use adb::{start_device_tracker, AdbExecutor};
use commands::logcat::LogcatState;
use commands::{
    build_index,
    check_action_requirements,
    check_adb_status,
    check_device_requirements,
    clear_app_data,
    // Shell
    clear_logcat,
    // Wireless
    connect_wireless,
    create_remote_directory,
    delete_remote_file,
    disconnect_wireless,
    enable_tcpip,
    execute_shell,
    export_logcat,
    get_app_icon,
    get_apps_full,
    get_clipboard,
    get_default_media_dir,
    get_device_ip,
    get_device_property,
    get_device_props,
    get_devices,
    get_logcat,
    get_performance_stats,
    get_scrcpy_status,
    // Screen Capture
    get_screen_frame,
    grant_all_permissions,
    inject_tap_fast,
    input_tap,
    input_text,
    install_apk,
    kill_adb_server,
    // File Transfer
    list_files,
    list_files_fast,
    list_packages,
    open_captures_folder,
    pull_file,
    push_file,
    read_scrcpy_frame,
    // Device Actions
    reboot_device,
    refresh_devices,
    request_scrcpy_sync,
    save_capture_file,
    scan_apks_in_folder,
    scrcpy_key,
    scrcpy_scroll,
    scrcpy_text,
    scrcpy_touch,
    search_files_fast,
    set_animations,
    set_clipboard,
    // Quick Actions
    set_dark_mode,
    set_show_taps,
    start_adb_server,
    // Logcat Streaming
    start_logcat_stream,
    // Scrcpy & Screen Capture
    start_scrcpy_server,
    start_screen_recording,
    stop_logcat_stream,
    stop_scrcpy_server,
    stop_screen_recording,
    take_screenshot,
    test_agent_connection,
    uninstall_app,
    validate_apk,
};
use tauri::{Manager, RunEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Manage state
            app.manage(LogcatState::new());

            // Start real-time device tracking
            start_device_tracker(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_adb_status,
            get_devices,
            refresh_devices,
            get_device_property,
            start_adb_server,
            kill_adb_server,
            check_device_requirements,
            check_action_requirements,
            validate_apk,
            install_apk,
            scan_apks_in_folder,
            // Device Actions
            reboot_device,
            input_text,
            input_tap,
            uninstall_app,
            list_packages,
            get_device_props,
            // File Transfer
            list_files,
            push_file,
            pull_file,
            delete_remote_file,
            create_remote_directory,
            // Wireless
            connect_wireless,
            disconnect_wireless,
            enable_tcpip,
            get_device_ip,
            // Shell
            execute_shell,
            get_logcat,
            clear_logcat,
            // Logcat Streaming
            start_logcat_stream,
            stop_logcat_stream,
            export_logcat,
            // Screen Capture
            take_screenshot,
            save_capture_file,
            start_screen_recording,
            stop_screen_recording,
            get_screen_frame,
            get_default_media_dir,
            open_captures_folder,
            // Scrcpy
            start_scrcpy_server,
            stop_scrcpy_server,
            get_scrcpy_status,
            request_scrcpy_sync,
            read_scrcpy_frame,
            scrcpy_touch,
            scrcpy_scroll,
            scrcpy_key,
            scrcpy_text,
            // Quick Actions
            set_dark_mode,
            set_show_taps,
            set_animations,
            clear_app_data,
            grant_all_permissions,
            test_agent_connection,
            get_apps_full,
            get_app_icon,
            list_files_fast,
            get_performance_stats,
            get_clipboard,
            set_clipboard,
            inject_tap_fast,
            build_index,
            search_files_fast,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                // Kill all logcat streams
                if let Some(state) = app_handle.try_state::<LogcatState>() {
                    let mut streams = state.streams.lock().unwrap();
                    for (_, mut child) in streams
                        .drain()
                        .collect::<Vec<(String, std::process::Child)>>()
                    {
                        let _ = child.kill();
                    }
                }

                // Kill ADB server when app closes to prevent orphan processes
                let executor = AdbExecutor::new();
                let _ = executor.kill_server();
            }
        });
}
