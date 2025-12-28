import express from "express";
import {
  listNotes,
  listNotesByCreatedRange,
  listNotesUpdatedSince,
  searchNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  toggleFavorite,
  getUserById,
  deleteAllNotesForUser,
  importNote,
} from "../../notesDb.js";
import { getUserId } from "../middleware/auth.js";

const router = express.Router();

router.get("/", (req, res) => {
  const userId = getUserId(req);
  const keyword = (req.query.keyword || "").toString().trim();
  const limitParam = req.query.limit;
  
  // Support keyword search with limit (for MCP tools: list_recent_notes and search_notes)
  if (keyword || limitParam) {
    const limit = limitParam ? Math.min(Math.max(1, Number(limitParam)), 100) : 10;
    return res.json(searchNotes(userId, keyword || null, limit));
  }
  
  // Support month filter (for backward compatibility)
  const month = (req.query.month || "").toString();
  if (month) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
      const start = new Date(y, m - 1, 1);
      const next = new Date(y, m, 1);
      return res.json(
        listNotesByCreatedRange(userId, start.toISOString(), next.toISOString())
      );
    }
  }
  
  // Support updated_since filter (for polling updates)
  const updatedSince = (req.query.updated_since || "").toString();
  if (updatedSince) {
    return res.json(listNotesUpdatedSince(userId, updatedSince));
  }
  
  // Default: return all notes (for frontend)
  res.json(listNotes(userId));
});

router.get("/export", (req, res) => {
  const userId = getUserId(req);
  if (userId == null) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const notes = listNotes(userId);
  const exportData = {
    version: "1.0",
    // userApiKey: user.api_key, // Removed for security
    username: user.username,
    exportedAt: new Date().toISOString(),
    notes: notes,
  };

  res.json(exportData);
});

router.post("/import", (req, res) => {
  const userId = getUserId(req);
  if (userId == null) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { version, notes, mode } = req.body || {};

  // Validate import data structure
  // relaxed validation: don't strictly require version, just notes array
  if (!Array.isArray(notes)) {
    return res.status(400).json({
      error: "Invalid import format. Must include notes array.",
    });
  }

  // Verify the API key matches the current user
  // Removed per user request: allow importing any json file
  /*
  if (userApiKey !== user.api_key) {
    return res.status(403).json({
      error: "API key mismatch. This export belongs to a different user.",
    });
  }
  */

  // Delete all existing notes for this user ONLY if mode is 'replace'
  if (mode === "replace") {
    deleteAllNotesForUser(userId);
  }

  // Import new notes
  let importedCount = 0;
  const errors = [];

  for (const noteData of notes) {
    try {
      if (
        typeof noteData.title === "string" &&
        typeof noteData.content === "string"
      ) {
        importNote(userId, {
          title: noteData.title,
          content: noteData.content,
          createdAt: noteData.createdAt,
          updatedAt: noteData.updatedAt,
          favorite: noteData.favorite,
        });
        importedCount++;
      } else {
        errors.push("Invalid note format: missing title or content");
      }
    } catch (err) {
      errors.push(`Failed to import note: ${err.message}`);
    }
  }

  if (errors.length > 0 && importedCount === 0) {
    return res.status(400).json({
      error: "Import failed",
      details: errors,
    });
  }

  res.json({
    success: true,
    count: importedCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const userId = getUserId(req);
  const note = getNote(id, userId);
  if (!note) return res.status(404).json({ error: "Not found" });
  res.json(note);
});

router.post("/", (req, res) => {
  const { title, content } = req.body || {};
  if (!title || typeof title !== "string")
    return res.status(400).json({ error: "title required" });
  if (typeof content !== "string")
    return res.status(400).json({ error: "content required" });

  const userId = getUserId(req);
  const note = createNote({ title, content }, userId);
  res.status(201).json(note);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, content, favorite } = req.body || {};

  const userId = getUserId(req);
  const note = updateNote(id, { title, content, favorite }, userId);
  if (!note) return res.status(404).json({ error: "Not found" });
  res.json(note);
});

router.post("/:id/toggle-favorite", (req, res) => {
  const id = Number(req.params.id);
  const userId = getUserId(req);
  const note = toggleFavorite(id, userId);
  if (!note) return res.status(404).json({ error: "Not found" });
  res.json(note);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const userId = getUserId(req);
  const removed = deleteNote(id, userId);
  if (!removed) return res.status(404).json({ error: "Not found" });
  res.json(removed);
});

export default router;
