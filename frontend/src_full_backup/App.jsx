import React, { useEffect, useState, useMemo } from "react";
import MainLayout from "@/components/MainLayout";
import SidebarContent from "@/components/SidebarContent";
import NoteDetail from "@/components/NoteDetail";
import SettingsDialog from "@/components/SettingsDialog";

export default function App() {
  // --- State ---
  const [currentUser, setCurrentUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
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
        else setNotes([]);
      });
  }, []);

  // 2. Poll for updates (simplified from original)
  useEffect(() => {
    if (!currentUser) return;
    function monthStr(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    }
    let active = true;
    const tick = () => {
      const ms = monthStr(new Date());
      fetch(`/api/notes?month=${encodeURIComponent(ms)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          setNotes((prev) => {
            const ids = new Set(prev.map((n) => n.id));
            const additions = data.filter((n) => !ids.has(n.id));
            if (!additions.length) return prev;
            return [...additions, ...prev];
          });
        })
        .catch(() => {});
    };
    // Poll every 30s
    const t = setInterval(tick, 30000);
    // Initial fetch for current month happens in loadNotes anyway, but this is for live updates
    // tick(); // skipping immediate tick to avoid double fetch race with loadNotes
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
      });
  }

  function addNote() {
    if (!currentUser) return;
    const payload = { title: "Untitled", content: "" };
    fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((n) => {
        setNotes((prev) => [n, ...prev]);
        setSelectedId(n.id);
      });
  }

  function saveNote({ title, content }) {
    if (!selectedId) return;
    const payload = { title, content };
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

  function deleteNote() {
    if (!selectedId) return;
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    fetch(`/api/notes/${selectedId}`, { method: "DELETE" })
      .then((r) => r.json())
      .then(() => {
        setNotes((prev) => prev.filter((n) => n.id !== selectedId));
        setSelectedId(null); 
        // Logic to select next note could go here
        const remaining = notes.filter(n => n.id !== selectedId);
        if (remaining.length > 0) {
            setSelectedId(remaining[0].id);
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
                (n.content || "").toLowerCase().includes(q)
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
  
  function openSettings() {
    setShowSettings(true);
    fetch("/api/users").then(r => r.json()).then(setUsers);
  }

  function handleLogin(username, password) {
    fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    }).then(r => r.json()).then(u => {
        if(u && !u.error) {
            setCurrentUser(u);
            loadNotes();
            // Optional: close settings if strictly login dialog, but here keep open maybe?
            // Actually usually you close it.
        } else {
            alert("Login failed");
        }
    });
  }

  function handleRegister(username, password) {
    fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    }).then(r => r.json()).then(u => {
        if(u && !u.error) {
            setCurrentUser(u);
            loadNotes();
        } else {
            alert("Registration failed");
        }
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
            if(data.error) { alert(data.error); return; }
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

  function handleImport() {
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
                if (!data.version || !data.userApiKey || !Array.isArray(data.notes)) {
                    alert("Invalid import format");
                    return;
                }
                if(confirm("Importing will replace all current notes. Continue?")) {
                    fetch("/api/notes/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
                    }).then(r => r.json()).then(res => {
                        alert(`Imported ${res.count} notes.`);
                        loadNotes();
                    });
                }
            } catch(err) {
                alert("Invalid JSON");
            }
        };
        reader.readAsText(file);
    };
    input.click();
  }


  return (
    <>
      <MainLayout
        sidebar={
          <SidebarContent
            notes={filteredNotes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={addNote}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            favorOnly={favorOnly}
            onFavorOnlyChange={setFavorOnly}
            onOpenSettings={openSettings}
            currentUser={currentUser}
          />
        }
      >
        <NoteDetail
          note={selectedNote}
          onSave={saveNote}
          onDelete={deleteNote}
          onBack={() => {
              // Only relevant for mobile to clear selection/show sidebar?
              // In this layout, on Mobile, the sidebar is a drawer.
              // So selecting a note should probably close the drawer?
              // OR if we are on mobile, we might want to navigate.
              // For now, MainLayout handles responsive.
              // NoteDetail takes the full screen on mobile?
              // Shadcn Layout: Sidebar is hidden on mobile until triggered.
              // NoteDetail is always visible in the 'main' area.
              // So on mobile, you open drawer -> select note -> drawer closes -> you see note.
              // No "Back" button needed strictly unless we are doing full page navigation logic.
          }}
          currentUser={currentUser}
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
      />
    </>
  );
}
