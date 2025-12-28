# Local Notes MCP

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)

A simple, local-first note-taking application designed for AI assistants and human users.

**Why Local Notes MCP?**

1.  **Peace of Mind (Local First)**: We often need to store sensitive information like API keys, passwords, or server addresses. Storing these on the cloud is risky. This app keeps your data 100% local, offering a much safer alternative.
2.  **AI Agent Memory**: Coding agents need a place to summarize documents and persist context outside of the code editor. Current solutions are either complex cloud systems or lack MCP integration. This app serves as an external memory bank that both you and your AI can access, allowing you to ask your agent to "retrieve notes from last week" or "append a summary of this session".

## Quick Start

### 1. Start the App

Run the application using Docker (works on Windows, Mac, and Linux):

```bash
docker run -d \
  --name local-notes-mcp \
  -p 31111:31111 \
  -v local_notes_mcp_data:/app/data \
  ghcr.io/mchen-lab/local-notes-mcp:latest
```

Open [http://localhost:31111](http://localhost:31111) in your browser.

### 2. Connect Your AI Agent (Claude Code Example)

You can connect Claude Code using the SSE transport (requires the app to be running):

```bash
claude mcp add notes-mcp --transport sse http://localhost:31111/mcp/YOUR_API_KEY
```

> **Note:** Get `YOUR_API_KEY` from **Settings -> MCP** in the web app.

### 3. Start Using It!

Ask your AI agent:

> "Use MCP to write a note of what we have done so far."
 
 ## Screenshots

 ### Main Interface
 ![Main Interface](assets/note_screen.png)
 *Clean, markdown-based note editing with smart tags and search.*

 ### Agent Integration
 ![Agent Integration](assets/claudecode_add_notes.png)
 *Seamlessly asking your AI agent to read and write notes.*

 ### Easy Configuration
 <img src="assets/mcp_config.png" width="400" alt="MCP Config" />
 <br/>
 *Simple setup for connecting to Claude, Cursor, and other MCP clients.*


 ## Features


### Core Functionality
- 📝 **Markdown Editor**: Full Markdown support with live preview.
- 🖼️ **Image Support**: Paste or drag & drop images directly into notes.
- 📊 **Mermaid Diagrams**: Render flowcharts and diagrams with built-in Mermaid.js.
- 🏷️ **Smart Tags**: Organize with `#hashtags`.
- 🔍 **Search**: Instant fuzzy search across all notes.
- 📅 **Date Grouping**: Organize notes by date.

### Agent Integration (MCP)
- 🤖 **Model Context Protocol**: Native support for connecting to AI agents.
- 🔌 **Dual Transport**: Supports both `stdio` (standard input/output) and `sse` (Server-Sent Events) connections.
- 🧠 **Long-Term Memory**: Agents can search, read, writing, and append to notes.

### Batch Operations
- ✅ **Multi-select**: Delete, export, or merge multiple notes at once.

### User Management
- 🔐 **Multi-user Support**: Secure authentication with individual user accounts.
- 👤 **Admin Panel**: Manage users and backups.

### UI/UX
- 🌙 **Dark Mode**: Toggle between light and dark themes.
- 📱 **Responsive Design**: Works on desktop and mobile.

## Multi-Platform Support

Since this application is built on Docker and Node.js, it runs on all major platforms:
- **macOS** (Intel & Apple Silicon)
- **Windows** (WSL2 / Docker Desktop)
- **Linux** (amd64 & arm64)

## App Configuration

Everything works out of the box with defaults, but these are the two most important configurations:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local port to access the app | `31111` |
| `JWT_SECRET` | Secret key for session security | (Generated on startup) |

## MCP Configuration

This application acts as an MCP Server.

**Supported & Tested on:**
- **Claude Code**: Stdio and SSE supported.
- **Cursor**: Stdio and SSE supported.
- **Antigravity**: Stdio supported.
- **Other Clients**: Most MCP clients should work with the SSE endpoint.


## Project Structure

```
local-notes-mcp/
├── backend/               # Express.js server & MCP implementation
├── frontend/             # Single-page React application
└── data/                 # SQLite database & uploaded images
```

## Feedback & Support

- **Found a bug?** Open an [Issue](https://github.com/mchen-lab/local-notes-mcp/issues)
- **Have an idea?** Submit a feature request


 ## Troubleshooting & FAQ
 
 ### How do I update to the latest version?
 Run the following command:
 
 ```bash
 docker pull ghcr.io/mchen-lab/local-notes-mcp:latest && \
 docker stop local-notes-mcp && \
 docker rm local-notes-mcp && \
 docker run -d --name local-notes-mcp -p 31111:31111 -v local_notes_mcp_data:/app/data ghcr.io/mchen-lab/local-notes-mcp:latest
 ```
 
 ### Can I connect to the server from another computer?
 Yes, you can connect to the server from another computer on the same local network using the server's IP address. However, note that **connecting via VPN or complex network setups might cause instability** with some MCP clients due to timeouts. If you experience issues, try connecting from the same machine or ensure a stable direct local connection.
 
 ## License

MIT License. See [LICENSE](LICENSE) for details.
