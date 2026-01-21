# Agent Instructions

## General Rules
- **DO NOT** use browser built-ins like `alert()`, `confirm()`, or `prompt()`. We use custom components for this (e.g., `src/components/ConfirmModal.jsx`).
- **DO NOT** use terminal commands (`grep`, `cat`, `find`) to find or read code. Use your built-in tools like `read_file` or `grep_search`.
- **ONLY PUSH** to GitHub when explicitly instructed by the user.

## Release Process
When asked to release or push a new version:
1. **Ask** the user which version number they want to use (e.g., `v0.2.4`).
2. **Update** the following files with the new version:
   - `package.json`
   - `src-tauri/tauri.conf.json`
3. **Commit** the changes with a clear message including the version.
4. **Tag** the commit using `git tag -a vx.x.x -m "message"`.
5. **Push** both the branch and the tag simultaneously:
   `git push origin main && git push origin vx.x.x`

