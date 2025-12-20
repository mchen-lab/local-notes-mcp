import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data/images directory exists
// We assume server.js sets up the env, but we can resolve the path relative to project root
// Based on server.js: import.meta.url is backend/src/routes/images.js
// So project root is ../../../
const DATA_DIR = path.resolve(__dirname, "../../../data");
const IMAGES_DIR = path.join(DATA_DIR, "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMAGES_DIR);
  },
  filename: function (req, file, cb) {
    // Generate filename: YYYYMMDD_timestamp_originalName
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timestamp = now.getTime();
    const ext = path.extname(file.originalname);
    // Sanitize original name slightly to avoid weird chars
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, "_");
    
    cb(null, `${ymd}_${timestamp}_${name}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

const router = express.Router();

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded" });
  }

  // Return the URL path that server.js will serve
  // server.js will mount /images to DATA_DIR/images
  const url = `/images/${req.file.filename}`;
  
  res.json({
    url: url,
    alt: req.file.originalname,
    filename: req.file.filename
  });
});

export default router;
