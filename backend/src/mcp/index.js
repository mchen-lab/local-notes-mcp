import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { userContext } from "../middleware/context.js";
import {
  createNote,
  getNote,
  updateNote,
  searchNotes,
  deleteNote,
} from "../../notesDb.js";

const mcpServer = new McpServer({
  name: "local-notes-mcp",
  version: "0.1.0",
});

// Tool Definitions
// We standardize output by JSON.stringifying data into the 'text' field.
// This ensures compatibility with clients like Cursor.

mcpServer.registerTool(
  "create_note",
  {
    title: "Create note",
    description: "Create a new note. Use this tool when asked to 'write a note', 'take a note', 'document using notes', or to save information for later.",
    inputSchema: {
      title: z.string().describe("Note title"),
      content: z.string().describe("Note content (markdown allowed)"),
    },
  },
  async ({ title, content }) => {
    try {
      const userId = userContext.getStore();
      console.error("Creating note with userId:", userId);

      const note = createNote({ title, content }, userId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

mcpServer.registerTool(
  "get_note",
  {
    title: "Get note by ID",
    description: "Retrieve a note by its ID from the local-notes-mcp app",
    inputSchema: {
      id: z.number().int().positive().describe("Note ID"),
    },
  },
  async ({ id }) => {
    try {
      const userId = userContext.getStore();
      console.error("Getting note with id:", id, "userId:", userId);

      const note = getNote(id, userId);
      if (!note) {
        return {
          content: [{ type: "text", text: `Note ${id} not found` }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

mcpServer.registerTool(
  "update_note",
  {
    title: "Update note",
    description: "Update an existing note. Use this to edit, append, or modify documented information. You must possess the 'id' of the note to perform this update.",
    inputSchema: {
      id: z.number().int().positive().describe("Note ID"),
      title: z.string().optional().describe("New note title (optional)"),
      content: z.string().optional().describe("New note content (optional)"),
    },
  },
  async ({ id, title, content }) => {
    try {
      const userId = userContext.getStore();
      console.error("Updating note with id:", id, "userId:", userId);

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;

      if (Object.keys(updates).length === 0) {
        return {
          content: [{ type: "text", text: "No updates provided" }],
          isError: true,
        };
      }

      const note = updateNote(id, updates, userId);
      if (!note) {
        return {
          content: [{ type: "text", text: `Note ${id} not found` }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

mcpServer.registerTool(
  "list_recent_notes",
  {
    title: "List recent notes",
    description: "List recent notes. Use this to 'read notes', 'review notes', or see what has been documented recently.",
    inputSchema: {
      limit: z.number().int().positive().max(100).optional().describe("Optional: Maximum number of notes to return (default: 10, max: 100)"),
    },
  },
  async ({ limit = 10 }) => {
    try {
      const userId = userContext.getStore();
      const maxLimit = Math.min(limit || 10, 100); // Enforce max 100
      console.error("Listing recent notes with userId:", userId, `limit: ${maxLimit}`);

      const notes = searchNotes(userId, null, maxLimit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

mcpServer.registerTool(
  "search_notes",
  {
    title: "Search notes",
    description: "Search notes. Use this to find specific information within your notes, 'read notes' about a topic, or lookup documented details.",
    inputSchema: {
      keyword: z.string().describe("Search keyword to filter notes (case-insensitive, searches in title, content, and note ID if numeric)"),
      limit: z.number().int().positive().max(100).optional().describe("Optional: Maximum number of notes to return (default: 10, max: 100)"),
    },
  },
  async ({ keyword, limit = 10 }) => {
    try {
      const userId = userContext.getStore();
      const maxLimit = Math.min(limit || 10, 100); // Enforce max 100
      console.error("Searching notes with userId:", userId, `keyword: ${keyword}`, `limit: ${maxLimit}`);

      if (!keyword || !keyword.trim()) {
        throw new Error("keyword is required and cannot be empty");
      }

      const notes = searchNotes(userId, keyword.trim(), maxLimit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

mcpServer.registerTool(
  "delete_note",
  {
    title: "Delete note",
    description: "Delete a note by its ID from the local-notes-mcp app",
    inputSchema: {
      id: z.number().int().positive().describe("Note ID"),
    },
  },
  async ({ id }) => {
    try {
      const userId = userContext.getStore();
      console.error("Deleting note with id:", id, "userId:", userId);

      const note = deleteNote(id, userId);
      if (!note) {
        return {
          content: [{ type: "text", text: `Note ${id} not found` }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

export { mcpServer };
