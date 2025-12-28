import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getUserById,
  updateUser,
  deleteUser,
  mergeUserNotes,
  closeDb,
  initializeDb,
  getSuperAdminId,
} from "../../notesDb.js";
import {
  getUserId,
} from "../middleware/auth.js";
import config from "../config.js";

// We need __dirname to resolve DB path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Admin: Update any user
router.put("/users/:id", (req, res) => {
  const adminId = getUserId(req);
  if (adminId == null) return res.status(401).json({ error: "Unauthorized" });

  const admin = getUserById(adminId);
  if (!admin || !admin.is_admin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const targetId = Number(req.params.id);
  const updates = req.body || {};

  // Username length validation
  const MAX_USERNAME_LENGTH = config.maxUsernameLength;
  if (updates.username && updates.username.length > MAX_USERNAME_LENGTH) {
    return res.status(400).json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or less` });
  }

  // Protections for Super Admin
  const superAdminId = getSuperAdminId();
  if (targetId === superAdminId && adminId !== superAdminId) {
      return res.status(403).json({ error: "Only Super Admin can modify their own account." });
  }
  
  // Protect against changing is_admin via this route if needed, or allow it.
  // We'll allow username/password updates.
  // Check permissions for is_admin changes
  if (updates.hasOwnProperty("is_admin")) {
      const superAdminId = getSuperAdminId();
      const isSuperAdmin = superAdminId && adminId === superAdminId;

      if (!isSuperAdmin) {
          return res.status(403).json({ error: "Only Super Admin can manage admin privileges." });
      }
      
      if (targetId === superAdminId) {
          // If trying to change Super Admin's admin status
          if (!updates.is_admin) {
              return res.status(400).json({ error: "Super Admin cannot remove their own admin privileges." });
          }
          // If is_admin is true/1, just ignore it (remove from updates) so we don't trigger any potential weirdness,
          // though typically it just overwrites 1 with 1. 
          // Safest to delete it from updates so we don't write it if not needed, 
          // OR just let it pass. Let's let it pass but validation passed.
          // Actually, let's remove it to be clean.
          delete updates.is_admin;
      }
  }

  try {
      const updatedUser = updateUser(targetId, updates);
      res.json(updatedUser);
  } catch (err) {
      if (err.message === "Username already exists." || err.message.includes("UNIQUE constraint failed")) {
          return res.status(409).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: err.message });
  }
});

// Admin: Delete user
router.delete("/users/:id", (req, res) => {
  const adminId = getUserId(req);
  if (adminId == null) return res.status(401).json({ error: "Unauthorized" });

  const admin = getUserById(adminId);
  if (!admin || !admin.is_admin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const targetId = Number(req.params.id);
  if (targetId === adminId) {
      return res.status(400).json({ error: "Cannot delete yourself" });
  }

  const superAdminId = getSuperAdminId();
  if (targetId === superAdminId) {
      return res.status(403).json({ error: "Super Admin cannot be deleted." });
  }

  try {
      deleteUser(targetId);
      res.json({ success: true });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Admin: Merge users
router.post("/users/merge", (req, res) => {
  const adminId = getUserId(req);
  if (adminId == null) return res.status(401).json({ error: "Unauthorized" });

  const admin = getUserById(adminId);
  if (!admin || !admin.is_admin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const { sourceUserId, targetUserId } = req.body;
  
  if (!sourceUserId || !targetUserId) {
      return res.status(400).json({ error: "sourceUserId and targetUserId required" });
  }
  
  if (sourceUserId === targetUserId) {
      return res.status(400).json({ error: "Cannot merge user into themselves" });
  }

  const superAdminId = getSuperAdminId();
  if (sourceUserId === superAdminId) {
       return res.status(403).json({ error: "Super Admin notes cannot be merged/moved." });
  }

  try {
      mergeUserNotes(sourceUserId, targetUserId);
      // Optional: Delete source user after merge?
      // Requirement says: "after confirm, will theoretically clear this user's notes"
      // It implies notes are moved. The user account technically remains but empty.
      
      res.json({ success: true });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});



// Admin: Download Database
router.get("/database", (req, res) => {
  const adminId = getUserId(req);
  if (adminId == null) return res.status(401).json({ error: "Unauthorized" });

  const admin = getUserById(adminId);
  if (!admin || !admin.is_admin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const dbPath = config.dbPath;
  // Resolve absolute path same way as notesDb initializes it
  // Relative to project root
  let resolvedPath = dbPath;
  if (dbPath !== ":memory:" && !dbPath.startsWith("data/") && !path.isAbsolute(dbPath)) {
    resolvedPath = `data/${dbPath}`;
  }
  
  // NOTE: This resolves relative to where server.js WAS, which was `backend/`.
  // We need to match that logic. The original code used `path.resolve(__dirname, "..", resolvedPath)`.
  // Here, __dirname is `backend/src/routes`. So we need to go up two levels to get to `backend/`.
  // Then one more to get to root.
  const fullPath = resolvedPath === ":memory:" ? ":memory:" : path.resolve(__dirname, "../../..", resolvedPath);

  if (fullPath === ":memory:") {
      return res.status(400).json({ error: "Cannot download in-memory database" });
  }

  if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "Database file not found" });
  }

  res.download(fullPath, "local_notes_mcp.db");
});

// Configure multer for database upload
const upload = multer({ dest: "data/temp/" });

// Admin: Upload Database
router.post("/database", upload.single("database"), (req, res) => {
  const adminId = getUserId(req);
  if (adminId == null) {
      // Clean up temp file
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({ error: "Unauthorized" });
  }

  const admin = getUserById(adminId);
  if (!admin || !admin.is_admin) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Access denied. Admin only." });
  }

  if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
  }

  const dbPath = config.dbPath;
  let resolvedPath = dbPath;
  if (dbPath !== ":memory:" && !dbPath.startsWith("data/") && !path.isAbsolute(dbPath)) {
    resolvedPath = `data/${dbPath}`;
  }
  // Adjust path resolution for new file location
  const fullPath = resolvedPath === ":memory:" ? ":memory:" : path.resolve(__dirname, "../../..", resolvedPath);

  if (fullPath === ":memory:") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Cannot upload to in-memory database" });
  }

  try {
      // 1. Close existing DB connection
      closeDb();

      // 2. Replace file
      if (fs.existsSync(fullPath)) {
          fs.copyFileSync(fullPath, fullPath + ".bak");
      }

      fs.copyFileSync(req.file.path, fullPath);
      
      // 3. Re-initialize DB
      initializeDb();

      // 4. Clean up temp file
      fs.unlinkSync(req.file.path);

      res.json({ success: true });
  } catch (err) {
      console.error("Database upload failed:", err);
      // Try to restore?
      try {
          if (fs.existsSync(fullPath + ".bak")) {
              fs.copyFileSync(fullPath + ".bak", fullPath);
              initializeDb();
          }
      } catch (restoreErr) {
          console.error("Failed to restore backup:", restoreErr);
      }
      
      if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to replace database: " + err.message });
  }
});

export default router;
