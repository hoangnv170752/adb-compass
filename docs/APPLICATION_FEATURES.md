# DeviceHub - Complete Feature Guide

A comprehensive desktop application for Android device management, debugging, and development.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Device Management](#device-management)
- [Screen Mirroring & Control](#screen-mirroring--control)
- [Multi-Screen Control](#multi-screen-control)
- [Application Management](#application-management)
- [File Management](#file-management)
- [APK Installation](#apk-installation)
- [Developer Tools](#developer-tools)
- [Wireless ADB](#wireless-adb)
- [Quick Actions](#quick-actions)
- [Settings & Customization](#settings--customization)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### Prerequisites

- Android device with **USB Debugging** enabled
- USB cable (for initial connection) or WiFi (for wireless ADB)
- Developer Options enabled on your Android device

### Enabling Developer Options

1. Go to **Settings > About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings > System > Developer Options**
4. Enable **USB Debugging**

### First Launch

1. Launch DeviceHub
2. Connect your Android device via USB
3. Accept the USB debugging authorization prompt on your device
4. Your device will appear in the device list automatically

---

## Device Management

### Device Discovery

DeviceHub automatically detects connected Android devices using ADB's device tracking system.

**Features:**
- **Auto-detection**: Devices appear automatically when connected via USB
- **Real-time updates**: Device status updates instantly (Connected, Offline, Unauthorized)
- **Multi-device support**: Manage multiple devices simultaneously
- **Persistent device list**: Devices remain visible when disconnected for easy reconnection

### Device Information

Click on any device to view detailed information across four tabs:

#### Overview Tab
- **Device Identity**: Device ID, model name, manufacturer
- **Hardware Info**: CPU/chipset, screen resolution, RAM capacity
- **Storage**: Visual storage usage bars with color-coded indicators
  - Green: < 70% used
  - Yellow: 70-90% used
  - Red: > 90% used
- **Battery**: Current level, charging status
- **Software**: Android version, SDK level, security patch date, build number
- **Connection**: USB or Wireless connection type indicator

#### Screen Tab
See [Screen Mirroring & Control](#screen-mirroring--control)

#### Apps Tab
See [Application Management](#application-management)

#### Files Tab
See [File Management](#file-management)

### Device Status Indicators

| Status | Color | Description |
|--------|-------|-------------|
| Connected | Green | Device is connected and ready |
| Offline | Yellow | Device detected but not responding |
| Unauthorized | Red | USB debugging not authorized on device |

---

## Screen Mirroring & Control

### Streaming Modes

DeviceHub offers two streaming modes for viewing your device screen:

#### Standard Mode (ADB)
- **Frame Rate**: ~1 FPS
- **Requirements**: ADB only
- **Best For**: Quick screenshots, low-bandwidth situations

#### High-Performance Mode (Scrcpy)
- **Frame Rate**: Up to 60 FPS
- **Requirements**: Scrcpy server
- **Best For**: Real-time interaction, gaming, demonstrations

Toggle between modes using the performance switch in the Screen tab.

### Screen Interaction

When viewing your device screen, you can interact directly:

| Action | How To |
|--------|--------|
| Tap | Click on the screen preview |
| Scroll | Use mouse scroll wheel |
| Type | Focus and type on keyboard |
| Navigate | Use quick action buttons |

### Quick Action Buttons

A toolbar of 12 quick action buttons provides instant access to common controls:

**Navigation:**
- Back, Home, Recent Apps, Menu

**Media:**
- Volume Up, Volume Down, Mute, Play/Pause

**System:**
- Brightness Up, Brightness Down, Notifications, Power

### Screenshot & Recording

| Feature | Description |
|---------|-------------|
| **Take Screenshot** | Capture device screen as PNG |
| **Screen Recording** | Record screen as MP4 video |
| **Recording Timer** | Shows elapsed recording time |
| **Custom Save Location** | Configure where captures are stored |
| **Open Captures Folder** | Quick access to saved files |

### Fullscreen & Pop-out

- **Fullscreen Mode**: Expand the screen preview to fill your display
- **Pop-out Window**: Open the device screen in a separate, resizable window

---

## Multi-Screen Control

Manage multiple devices simultaneously with synchronized controls.

### Grid Layout

- View 2 or more devices side-by-side in a configurable grid
- Each device panel shows live screen streaming
- Independent controls per device panel

### Synchronized Interaction

Enable sync mode to send the same touch input to all connected devices simultaneously:

- **Same tap location** sent to all devices
- **Perfect for**: Testing across multiple devices, demonstrations
- **Toggle per-device**: Enable/disable sync for individual devices

### Panel Management

| Action | Description |
|--------|-------------|
| **Drag to Reorder** | Rearrange device panels by dragging |
| **Maximize Panel** | Click to expand a single device |
| **Collapse View** | Minimize panels for overview |

---

## Application Management

### Browsing Installed Apps

The Apps tab provides a comprehensive view of all applications on your device.

**View Options:**
- **List View**: Compact, sortable list with app details
- **Grid View**: Icon-based visual grid

**Filtering:**
- **Search**: Filter by app name or package name
- **System Apps Toggle**: Show/hide system applications

### App Information

For each application, view:
- App icon (extracted from device)
- App name (with smart naming for 100+ popular apps)
- Package name
- Version information

### App Actions

| Action | Description |
|--------|-------------|
| **Uninstall** | Remove app with confirmation dialog |
| **Clear Data** | Clear app data and cache |
| **Grant Permissions** | Grant all runtime permissions |

---

## File Management

### File Explorer

Navigate your device's file system with an intuitive file browser.

**Quick Access Sidebar:**
- Internal Storage
- DCIM (Photos)
- Pictures
- Music
- Movies
- Downloads
- Root filesystem (/)

### Navigation

- **Breadcrumb Path**: Click any folder in the path to jump back
- **Folder Tree**: Navigate through the hierarchical structure
- **Quick Access**: Jump to common locations instantly

### File Operations

| Operation | Description |
|-----------|-------------|
| **Upload** | Transfer files from your computer to the device |
| **Download** | Copy files from the device to your computer |
| **Create Folder** | Create new directories on the device |
| **Delete** | Remove files or folders (with confirmation) |

### File Information

For each file, view:
- Name and type
- Size (human-readable format)
- Permissions
- File type icon

---

## APK Installation

### Installation Methods

1. **Drag & Drop**: Drag APK files onto the application window
2. **Browse**: Click to select APK files from your computer
3. **Folder Scan**: Scan a folder to find all APK files

### Pre-Installation Validation

Before installation, DeviceHub checks:

| Requirement | Description |
|-------------|-------------|
| Developer Options | Must be enabled |
| USB Debugging | Must be enabled |
| Unknown Sources | Installation from unknown sources must be allowed |
| Device Authorization | Device must have authorized this computer |

### Installation Process

1. Select or drop APK file(s)
2. Choose target device(s)
3. Review the requirements checklist
4. Click Install
5. Monitor installation progress
6. Receive success/error notification

### APK Information

DeviceHub extracts and displays:
- Filename and file size
- Package name
- Version information
- Validity status

---

## Developer Tools

### Logcat Viewer

Real-time streaming of Android system logs.

**Features:**
- **Real-time Streaming**: Live log updates from device
- **Level Filtering**: Verbose, Debug, Info, Warning, Error
- **Text Search**: Filter logs by search query
- **Device Selection**: Choose which device to monitor
- **Line Limit**: Configurable maximum lines (default: 1000)

**Controls:**
| Action | Description |
|--------|-------------|
| Pause/Resume | Temporarily stop log streaming |
| Clear | Clear the log buffer |
| Export | Save logs to a file |
| Auto-scroll | Automatically scroll to latest logs |

**Color-coded Log Levels:**
- Verbose: Gray
- Debug: Blue
- Info: Green
- Warning: Yellow
- Error: Red

### Shell Terminal

Interactive command-line interface for executing ADB shell commands.

**Features:**
- **Command Execution**: Run any ADB shell command
- **Command History**: Navigate previous commands with arrow keys
- **Autocomplete**: IDE-style suggestions for common commands
- **Device Selection**: Choose target device for commands

**Pre-built Commands:**
A library of 12 common commands for quick access:

| Command | Description |
|---------|-------------|
| List Packages | Show all installed packages |
| Battery Stats | Display battery information |
| Memory Info | Show memory usage |
| Process List | List running processes |
| IP Address | Show device network info |
| CPU Info | Display CPU details |
| Device Properties | Show system properties |
| Activity Stack | View current activity stack |
| Clear Logcat | Clear the log buffer |
| Screen Capture | Take a screenshot |

---

## Wireless ADB

Connect to your device over WiFi without a USB cable.

### Setup Process

1. **Initial USB Connection**: Connect device via USB first
2. **Enable TCP/IP Mode**: DeviceHub enables wireless ADB automatically
3. **Get Device IP**: IP address is detected automatically
4. **Connect Wirelessly**: Connect using the device's IP and port

### Connection Details

| Setting | Default |
|---------|---------|
| Port | 5555 |
| Protocol | TCP/IP |

### Wireless Features

- **Auto IP Discovery**: Automatically detects device IP address
- **Copy Connection String**: Copy IP:port to clipboard
- **Custom Port**: Change the connection port if needed
- **Disconnect**: Cleanly disconnect wireless connections

---

## Quick Actions

Access frequently used device controls with one click.

### System Toggles

| Action | Description |
|--------|-------------|
| **Force Dark Mode** | Enable system-wide dark theme |
| **Force Light Mode** | Enable system-wide light theme |
| **Show Taps** | Visualize touch input on device |
| **Speed Up Animations** | Set animation scale to 0.5x |

### Maintenance Actions

| Action | Description |
|--------|-------------|
| **Reboot** | Normal system restart |
| **Reboot to Recovery** | Boot into recovery mode |
| **Reboot to Bootloader** | Boot into fastboot mode |

### Text Input

Send text directly to your device:
- Multi-line text support
- Shift+Enter for new lines
- Enter to send

---

## Settings & Customization

### Appearance

| Setting | Options |
|---------|---------|
| **Theme** | Light, Dark, System (follows OS) |
| **Language** | English, Vietnamese |

### General Settings

| Setting | Description |
|---------|-------------|
| **Notifications** | Enable/disable system notifications |
| **Ask Before Save** | Prompt for save location on captures |

### Path Configuration

| Setting | Description |
|---------|-------------|
| **ADB Path** | Custom path to ADB binary |
| **Capture Save Location** | Default folder for screenshots/recordings |

### AI Integration (Optional)

Store API keys for optional AI features:
- OpenAI API key
- Anthropic (Claude) API key
- Google Gemini API key

**Security Note**: API keys are stored locally on your machine.

### Application Info

| Feature | Description |
|---------|-------------|
| **About** | App version and developer credits |
| **Check for Updates** | Manually check for new versions |
| **Reset to Defaults** | Restore all settings to default |

---

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + ,` | Open Settings |
| `Ctrl/Cmd + Q` | Quit Application |

### Device Control

| Shortcut | Action |
|----------|--------|
| `Escape` | Back button |
| `Home` | Home button |
| `Enter` | Send text input |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Up/Down Arrow` | Navigate command history (in terminal) |
| `Tab` | Autocomplete (in terminal) |

---

## Platform Support

DeviceHub is available for:

| Platform | Installer Formats |
|----------|------------------|
| **Windows** | EXE, MSI, ZIP (portable) |
| **macOS** | DMG |
| **Linux** | DEB, AppImage |

---

## Troubleshooting

### Device Not Detected

1. Ensure USB Debugging is enabled
2. Try a different USB cable
3. Check USB port functionality
4. Restart ADB server (Settings > ADB Management)

### Unauthorized Device

1. Disconnect and reconnect the device
2. Accept the authorization prompt on your device
3. Check "Always allow from this computer"

### Wireless Connection Failed

1. Ensure device and computer are on the same network
2. Verify the IP address is correct
3. Check firewall settings
4. Try a different port

### Screen Mirroring Issues

1. Ensure USB Debugging is enabled
2. Try switching between Standard and High-Performance modes
3. Restart the scrcpy server
4. Reconnect the device

---

## Credits

- **Developer**: hoangnv170752
- **Original Idea**: h1dr0n
- **Repository**: [GitHub](https://github.com/hoangnv170752/adb-compass)

---

*Last updated: March 2026*
