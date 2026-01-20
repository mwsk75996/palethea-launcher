# Palethea Launcher - Identified Issues & Technical Debt

This document tracks identified issues, potential bugs, and missing features discovered during the code audit on January 20, 2026.

## 🔴 Critical Issues

### 1. ~~Playtime Data Loss on Exit~~ ✅ FIXED
- **Location:** `src-tauri/src/lib.rs` -> `launch_instance`
- **Fix Applied:** Session file (`active_session.json`) written on game launch, recovered on launcher startup if orphaned.

### 2. ~~Mutex Poisoning Risk~~ ✅ FIXED
- **Location:** `src-tauri/src/lib.rs` -> `AppState` usage
- **Fix Applied:** Changed `.lock().unwrap()` to `.lock().map_err(...)` for graceful error handling.

### 3. ~~Missing Natives Extraction~~ ✅ FIXED
- **Location:** `src-tauri/src/minecraft/launcher.rs`
- **Fix Applied:** Added `extract_natives()` and `extract_jar()` functions that extract native libraries from JARs with the `natives` field before launching.

### 4. ~~Conditional Arguments Skipped~~ ✅ FIXED
- **Location:** `src-tauri/src/minecraft/launcher.rs` -> `build_game_args`
- **Fix Applied:** Added `check_argument_rules()` function that properly evaluates OS and feature rules for complex arguments.

---

## 🟡 High Priority

### 1. ~~Inefficient State Synchronization~~ ✅ FIXED
- **Location:** `src/App.jsx`
- **Fix Applied:** Removed 5-second polling. Backend now emits `refresh-instances` event when instances are created, deleted, updated, or cloned.

### 2. ~~Mod Dependency Resolution~~ ✅ ALREADY IMPLEMENTED
- **Location:** `src/components/InstanceMods.jsx` lines 93-152
- **Status:** The frontend already checks for required dependencies, fetches dependency info, and shows a confirmation modal to install them. This was already working.

### 3. ~~Nuclear Creation Failure~~ ✅ FIXED
- **Location:** `src/App.jsx` -> `handleCreateInstance`
- **Fix Applied:** Instance is now created BEFORE downloading files, so even if download fails the instance exists in the UI and can be retried or deleted.

---

## 🔵 Medium Priority & UI/UX

### 1. ~~Resolution Settings Ignored~~ ✅ FIXED
- **Location:** `src-tauri/src/minecraft/launcher.rs`
- **Fix Applied:** `check_argument_rules` now accepts `has_custom_resolution` parameter. Resolution placeholders (`${resolution_width}`, `${resolution_height}`) are replaced in `process_arg_string`. Legacy versions get `--width` and `--height` appended manually if resolution is configured.

### 2. ~~Missing "Kill Process"~~ ✅ FIXED
- **Location:** `src-tauri/src/lib.rs`, `src/components/InstanceList.jsx`
- **Fix Applied:** Added global `RUNNING_PROCESSES` static to track running game PIDs. Added `kill_game` and `get_running_instances` Tauri commands. UI shows "Stop" button (red) when instance is running, polls every 2s for process state changes.

### 3. ~~Disk Cleanup / Uninstaller~~ ✅ FIXED
- **Location:** `src-tauri/src/lib.rs`
- **Fix Applied:** Added `get_disk_usage`, `get_downloaded_versions`, `delete_version`, and `clear_assets_cache` Tauri commands. `delete_version` checks if any instance uses the version before allowing deletion.

### 4. ~~Logo Reloading Jitter~~ ✅ FIXED
- **Location:** `src/components/InstanceList.jsx`
- **Fix Applied:** Added `useMemo` to create a `logoKey` that only changes when instance IDs or logo filenames change. The useEffect now depends on this stable key instead of the full instances array.

---

## 🟢 Implementation TODOs
- [x] ~~Forge / NeoForge Support~~ ✅ FIXED - Added `src-tauri/src/minecraft/forge.rs` with `install_forge()` and `install_neoforge()` functions. Added `install_forge` and `install_neoforge` Tauri commands. Installers are downloaded and run automatically. Fixed 1.21.1+ crash by filtering conflicting "Quick Play" arguments and loading modloader-specific `version.json` files during launch.
- [x] ~~Implement `copy_dir_recursive` robustness (symlinks)~~ ✅ FIXED - Updated function in `instances.rs` to detect symlinks and recreate them properly on both Unix and Windows.
- [x] ~~Add SHA1 verification for Fabric libraries~~ ✅ FIXED - Added `download_library_with_sha1()` in `fabric.rs` that verifies SHA1 hashes when provided. Re-downloads if hash mismatches.
- [x] ~~Handle Modrinth rate limiting~~ ✅ FIXED - Added `MODRINTH_SEMAPHORE` with 10 concurrent permits in `modrinth.rs`. All API calls now acquire a permit before executing.

---

## ✅ All Issues Resolved

All identified issues have been addressed as of January 20, 2026.
