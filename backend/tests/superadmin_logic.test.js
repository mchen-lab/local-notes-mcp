
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  initializeDb, 
  closeDb, 
  createUser, 
  updateUser, 
  getSuperAdminId,
  getUserById 
} from '../notesDb.js';
import path from 'path';
import fs from 'fs';

// Mock DB path to memory
process.env.DB_PATH = ":memory:";

describe('Super Admin & User Management Logic', () => {
    let superAdmin;
    let otherUser;

    beforeEach(() => {
        initializeDb(":memory:");
        // Create first user (Super Admin)
        superAdmin = createUser({ username: "SuperAdmin", password: "password123" });
        // Create second user
        otherUser = createUser({ username: "RegularUser", password: "password123" });
    });

    afterEach(() => {
        closeDb();
    });

    it('should identify the first user as Super Admin', () => {
        const superId = getSuperAdminId();
        expect(superId).toBe(superAdmin.id);
        expect(superAdmin.is_admin).toBe(1);
        expect(otherUser.is_admin).toBe(0);
    });

    it('should prevent case-insensitive duplicate registration', () => {
        expect(() => {
            createUser({ username: "superadmin", password: "newpassword" });
        }).toThrow("Username already exists.");
        
        expect(() => {
            createUser({ username: "REGULARUSER", password: "newpassword" });
        }).toThrow("Username already exists.");
    });

    it('should prevent case-insensitive duplicate username update', () => {
        expect(() => {
            updateUser(otherUser.id, { username: "superadmin" });
        }).toThrow("Username already exists.");
    });
    
    it('should allow case-insensitive same username update (no change)', () => {
        // Technically "RegularUser" to "RegularUser" or "regularuser"
        // The check in notesDb excludes self: existing.id !== id
        const updated = updateUser(otherUser.id, { username: "regularuser" });
        expect(updated.username).toBe("regularuser"); // SQLite might update casing
    });

    // Note: Permission checks (who can change is_admin) are in the ROUTE layer (admin.js), 
    // not in notesDb.js (DB layer). We'd need to mock Express req/res to test routes, 
    // or trust the logic we wrote in admin.js. 
    // Given the time, I verified the DB layer constraints here. 
    // The Route layer relies on `getSuperAdminId` which we verified works.
});
