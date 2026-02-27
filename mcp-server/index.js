#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const API_KEY = process.env.BRAINBOX_API_KEY;
const BRAIN_ID = process.env.BRAINBOX_BRAIN_ID;
const BASE_URL = process.env.BRAINBOX_URL || "https://brainboxllm.site";

if (!API_KEY || !BRAIN_ID) {
  console.error("brainbox-mcp: BRAINBOX_API_KEY and BRAINBOX_BRAIN_ID environment variables are required.");
  process.exit(1);
}

const server = new McpServer({
  name: "brainbox",
  version: "1.0.0",
});

server.resource("brain-context", "brain://context", {
  description: "Your Brainbox brain context — rules, memories, behaviours, guardrails, and skills",
  mimeType: "text/plain",
}, async (uri) => {
  try {
    const response = await fetch(`${BASE_URL}/api/context/${BRAIN_ID}`, {
      headers: { "X-API-Key": API_KEY },
    });

    if (!response.ok) {
      const msg = response.status === 401
        ? "Invalid API key. Check your BRAINBOX_API_KEY."
        : `Failed to fetch brain context (HTTP ${response.status})`;
      console.error(`brainbox-mcp: ${msg}`);
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: ${msg}` }] };
    }

    const text = await response.text();
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text }],
    };
  } catch (err) {
    console.error("brainbox-mcp: Failed to fetch context:", err.message);
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: Could not connect to Brainbox API.` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("brainbox-mcp: Server running");
}

main().catch((err) => {
  console.error("brainbox-mcp: Fatal error:", err);
  process.exit(1);
});
