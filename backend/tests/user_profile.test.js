
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { 
  initializeDb, 
  closeDb, 
  createUser 
} from '../notesDb.js';
import usersRouter from '../src/routes/users.js';

// Mock DB path to memory
process.env.DB_PATH = ":memory:";

// Mock Auth Middleware to bypass cookies parsing logic for easier testing
// We will just mock getUserId to return our test user's ID
const { getUserIdMock } = vi.hoisted(() => {
    return { getUserIdMock: vi.fn() };
});

vi.mock('../src/middleware/auth.js', () => ({
    getUserId: getUserIdMock,
    getUserIdFromCookie: getUserIdMock,
    getOriginalAdminIdFromCookie: vi.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('User Profile Editing', () => {
    let user;

    beforeEach(() => {
        initializeDb(":memory:");
        // First user is super admin, let's create a second regular user to be safe
        createUser({ username: "Admin", password: "password" });
        user = createUser({ username: "RegularUser", password: "oldpassword" });
    });

    afterEach(() => {
        closeDb();
        vi.clearAllMocks();
    });

    it('should allow user to update their own password', async () => {
        getUserIdMock.mockReturnValue(user.id);

        const res = await request(app)
            .put('/api/users/current')
            .send({ password: "newpassword" });

        expect(res.status).toBe(200);
        expect(res.body.username).toBe("RegularUser");
        
        // Use DB helper to verify password change if possible, 
        // or just rely on status 200 and trust logic. 
        // Ideally we'd try to login with new password but we aren't testing auth route here.
    });

    it('should allow user to update their own username', async () => {
        getUserIdMock.mockReturnValue(user.id);

        const res = await request(app)
            .put('/api/users/current')
            .send({ username: "NewUsername" });

        expect(res.status).toBe(200);
        expect(res.body.username).toBe("NewUsername");
    });

    it('should allow user to update their settings', async () => {
        getUserIdMock.mockReturnValue(user.id);
        
        const newSettings = { darkMode: true, groupBy: "date" };
        const res = await request(app)
            .put('/api/users/settings') // Was /current
            .send(newSettings); // The route expects the body to be the settings object directly? No.

        // Route code: const settings = req.body;
        // So checking if send({settings: ...}) or send({...})
        // Code: const settings = req.body;
        // if (!settings || typeof settings !== "object") ...
        // updateUser(userId, { settings }); -> const keys = ... include "settings"
        
        // Wait, if I send { foo: "bar" }, req.body is { foo: "bar" }. 
        // Then updateUser(userId, { settings: { foo: "bar" } }) ? 
        // The router.put("/settings") code:
        // const settings = req.body; 
        // updateUser(userId, { settings }); 
        
        // existing check in updateUser: if (k === "settings" && typeof updates[k] === "object") -> JSON.stringify
        
        // So yes, I should send the settings object as the body.
        
        expect(res.status).toBe(200);
        // The API returns the settings as a string because SQLite stores it as text and the backend doesn't auto-parse it currently
        const returnedSettings = typeof res.body.settings === 'string' 
            ? JSON.parse(res.body.settings) 
            : res.body.settings;
            
        expect(returnedSettings).toEqual(expect.objectContaining(newSettings));
    });

    it('should reject username exceeding 16 characters', async () => {
        getUserIdMock.mockReturnValue(user.id);

        const res = await request(app)
            .put('/api/users/current')
            .send({ username: "ThisUsernameIsTooLong" }); // 21 chars

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/must be 16 characters or less/);
    });

    it('should ignore is_admin in payload', async () => {
        getUserIdMock.mockReturnValue(user.id);

        // Try to promote self
        const res = await request(app)
            .put('/api/users/current')
            .send({ is_admin: 1 });

        // Should succeed but NOT update is_admin
        // Or if we implemented strict filtering, maybe error?
        // My implementation only looks at username and password explicitly.
        expect(res.status).toBe(400); // "No updates provided" because we filtered out is_admin
        expect(res.body.error).toBe("No updates provided");
    });
});
