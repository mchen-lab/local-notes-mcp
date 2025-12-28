import express from "express";
import {
  listUsers,
  getUserById,
  getUserByCreds,
  getUserCount,
  createUser,
  updateUser,
  createNote,
  getSuperAdminId,
} from "../../notesDb.js";
import {
  getUserIdFromCookie,
  getUserId,
} from "../middleware/auth.js";
import {
  WELCOME_NOTE_CONTENT,
  ADMIN_GUIDE_CONTENT,
  getMcpSetupGuideContent,
} from "../config/templates.js";
import config from "../config.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(listUsers());
});

router.get("/current", (req, res) => {
  const userId = getUserIdFromCookie(req);
  if (userId == null) return res.json(null);
  const user = getUserById(userId);
  if (!user) return res.json(null);
  
  const superAdminId = getSuperAdminId();
  const isSuperAdmin = superAdminId && user.id === superAdminId;

  res.json({ ...user, is_super_admin: isSuperAdmin } || null);

});

const MAX_USERNAME_LENGTH = config.maxUsernameLength;

router.put("/current", (req, res) => {
  const userId = getUserId(req);
  if (userId == null) return res.status(401).json({ error: "Unauthorized" });

  const { username, password } = req.body || {};
  const updates = {};
  
  if (username && username.length > MAX_USERNAME_LENGTH) {
    return res.status(400).json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or less` });
  }
  
  if (username) updates.username = username;
  if (password) updates.password = password;

  // Explicitly prevent is_admin changes here for safety, 
  // though updateUser logic might filter it, better safe.
  // actually updateUser doesn't filter, so we MUST filter here.
  // We only pass username/password.

  if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
  }

  try {
      // Check if trying to update username to existing one is handled by DB
      const updatedUser = updateUser(userId, updates);
      
      const superAdminId = getSuperAdminId();
      const isSuperAdmin = superAdminId && updatedUser.id === superAdminId;

      res.json({ ...updatedUser, is_super_admin: isSuperAdmin });
  } catch (err) {
      if (err.message === "Username already exists.") {
          return res.status(409).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
  }
});

router.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || typeof username !== "string")
    return res.status(400).json({ error: "username required" });
  if (username.length > MAX_USERNAME_LENGTH)
    return res.status(400).json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or less` });
  if (!password || typeof password !== "string")
    return res.status(400).json({ error: "password required" });
  
  try {
      const user = createUser({ username, password });
      const maxAge = config.sessionMaxAgeSeconds;
      res.setHeader(
        "Set-Cookie",
        `user_id=${encodeURIComponent(
          String(user.id)
        )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
      );

      // Inject welcome note
      createNote({
        title: "Welcome to Local Notes! 👋",
        content: WELCOME_NOTE_CONTENT
      }, user.id);

      // Inject MCP setup guide with user's API key
      const baseUrl = `http://localhost:${config.port}`;
      createNote({
        title: "MCP Setup Guide 🔌",
        content: getMcpSetupGuideContent(user.api_key, baseUrl)
      }, user.id);

      // Inject admin guide if admin
      if (user.is_admin) {
        createNote({
          title: "Admin Guide 🛡️",
          content: ADMIN_GUIDE_CONTENT
        }, user.id);
      }

      res.status(201).json(user);
  } catch (err) {
      if (err.message === "Username already exists.") {
          return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || typeof username !== "string")
    return res.status(400).json({ error: "username required" });
  if (!password || typeof password !== "string")
    return res.status(400).json({ error: "password required" });
  const user = getUserByCreds({ username, password });
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const maxAge = config.sessionMaxAgeSeconds;
  res.setHeader(
    "Set-Cookie",
    `user_id=${encodeURIComponent(
      String(user.id)
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  );
  res.json(user);
});

router.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", "user_id=; Path=/; Max-Age=0; SameSite=Lax");
  res.json({ ok: true });
});

router.put("/settings", (req, res) => {
  const userId = getUserId(req);
  if (userId == null) return res.status(401).json({ error: "Unauthorized" });
  
  const settings = req.body;
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "Settings must be a JSON object" });
  }

  try {
    const user = updateUser(userId, { settings });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
