# MCP Setup Guide 🔌

Give your AI coding assistant persistent memory by connecting it to Local Notes via MCP (Model Context Protocol).

---

## What Can Your AI Do?

Once connected, your AI assistant can read, write, and manage your notes. Here are the 6 tools available:

| Tool | What It Does |
| :--- | :--- |
| `create_note` | Create a new note with title and content |
| `get_note` | Read a specific note by ID |
| `update_note` | Edit an existing note |
| `delete_note` | Remove a note |
| `list_recent_notes` | Get your latest notes |
| `search_notes` | Find notes by keyword |

### Example Prompts

Try these prompts with your AI coding assistant:

**📝 Creating Notes:**
> "Write what we have achieved so far into a note using MCP"
> "Create an architectural document about this project as a note using MCP"
> "Summarize our conversation into a note using MCP"

**📖 Reading Notes:**
> "Read note 136 using MCP before coding this new feature"
> "Search my notes for 'API design' using MCP"
> "List my recent notes using MCP"

**✏️ Updating Notes:**
> "Update note 136 with what we have done today using MCP"
> "Append our progress to the project log note using MCP"

---

## Step 1: Get Your Config

1. Click **Settings** (⚙️ gear icon)
2. Open the **MCP** tab
3. Copy the **Stdio** or **SSE** config

> 💡 **Which method to choose?**
> - **Stdio (Recommended)**: More reliable. Uses the `mcp-sse-bridge` package. Try this first!
> - **SSE**: Simpler but requires the app server to be running.

---

## Your API Key

Your personal API key: `{{API_KEY}}`

This key is embedded in all configs below. Each user has their own unique key.

---

## Step 2: Configure Your AI Agent

Copy the config for your AI agent and paste it into the `mcpServers` section of the config file.

---

### Cursor

**File location:**
- macOS/Linux: `~/.cursor/mcp.json`
- Windows: `%APPDATA%\Cursor\mcp.json`

**Or via UI:** Settings → Cursor Settings → MCP

**Stdio (Recommended):**
```json
"notes-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "@gonzaloafidalgo/mcp-sse-bridge",
    "{{BASE_URL}}/mcp/{{API_KEY}}"
  ]
}
```

**SSE:**
```json
"notes-mcp": {
  "type": "sse",
  "url": "{{BASE_URL}}/mcp/{{API_KEY}}"
}
```

---

### Claude Desktop

**File location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Stdio (Recommended):**
```json
"notes-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "@gonzaloafidalgo/mcp-sse-bridge",
    "{{BASE_URL}}/mcp/{{API_KEY}}"
  ]
}
```

**SSE:**
```json
"notes-mcp": {
  "type": "sse",
  "url": "{{BASE_URL}}/mcp/{{API_KEY}}"
}
```

---

### Claude Code (CLI)

**Stdio (Recommended):**
```bash
claude mcp add notes-mcp \
  --command "npx" \
  --args "-y" "@gonzaloafidalgo/mcp-sse-bridge" "{{BASE_URL}}/mcp/{{API_KEY}}"
```

**SSE:**
```bash
claude mcp add notes-mcp --transport sse --url {{BASE_URL}}/mcp/{{API_KEY}}
```

Or edit `~/.claude/settings.json` manually with the JSON configs above.

---

### Gemini CLI / Antigravity

**File location:**
- macOS/Linux: `~/.gemini/settings.json`
- Windows: `%USERPROFILE%\.gemini\settings.json`

**Stdio (Recommended):**
```json
"notes-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "@gonzaloafidalgo/mcp-sse-bridge",
    "{{BASE_URL}}/mcp/{{API_KEY}}"
  ]
}
```

**SSE:**
```json
"notes-mcp": {
  "type": "sse",
  "url": "{{BASE_URL}}/mcp/{{API_KEY}}"
}
```

Verify with: `/mcp` command in Gemini CLI

---

### Kilo Code (VS Code)

**Global config:** Open Kilo Code panel → Gear icon → MCP Servers → Edit Global MCP

**Project config:** Create `.kilocode/mcp.json` in project root

**Stdio (Recommended):**
```json
"notes-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "@gonzaloafidalgo/mcp-sse-bridge",
    "{{BASE_URL}}/mcp/{{API_KEY}}"
  ]
}
```

**SSE:**
```json
"notes-mcp": {
  "type": "sse",
  "url": "{{BASE_URL}}/mcp/{{API_KEY}}"
}
```

---

### Windsurf / Codeium

**File location:** `~/.codeium/windsurf/mcp_config.json`

**Stdio (Recommended):**
```json
"notes-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "@gonzaloafidalgo/mcp-sse-bridge",
    "{{BASE_URL}}/mcp/{{API_KEY}}"
  ]
}
```

**SSE:**
```json
"notes-mcp": {
  "type": "sse",
  "url": "{{BASE_URL}}/mcp/{{API_KEY}}"
}
```

---

## Step 3: Test the Connection

Try asking your AI:
> "List my notes using MCP"

or

> "Create a note titled 'Test' with content 'Hello from AI'"

---

## Troubleshooting

### "Connection refused" or "Server not found"
- **For SSE:** Make sure Local Notes is running
- Check the port matches (default: 5678)
- Try `http://127.0.0.1:5678` instead of `localhost`

### "Unauthorized" or "API key invalid"
- Verify your API key from Settings → MCP
- Make sure the URL path includes your API key: `/mcp/YOUR_API_KEY`

### Tools not showing up
- Restart your AI agent after config changes
- Check for JSON syntax errors in config file
- Verify server is running: visit `{{BASE_URL}}/health`

### Config changes not taking effect
- Close and reopen your AI agent completely
- Some agents require reopening the project

### Stdio not working?
- Ensure Node.js is installed and in your PATH
- Check that `npx` is available

### SSE not working?
- Try Stdio method instead (more reliable)
- Check if firewall is blocking localhost connections

---

## Need Help?

If you're still having issues, check:
1. Server logs in the terminal running Local Notes
2. Your AI agent's MCP debug logs
3. Network connectivity to `{{BASE_URL}}`
