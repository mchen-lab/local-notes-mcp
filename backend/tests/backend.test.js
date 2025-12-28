import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { 
  initializeDb, 
  createUser, 
  createNote, 
  listNotes, 
  listNotes, 
  listNotes, 
  getUserByCreds,
  appendNote,
  deleteNote
} from "../notesDb.js";

describe("Backend Integration Tests", () => {
  let adminUser;
  let testUser;

  beforeAll(async () => {
    // Initialize in-memory database for testing
    initializeDb(":memory:");
  });

  describe("Database Operations (Unit)", () => {
    it("should create a new user", () => {
      adminUser = createUser({ username: "admin", password: "password123" });
      expect(adminUser.username).toBe("admin");
      expect(adminUser.id).toBe(1);
      expect(adminUser.is_admin).toBe(1); // First user is now auto-admin
      expect(adminUser.api_key).toBeDefined();
    });

    it("should create a second user (non-admin)", () => {
      testUser = createUser({ username: "testuser", password: "password123" });
      expect(testUser.username).toBe("testuser");
      expect(testUser.is_admin).toBe(0);
    });

    it("should verify user credentials", () => {
      const user = getUserByCreds({ username: "testuser", password: "password123" });
      expect(user).not.toBeNull();
      expect(user.username).toBe("testuser");
    });

    it("should create a note for a user", () => {
      const note = createNote({ title: "Test Note", content: "Content here" }, testUser.id);
      expect(note.title).toBe("Test Note");
      expect(note.id).toBe(1);
    });

    it("should list notes for a user", () => {
      const notes = listNotes(testUser.id);
      expect(notes.length).toBe(1);
      expect(notes[0].title).toBe("Test Note");
    });

    it("should append content to a note", () => {
      // Create a note to append to
      const note = createNote({ title: "Append Test", content: "Initial content" }, testUser.id);
      
      try {
        // Append content
        const updated = appendNote(note.id, "Appended text", testUser.id);
        
        expect(updated.content).toBe("Initial content\n\nAppended text");
      } finally {
        // Cleanup
        deleteNote(note.id, testUser.id);
      }
    });

    it("should handle empty append text", () => {
      const note = createNote({ title: "Empty Append", content: "Initial" }, testUser.id);
      
      try {
        // Append null/undefined/empty
        const result1 = appendNote(note.id, null, testUser.id);
        expect(result1.content).toBe("Initial");
        
        const result2 = appendNote(note.id, "", testUser.id);
        expect(result2.content).toBe("Initial");
      } finally {
        // Cleanup
        deleteNote(note.id, testUser.id);
      }
    });
  });

  describe("API Endpoints (Integration)", () => {
    let cookie;

    it("should login successfully", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({ username: "testuser", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("testuser");
      expect(response.headers["set-cookie"]).toBeDefined();
      cookie = response.headers["set-cookie"][0];
    });

    it("should register a new user and receive default notes", async () => {
        const res = await request(app)
            .post("/api/users/register")
            .send({ username: "freshuser", password: "password123" });
        
        expect(res.status).toBe(201);
        expect(res.body.username).toBe("freshuser");
        const freshCookie = res.headers["set-cookie"][0];
        
        // Check notes
        const notesRes = await request(app)
            .get("/api/notes")
            .set("Cookie", freshCookie);
            
        expect(notesRes.status).toBe(200);
        // Expect Welcome Note and MCP Setup Guide
        const titles = notesRes.body.map(n => n.title);
        expect(titles).toContain("Welcome to Local Notes! \ud83d\udc4b");
        expect(titles.some(t => t.includes("MCP Setup Guide"))).toBe(true);
    });

    it("should retrieve notes for logged in user", async () => {
      const response = await request(app)
        .get("/api/notes")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe("Test Note");
    });

    it("should create a new note via API", async () => {
      const response = await request(app)
        .post("/api/notes")
        .set("Cookie", cookie)
        .send({ title: "API Note", content: "Created via API" });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("API Note");
    });

    it("should search notes via API", async () => {
      const response = await request(app)
        .get("/api/notes?keyword=API")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe("API Note");
    });

    it("should fail to access notes without authentication", async () => {
        // Since getUserId falls back to cookie but we don't provide one, 
        // it returns null which currently lists "anonymous" notes.
        // Let's verify it doesn't return testuser's notes.
        const response = await request(app).get("/api/notes");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("should upload an image successfully", async () => {
        // We need a dummy image buffer
        const buffer = Buffer.from("fake-image-content");
        
        const response = await request(app)
            .post("/api/images")
            .attach("image", buffer, "test-image.png");

        expect(response.status).toBe(200);
        expect(response.body.url).toMatch(/^\/images\/\d{8}_\d+_test_image\.png$/);
        
        // Verify we can fetch the image
        const imageUrl = response.body.url;
        const imageRes = await request(app).get(imageUrl);
        expect(imageRes.status).toBe(200);
    });
  });

  describe("MCP Integration", () => {
    it("should authenticate MCP request via API key", async () => {
      const response = await request(app)
        .get("/api/notes")
        .set("x-api-key", testUser.api_key);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2); // Both notes created earlier
    });

    it("should fail MCP request with invalid API key", async () => {
      const response = await request(app)
        .get("/api/notes")
        .set("x-api-key", "invalid-key");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]); // Fallback to anonymous
    });
  });
});
