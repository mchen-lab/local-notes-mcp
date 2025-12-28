import React, { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import SidebarContent from "@/components/SidebarContent";
import NoteDetail from "@/components/NoteDetail";
import SettingsDialog from "@/components/SettingsDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoginScreen from "@/components/LoginScreen";

export default function App() {
  // --- State ---
  const [currentUser, setCurrentUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'detail'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [favorOnly, setFavorOnly] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [users, setUsers] = useState([]);

  // --- Effects ---

  // 1. Check current user & Initial Load
  useEffect(() => {
    fetch("/api/users/current")
      .then((r) => r.json())
      .then((u) => {
        setCurrentUser(u);
        if (u) loadNotes();
        else {
          setNotes([]);
          setIsLoading(false);
        }
      })
      .catch(() => setIsLoading(false));
  }, []);

  // 2. Poll for updates - fetch notes updated since last poll
  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    
    const tick = () => {
      // Get notes updated in the last 15 seconds (slightly more than poll interval for safety)
      const since = new Date(Date.now() - 15000).toISOString();
      fetch(`/api/notes?updated_since=${encodeURIComponent(since)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!active || !data.length) return;
          setNotes((prev) => {
            const existingIds = new Map(prev.map((n) => [n.id, n]));
            let updated = false;
            
            // Merge updates: update existing or add new
            for (const note of data) {
              if (existingIds.has(note.id)) {
                // Update existing note if it changed
                const existing = existingIds.get(note.id);
                if (existing.updatedAt !== note.updatedAt) {
                  existingIds.set(note.id, note);
                  updated = true;
                }
              } else {
                // New note - add it
                existingIds.set(note.id, note);
                updated = true;
              }
            }
            
            if (!updated) return prev;
            return Array.from(existingIds.values());
          });
        })
        .catch(() => {});
    };
    
    // Poll every 10s
    const t = setInterval(tick, 10000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [currentUser]);

  // 3. Search Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // 4. Persistence
  useEffect(() => {
    if (selectedId !== null) {
      localStorage.setItem("local-notes-mcp:selectedNoteId", String(selectedId));
    }
  }, [selectedId]);

  // --- Actions ---

  function loadNotes() {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data) => {
        setNotes(data);
        // Restore selection
        if (data.length) {
            const savedNoteId = localStorage.getItem("local-notes-mcp:selectedNoteId");
            let noteToSelect = null;
            if (savedNoteId) {
                noteToSelect = data.find(n => n.id === parseInt(savedNoteId, 10));
            }
            if (!noteToSelect) {
                // Default to latest
                noteToSelect = [...data].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            }
            setSelectedId(noteToSelect?.id || null);
        } else {
            setSelectedId(null);
        }
      })
      .finally(() => setIsLoading(false));
  }

  // State for auto-editing new notes
  const [autoEdit, setAutoEdit] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);

  function addNote() {
    if (!currentUser) return;
    
    // Create temporary client-side note
    const newNote = {
        id: "new",
        title: "",
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser.id
    };
    
    setNotes((prev) => [newNote, ...prev]);
    setAutoEdit(true); 
    setSelectedId("new");
    setIsUnsaved(false); 
    setMobileView("detail");
  }

  function discardNewNote() {
      setNotes((prev) => prev.filter(n => n.id !== "new"));
      setSelectedId(null);
      setMobileView("list");
  }

  function saveNote({ title, content }) {
    if (!selectedId) return;
    
    // Validation handled in NoteDetail but double check here or just proceed
    // The user requirement says "can't be empty", implying specific feedback or block.
    // NoteDetail will handle the UI feedback/block.
    
    const payload = { title, content };
    
    if (selectedId === "new") {
        // Create new note
        fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => r.json())
          .then((n) => {
            // Replace "new" with actual note
            setNotes((prev) => prev.map((x) => (x.id === "new" ? n : x)));
            setSelectedId(n.id);
          });
    } else {
        // Update existing
        fetch(`/api/notes/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => r.json())
          .then((n) => {
            setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
          });
    }
  }

  function deleteNote() {
    console.log("Delete Note requested for ID:", selectedId);
    if (!selectedId) return;
    
    setConfirmDialog({
        open: true,
        title: "Delete Note",
        description: "Are you sure you want to delete this note? This action cannot be undone.",
        confirmText: "Delete",
        onConfirm: () => {
             fetch(`/api/notes/${selectedId}`, { method: "DELETE" })
              .then((r) => r.json())
              .then(() => {
                setNotes((prev) => prev.filter((n) => n.id !== selectedId));
                setSelectedId(null); 
                // Logic to select next note
                const remaining = notes.filter(n => n.id !== selectedId);
                if (remaining.length > 0) {
                    setSelectedId(remaining[0].id);
                    setMobileView("detail"); // Stay in detail view of new note?
                } else {
                    setMobileView("list"); // No notes left, go to list
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
              });
        }
    });
  }

  function toggleFavorite(id) {
    if (!currentUser) return;
    fetch(`/api/notes/${id}/toggle-favorite`, { method: "POST" })
      .then((r) => r.json())
      .then((n) => {
        setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
      });
  }

  // --- Filter Logic ---
  const filteredNotes = useMemo(() => {
    const q = debouncedSearchTerm.trim().toLowerCase();
    let base = notes;

    if (q) {
        base = base.filter(
            (n) => 
                (n.title || "").toLowerCase().includes(q) ||
                (n.content || "").toLowerCase().includes(q) ||
                String(n.id) === q // Also match note ID
        );
    }
    
    if (favorOnly) {
        base = base.filter(n => n.favorite);
    }

    return [...base].sort((a, b) => {
       const da = new Date(a.createdAt || 0).getTime();
       const db = new Date(b.createdAt || 0).getTime();
       return db - da;
    });
  }, [notes, debouncedSearchTerm, favorOnly]);

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === selectedId) || null
  , [notes, selectedId]);


  // --- User / Settings Actions ---
  
  function refreshUsers() {
      fetch("/api/users").then(r => r.json()).then(setUsers);
  }

  function openSettings() {
    setShowSettings(true);
    refreshUsers();
  }

  function handleLogin(username, password) {
    return fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(u => {
        if(u && !u.error) {
            setCurrentUser(u);
            loadNotes();
            return { success: true };
        } else {
            return { success: false, error: u.error || "Login failed" };
        }
    })
    .catch(err => {
        console.error("Login error:", err);
        return { success: false, error: "Network or server error" };
    });
  }

  function handleRegister(username, password) {
    return fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(u => {
        if(u && !u.error) {
            setCurrentUser(u);
            loadNotes();
            return { success: true };
        } else {
            return { success: false, error: u.error || "Registration failed" };
        }
    })
    .catch(err => {
        console.error("Registration error:", err);
        return { success: false, error: "Network or server error" };
    });
  }

  function handleLogout() {
      fetch("/api/users/logout", { method: "POST" }).then(() => {
          setCurrentUser(null);
          setNotes([]);
          setSelectedId(null);
          setShowSettings(false);
      });
  }

  function handleExport() {
      fetch("/api/notes/export")
        .then(r => r.json())
        .then(data => {
            if(data.error) { 
                setConfirmDialog({
                    open: true,
                    title: "Export Error",
                    description: data.error,
                    isAlert: true
                });
                return; 
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `local-notes-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
  }

  function handleImport(options = {}) {
    const { replace = false } = options;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.notes || !Array.isArray(data.notes)) {
                    setConfirmDialog({
                        open: true,
                        title: "Import Error",
                        description: "Invalid format. File must contain a 'notes' list.",
                        isAlert: true
                    });
                    return;
                }
                const confirmMsg = replace 
                    ? "Importing will REPLACE all existing notes. This cannot be undone. Continue?" 
                    : "Importing will append notes to your existing collection. Continue?";
                
                setConfirmDialog({
                    open: true,
                    title: "Confirm Import",
                    description: confirmMsg,
                    confirmText: "Yes, Import",
                    onConfirm: () => {
                        fetch("/api/notes/import", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...data, mode: replace ? "replace" : "append" })
                        }).then(r => r.json()).then(res => {
                            if (res.error) {
                                setConfirmDialog({
                                    open: true,
                                    title: "Import Failed",
                                    description: res.error,
                                    isAlert: true
                                });
                            } else {
                                setConfirmDialog({
                                    open: true,
                                    title: "Import Successful",
                                    description: `Imported ${res.count} notes.`,
                                    isAlert: true,
                                    onConfirm: () => loadNotes()
                                });
                            }
                        });
                    }
                });
            } catch(err) {
                setConfirmDialog({
                    open: true,
                    title: "Import Error",
                    description: "Invalid JSON file.",
                    isAlert: true
                });
            }
        };
        reader.readAsText(file);
    };
    input.click();
  }



  // --- Batch Operations ---

  function handleBatchDelete(ids) {
    if (!ids || ids.length === 0) return;
    
    setConfirmDialog({
        open: true,
        title: `Delete ${ids.length} Notes`,
        description: "Are you sure you want to delete these notes? This action cannot be undone.",
        confirmText: "Delete",
        onConfirm: () => {
            const promises = ids.map(id => fetch(`/api/notes/${id}`, { method: "DELETE" }).then(r => r.json()));
            Promise.all(promises).then(() => {
                setNotes(prev => prev.filter(n => !ids.includes(n.id)));
                if (ids.includes(selectedId)) {
                    setSelectedId(null);
                    setMobileView("list");
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            });
        }
    });
  }

  function handleBatchFavorite(ids) {
      if (!ids || ids.length === 0) return;
      // We will just toggle them all for now, or we could set them all to true?
      // "Favorite" icon usually implies "Make favorite". If mixed/all favorite -> "Unfavorite"?
      // Let's implement simpler logic first: Toggle each. 
      // Better UX: If any is NOT favorite, make ALL favorite. If ALL are favorite, make ALL NOT favorite.
      
      const targetNotes = notes.filter(n => ids.includes(n.id));
      const allFavorited = targetNotes.every(n => n.favorite);
      const targetState = !allFavorited; // If all are fav, target is false (unfav). Else true (fav).

      // Optimistic update could be complex here, so we'll just wait for all
      const promises = ids.map(id => {
          // We don't have a direct "set favorite" endpoint, only toggle. 
          // So we check current state.
          const note = notes.find(n => n.id === id);
          if (note && note.favorite !== targetState) {
              return fetch(`/api/notes/${id}/toggle-favorite`, { method: "POST" }).then(r => r.json());
          }
          return Promise.resolve(null);
      });

      Promise.all(promises).then((results) => {
          const updates = results.filter(r => r !== null);
          setNotes(prev => prev.map(n => {
              const updated = updates.find(u => u.id === n.id);
              return updated ? updated : n;
          }));
      });
  }

  function handleBatchExport(ids) {
      if (!ids || ids.length === 0) return;
      const notesToExport = notes.filter(n => ids.includes(n.id));
      const data = {
          version: 1,
          userApiKey: "batch-export", // dummy
          notes: notesToExport
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-notes-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  function handleBatchMerge(ids) {
      if (!currentUser || !ids || ids.length < 2) return;
      
      const selectedNotes = notes.filter(n => ids.includes(n.id));
      // Sort descending by creation date (newest first)
      selectedNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const targetNote = selectedNotes[0];
      const sourceNotes = selectedNotes.slice(1);

      setConfirmDialog({
          open: true,
          title: "Merge Notes",
          description: `Merge ${sourceNotes.length} older notes into "${targetNote.title}"? \n\nThe older notes will be appended to the bottom of the newest note and then PERMANENTLY DELETED.`,
          confirmText: "Merge",
          onConfirm: () => {
              // We want to append older notes in chronological order (Oldest -> Newer) to the bottom?
              // "older notes to bottom of newest note". 
              // If we have A (oldest), B (middle), C (newest). Target is C.
              // Append A, then B? Or B then A? 
              // Usually "chronological log" implies A then B at the bottom.
              // Let's sort sources ascending (Oldest first)
              sourceNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
              
              let newContent = targetNote.content || "";
              
              for (const source of sourceNotes) {
                  const d = new Date(source.createdAt);
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  const h = String(d.getHours()).padStart(2, '0');
                  const min = String(d.getMinutes()).padStart(2, '0');
                  const sec = String(d.getSeconds()).padStart(2, '0');
                  const timestamp = `${y}/${m}/${day} ${h}:${min}:${sec}`;
                  newContent += `\n\n---\n# Merged from: ${source.title} (${timestamp})\n\n${source.content}`;
              }

              // 1. Update target note
              fetch(`/api/notes/${targetNote.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...targetNote, content: newContent })
              })
              .then(r => r.json())
              .then(updatedTarget => {
                  // 2. Delete source notes
                  const deletePromises = sourceNotes.map(n => fetch(`/api/notes/${n.id}`, { method: "DELETE" }));
                  
                  Promise.all(deletePromises).then(() => {
                      // Update local state: 
                      // - Update target
                      // - Remove sources
                      setNotes(prev => {
                          let next = prev.map(n => n.id === updatedTarget.id ? updatedTarget : n);
                          next = next.filter(n => !sourceNotes.find(s => s.id === n.id));
                          return next;
                      });
                      
                      setConfirmDialog(prev => ({ ...prev, open: false }));
                      // Optional: selection management? 
                  });
              });
          }
      });
  }


  // --- Dialog State ---
  const [confirmDialog, setConfirmDialog] = useState({ 
     open: false, 
     title: "", 
     description: "", 
     onConfirm: null 
  });

  // --- Mobile Logic ---

  const handleNoteSelect = (id) => {
      // Navigation Guard
      if (isUnsaved) {
         setConfirmDialog({
            open: true,
            title: "Unsaved Changes",
            description: "You have unsaved changes. Are you sure you want to discard them?",
            onConfirm: () => {
                setIsUnsaved(false);
                
                // If we were editing a "new" note and chose to discard, we must remove it
                if (selectedId === "new") {
                    setNotes(prev => prev.filter(n => n.id !== "new"));
                }
                
                setSelectedId(id);
                setMobileView("detail");
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
         });
         return;
      }
      // If we switch away from "new" note without being dirty (e.g. empty), logic in NoteDetail might handle it?
      // Or actually, if it's NOT dirty, it means the user created it and didn't type anything.
      // In that case, we should probably auto-cleanup "new" note too?
      // Current behavior for "clean" cancellation is handled in NoteDetail (handleCancel).
      
      // However, if I create new, don't type, and click another note:
      // isUnsaved is false.
      // selectedId changes.
      // The "new" note remains in the list as an empty artifact unless we clean it up.
      // Let's check:
      if (selectedId === "new") {
          setNotes(prev => prev.filter(n => n.id !== "new"));
      }

      setSelectedId(id);
      setMobileView("detail");
  };

  const handleBackToList = () => {
      setMobileView("list");
  };

  // --- Render ---

  // 5. Theme Application
  useEffect(() => {
    if (currentUser?.settings) {
      try {
        const settings = JSON.parse(currentUser.settings);
        if (settings.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (e) {
        console.error("Failed to parse settings for theme", e);
      }
    }
  }, [currentUser]);

  function handleUpdateSettings(newSettings) {
      return fetch("/api/users/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSettings)
      })
      .then(r => r.json())
      .then(updatedUser => {
          // Update local user state immediately
          setCurrentUser(prev => ({ ...prev, ...updatedUser }));
      });
  }

  // --- Render ---

  if (!currentUser) {
    return (
      <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <MainLayout
        mobileView={mobileView}
        isFullScreen={isFullScreen}
        sidebar={
          <SidebarContent
            notes={filteredNotes}
            selectedId={selectedId}
            onSelect={handleNoteSelect}
            onAdd={addNote}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onToggleFavorite={toggleFavorite}
            favorOnly={favorOnly}
            onFavorOnlyChange={setFavorOnly}
            onOpenSettings={openSettings}
            currentUser={currentUser}
            onBatchDelete={handleBatchDelete}
            onBatchFavorite={handleBatchFavorite}
            onBatchExport={handleBatchExport}
            onBatchMerge={handleBatchMerge}
          />
        }
      >

        <NoteDetail
          note={selectedNote}
          onSave={saveNote}
          onDelete={deleteNote}
          onBack={handleBackToList}
          currentUser={currentUser}
          autoEdit={autoEdit}
          onAutoEditHandled={() => setAutoEdit(false)}
          setIsUnsaved={setIsUnsaved}
          onDiscardNew={discardNewNote}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        />
      </MainLayout>
      
      <SettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings}
        currentUser={currentUser}
        users={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onExport={handleExport}
        onImport={handleImport}
        onUpdateSettings={handleUpdateSettings}
        onRefreshUsers={refreshUsers}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText={confirmDialog.confirmText || "Confirm"}
        isAlert={confirmDialog.isAlert}
      />
    </>
  );
}
