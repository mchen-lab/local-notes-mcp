# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2026-01-28

### Added
- **`<br>` Support in Tables** - Enabled manual line breaks in Markdown table cells using `rehype-raw` and `rehype-sanitize`

### Fixed
- **Docker Build Dependencies** - Updated Dockerfile to ensure new dependencies are installed during the build process

## [0.1.3] - 2026-01-26

### Added
- **Collapsible Sidebar (Desktop)** - Toggle button to collapse/expand sidebar, state persisted in localStorage
- **Right-Click Context Menu** - Context menu on note items with Edit, Open in New Tab, Bump to Top, Favorites, and Delete actions
- **Bump to Top** - Move notes to top of list by updating timestamps
- **Code Block Copy Button** - Hover to reveal copy button on fenced code blocks in view mode
- **Escape Key to Cancel Edit** - Press Escape in edit mode to cancel (with unsaved changes prompt)

### Changed
- Moved fullscreen toggle button to left side of "View Mode" label for better visibility

## [0.1.2] - 2026-01-20

### Added
- Pre-flight checks in release script (clean git, main branch, synced with remote)
- Docker Hub image publishing support
- Local development setup instructions

### Fixed
- Release script now includes package-lock.json

## [0.1.1] - 2025-12-18

### Added
- Display Git commit hash and application version in Settings
- Consolidated MCP configuration panel in Settings
- Docker relaunch script for easier container management
- Troubleshooting FAQ in documentation

### Changed
- Improved Docker image build and publishing workflow

## [0.1.0] - 2025-12-17

### Added
- Core note-taking functionality
- User registration and login
- MCP server with SSE and STDIO support
- Docker containerization
- Vite + React frontend
- Express.js backend
- Automatic admin user creation

---

## Version History

- **0.1.4** - Table `<br>` support and Docker build fixes
- **0.1.3** - Desktop UI enhancements (sidebar, context menu, code copy)
- **0.1.2** - Release tooling improvements
- **0.1.1** - Version display and MCP config consolidation
- **0.1.0** - Initial release with core features
