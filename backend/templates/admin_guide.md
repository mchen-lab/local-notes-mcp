# Admin Guide 🛡️

As an administrator, you have access to powerful management features.

---

## 👥 User Management

Access via **Settings > Users** tab:


### Edit Users ✏️
- Change username or password
- Toggle admin status (Super Admin only)

### Delete Users 🗑️
- Remove user and all their notes
- Super Admin cannot be deleted

### Merge Users 🔀
- Move all notes from one user to another
- Source user is deleted after merge

---

## 💾 Database Management

Access via **Settings > Admin** tab:

### Backup
- Click **Download Database** to save a `.db` file
- Schedule regular backups to prevent data loss

### Restore
- Upload a `.db` file to replace current database
> ⚠️ **Warning**: This will overwrite ALL current data!

---

## 🔐 Super Admin Notes

You are the **Super Admin** (first registered user):

- ✅ Can manage other admin's privileges
- ✅ Can edit any user
- ❌ Cannot be deleted by anyone
- ❌ Cannot have admin status removed
- ❌ Your notes cannot be merged/moved

---

## 📊 Quick Actions

| Action | Location | What it does |
| :--- | :--- | :--- |
| Edit User | Users tab | Change credentials |
| Delete User | Users tab | Remove user + notes |
| Merge | Users tab | Combine users |
| Backup DB | Admin tab | Download database |
| Restore DB | Admin tab | Upload database |
