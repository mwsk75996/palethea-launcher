# Palethea Launcher

A custom Minecraft launcher built with Tauri and React. Lightweight, fast, and cross-platform.

![Palethea Launcher](https://img.shields.io/badge/Tauri-2.0-blue) ![React](https://img.shields.io/badge/React-19-61dafb)

## Features

- 🎮 **Instance Management** - Create and manage multiple Minecraft instances
- 📦 **Version Browser** - Browse and download any Minecraft version
- ⚡ **Fast & Lightweight** - Built with Tauri for a small footprint
- 🐧 **Cross-Platform** - Works on Windows and Linux
- 🔧 **Offline Mode** - Play without a Minecraft account

## Prerequisites

Before running the launcher, you need to install:

### 1. Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
After installation, restart your terminal or run:
```bash
source ~/.cargo/env
```

### 2. System Dependencies (Linux)

**Arch Linux:**
```bash
sudo pacman -S webkit2gtk-4.1 base-devel curl wget openssl appmenu-gtk-module gtk3 librsvg libvips
```

**Ubuntu/Debian:**
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### 3. Node.js
Make sure you have Node.js 18+ installed.

### 4. Java
Minecraft requires Java to run. Install Java 17+ (recommended):
```bash
# Arch Linux
sudo pacman -S jdk17-openjdk

# Ubuntu/Debian
sudo apt install openjdk-17-jdk
```

## Installation

```bash
# Clone/navigate to the project
cd PaletheaLauncher

# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Development

```bash
# Run the development server (Tauri + Vite)
npm run tauri:dev

# Run just the web frontend
npm run dev

# Build the application
npm run tauri:build
```

## Project Structure

```
PaletheaLauncher/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── App.jsx            # Main application
│   └── App.css            # Global styles
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── lib.rs         # Tauri commands
│   │   └── minecraft/     # Minecraft launcher logic
│   │       ├── versions.rs    # Version manifest handling
│   │       ├── downloader.rs  # File downloading
│   │       ├── instances.rs   # Instance management
│   │       └── launcher.rs    # Game launching
│   └── Cargo.toml         # Rust dependencies
└── package.json           # Node dependencies
```

## How It Works

1. **Version Fetching**: Downloads the version manifest from Mojang's API
2. **Asset Download**: Downloads game JARs, libraries, and assets
3. **Instance Creation**: Creates separate directories for each instance
4. **Game Launch**: Builds the correct classpath and JVM arguments to launch Minecraft

## License

MIT
