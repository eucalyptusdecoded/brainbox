# brainbox-mcp

MCP server for [Brainbox](https://brainboxllm.site) — connect your AI brain context to Claude Desktop and Claude Code.

## What it does

This MCP server fetches your Brainbox brain context and makes it available to Claude as a resource. Claude can read your brain's rules, memories, behaviours, guardrails, and skills automatically — no copy-pasting needed.

## Setup

### 1. Get your Brainbox API key

Go to **brainboxllm.site** → **Integration** → select your brain → generate an API key.

### 2. Configure Claude Desktop

Open your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following (replace the placeholders with your real values):

```json
{
  "mcpServers": {
    "brainbox": {
      "command": "npx",
      "args": ["-y", "brainbox-mcp"],
      "env": {
        "BRAINBOX_API_KEY": "your_api_key_here",
        "BRAINBOX_BRAIN_ID": "your_brain_id_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Quit Claude Desktop completely (Cmd+Q on macOS) and reopen it. You should see an MCP icon in the chat input — click it to verify the Brainbox resource is available.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BRAINBOX_API_KEY` | Yes | Your Brainbox API key (starts with `sk_bb_`) |
| `BRAINBOX_BRAIN_ID` | Yes | The ID of the brain to use |
| `BRAINBOX_URL` | No | Custom API URL (defaults to `https://brainboxllm.site`) |

## License

MIT
