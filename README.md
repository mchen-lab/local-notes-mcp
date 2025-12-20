# Local Notes MCP

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)

A simple, local-first note-taking application designed for AI assistants and human users.

**Why Local Notes MCP?**

1.  **Secure Local Storage**: We often need to store sensitive information like API keys, passwords, or server addresses. Storing these on the cloud is risky. This app keeps your data 100% local, offering a much safer alternative.
2.  **AI Context Memory**: Coding agents need a place to summarize documents and persist context outside of the code editor. Current solutions are either complex cloud systems or lack MCP integration. This app serves as an external memory bank that both you and your AI can access.
3.  **Local-First Features**: Designed for your local machine, home lab, or internal network. It provides a rich feature set (Markdown, Mermaid, Hot-keys) without the bloat or privacy concerns of cloud-first apps.

## Quick Start

### Option 1: Docker (Recommended)

Run the application using Docker with a persistent volume for your notes. We recommend using the GitHub Container Registry image:

```bash
docker run -d \
  --name local-notes-mcp \
  -p 31111:31111 \
  -v local_notes_mcp_data:/app/data \
  ghcr.io/mchen-lab/local-notes-mcp:latest
```

**Alternative Images:**
- Docker Hub: `xychenmsn/local-notes-mcp:latest`

Open [http://localhost:31111](http://localhost:31111) in your browser.

### Option 2: Run Locally (Requires Node.js 18+)

1. Clone the repository:
   ```bash
   git clone https://github.com/mchen-lab/local-notes-mcp.git
   cd local-notes-mcp
   ```

2. Install and start:
   ```bash
   npm install
   ./restart.sh
   ```

Open [http://localhost:31111](http://localhost:31111) in your browser.

## Features

### Core Functionality
- 📝 **Markdown Editor**: Full Markdown support with live preview and syntax highlighting
- 📊 **Mermaid Diagrams**: Render flowcharts, sequence diagrams, and more with built-in Mermaid.js support
- ⭐ **Favorites**: Star notes for quick access; filter to show only favorites
- 🔍 **Search**: Search by note ID, title, or content
- 🏷️ **Tags**: Organize notes with inline `#hashtags` that are automatically extracted and displayed
- 📅 **Date Grouping**: Notes grouped by month or day with collapsible sections
- ⌨️ **Keyboard Shortcuts**: Efficient editing with keyboard shortcuts

### Batch Operations
- ✅ **Multi-select Mode**: Select multiple notes for batch operations
- 🗑️ **Batch Delete**: Delete multiple notes at once
- ⭐ **Batch Favorite**: Toggle favorite status for multiple notes
- 📥 **Batch Export**: Export selected notes as JSON
- 🔀 **Batch Merge**: Merge multiple notes into one (content appended chronologically)

### Import & Export
- 📤 **Export Notes**: Export individual notes or all notes as JSON
- 📥 **Import Notes**: Import notes from JSON format with preserved timestamps
- 🖨️ **Print Support**: Print notes with proper formatting

### Image Support
- 🖼️ **Image Upload**: Upload images via drag-and-drop or paste from clipboard
- 📷 **Inline Images**: Images are stored locally and displayed inline in notes

### User Management
- 🔐 **Multi-user Support**: Secure authentication with individual user accounts
- 👤 **Admin Panel**: Admins can manage users, reset passwords, and assign roles
- 🔑 **Super Admin**: First registered user becomes the protected Super Admin
- 🔀 **User Merge**: Admins can merge one user's notes into another user's account
- 💾 **Database Backup**: Admins can download/upload the entire database for backup

### AI Integration (MCP)
- 🤖 **MCP Server**: Built-in Model Context Protocol server for AI integration
- 🔌 **SSE Transport**: Connect AI clients via Server-Sent Events
- 🔑 **API Key Auth**: Secure MCP connections with per-user API keys
- 📋 **Easy Setup**: Copy MCP configuration directly from the settings dialog

### UI/UX
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚙️ **User Settings**: Customizable settings per user (dark mode, grouping preferences)
- 🔒 **Password Confirmation**: Secure password changes with confirmation field

## Multi-Platform Support

This application is built for both `linux/amd64` and `linux/arm64` architectures, ensuring compatibility with:
- **Windows** (via Docker Desktop / WSL2)
- **macOS** (Intel and Apple Silicon)
- **Linux** (x86_64 and ARM64)

## App Configuration (Environment Variables)

Configurations are managed via a `.env` file or Docker environment variables.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the server listens on | `31111` |
| `DB_PATH` | Path to the SQLite database file | `data/local_notes_mcp.db` |

## MCP Configuration

This application exposes an MCP server via SSE (Server-Sent Events). To use it with an AI client:

1. Login to the web app.
2. Click on **Settings** -> **MCP Config**.
3. Copy the configuration JSON which includes your API Key.
4. Add it to your MCP client configuration.

### Supported AI Clients
- **Cursor**: Add to your MCP settings
- **Claude Desktop**: Add to claude_desktop_config.json
- **Windsurf**: Add to MCP settings
- **Gemini CLI**: Add to MCP configuration
- **Kilo Code / Other MCP Clients**: Use the SSE endpoint with API key

**Note**: We support SSE transport. Configuration examples are provided in the app.

## Feedback & Support
 
 We welcome your feedback! The best way to help improve Local Notes MCP is by using it and reporting any issues you encounter.
 
 - **Found a bug?** Open an [Issue](https://github.com/mchen-lab/local-notes-mcp/issues)
 - **Have an idea?** Submit a feature request
 
 ### Technical Details
 
 This section is for transparency and for users who want to review the code or build from source.
 
 **Architecture**

The project uses a simplified architecture where a single Node.js server handles everything:

- **Port 31111**: Serves the React frontend (static or Vite HMR), the REST API, and the MCP SSE endpoint.
- **Backend**: Express.js server with SQLite database.
- **Frontend**: React + Vite with shadcn/ui components.

### Project Structure

```
local-notes-mcp/
├── backend/               # Express.js server
│   ├── src/
│   │   ├── routes/       # API routes (notes, users, admin, images)
│   │   └── middleware/   # Authentication middleware
│   ├── notesDb.js        # SQLite database layer
│   └── server.js         # Main server entry point
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── data/                 # SQLite database & uploaded images
└── docker-compose.yml    # Docker Compose configuration
```

### Building for Multiple Platforms

To build the Docker image for different platforms (e.g., Windows/Linux/macOS on x86 or ARM), you can use the provided script which leverages `docker buildx`:

```bash
./build_and_publish.sh
```

Or run the manual command:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t your-image-name:latest .
```

## Disclaimer

This software is provided "as is" without warranty of any kind. The authors are not responsible for any data loss, corruption, or other damages arising from the use of this software. **Always maintain your own backups.**

## License

MIT License. See [LICENSE](LICENSE) for details.
