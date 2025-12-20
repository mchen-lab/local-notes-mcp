
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { 
  initializeDb, 
  closeDb, 
  createUser,
  getSuperAdminId 
} from '../notesDb.js';
import adminRouter from '../src/routes/admin.js';

// Mock DB path to memory
process.env.DB_PATH = ":memory:";

const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

describe('Admin Route Permissions', () => {
    let superAdmin;
    let regularAdmin;

    beforeEach(() => {
        initializeDb(":memory:");
        superAdmin = createUser({ username: "SuperAdmin", password: "password123" });
        regularAdmin = createUser({ username: "RegularAdmin", password: "password123" });
    });

    afterEach(() => {
        closeDb();
        vi.clearAllMocks();
    });

    it('should block regular admin from deleting Super Admin', async () => {
        const { updateUser } = await import('../notesDb.js');
        updateUser(regularAdmin.id, { is_admin: 1 });
        
        const res = await request(app)
            .delete(`/api/admin/users/${superAdmin.id}`)
            .set('Cookie', [`user_id=${regularAdmin.id}`]);
            
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Super Admin cannot be deleted.");
    });

    it('should block regular admin from editing Super Admin', async () => {
        const { updateUser } = await import('../notesDb.js');
        updateUser(regularAdmin.id, { is_admin: 1 });
        
        const res = await request(app)
            .put(`/api/admin/users/${superAdmin.id}`)
            .send({ username: "NewName" })
            .set('Cookie', [`user_id=${regularAdmin.id}`]);
            
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Only Super Admin can modify their own account.");
    });

    it('should allow Super Admin to edit themselves', async () => {
        const res = await request(app)
            .put(`/api/admin/users/${superAdmin.id}`)
            .send({ username: "SuperAdminUpd" })
            .set('Cookie', [`user_id=${superAdmin.id}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.username).toBe("SuperAdminUpd");
    });

    it('should block merging Super Admin into another user', async () => {
        const { updateUser } = await import('../notesDb.js');
        updateUser(regularAdmin.id, { is_admin: 1 });
        
        const res = await request(app)
            .post('/api/admin/users/merge')
            .send({
                sourceUserId: superAdmin.id,
                targetUserId: regularAdmin.id
            })
            .set('Cookie', [`user_id=${regularAdmin.id}`]);
        
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Super Admin notes cannot be merged/moved.");
    });
});
