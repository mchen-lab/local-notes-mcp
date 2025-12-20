import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Check, 
  Copy, 
  Info, 
  User, 
  Database, 
  Terminal, 
  ShieldCheck, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Merge,
  Download,
  Upload,
  Users as UsersIcon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import copy from "copy-to-clipboard";


export default function SettingsDialog({
  open,
  onOpenChange,
  currentUser,
  users, // list of existing users
  onLogin,
  onRegister,
  onLogout,
  onExport,
  onImport,
  onUpdateSettings,
  onRefreshUsers
}) {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sub-dialog states
  const [editUser, setEditUser] = useState(null); // { id, username }
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [mergeState, setMergeState] = useState(null); // { sourceUserId, targetUserId }

  // Edit form state
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);


  // Import state
  const [importReplace, setImportReplace] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({ 
     open: false, 
     title: "", 
     description: "", 
     onConfirm: null,
     isAlert: false
  });

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreConfirmInput, setRestoreConfirmInput] = useState("");

  const [fileToRestore, setFileToRestore] = useState(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleLogin = () => {
    onLogin(loginUsername, loginPassword);
    setLoginUsername("");
    setLoginPassword("");
  };

  const handleRegister = () => {
    if (registerPassword !== confirmPassword) {
         setConfirmDialog({
             open: true,
             title: "Validation Error",
             description: "Passwords do not match.",
             isAlert: true
         });
         return;
    }
    onRegister(registerUsername, registerPassword);
    setRegisterUsername("");
    setRegisterPassword("");
    setConfirmPassword("");
  };



  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
        setLoginUsername("");
        setLoginPassword("");
        setRegisterUsername("");
        setRegisterPassword("");
        setConfirmPassword("");
    }
  }, [open]);

  // MCP Config Logic
  const [userWithApiKey, setUserWithApiKey] = useState(null);
  const [configCopied, setConfigCopied] = useState(false);

  useEffect(() => {
    if (currentUser && open) {
       fetch("/api/users")
        .then((r) => r.json())
        .then((allUsers) => {
          const u = allUsers.find((u) => u.id === currentUser.id);
          setUserWithApiKey(u);
        });
    }
  }, [currentUser, open]);

  const mcpConfig = React.useMemo(() => {
     const apiKey = userWithApiKey?.api_key || currentUser?.apiKey;
     if (!apiKey) return null;
     const baseUrl = window.location.origin;
     return {
       mcpServers: {
         "notes-mcp": {
           "type": "sse",
           "url": `${baseUrl}/mcp/${apiKey}`
         }
       }
     };
  }, [userWithApiKey, currentUser]);



  const mcpStdioConfig = React.useMemo(() => {
     const apiKey = userWithApiKey?.api_key || currentUser?.apiKey;
     if (!apiKey) return null;
     const baseUrl = window.location.origin;
     return {
       "notes-mcp": {
         "command": "npx",
         "args": [
           "-y",
           "@gonzaloafidalgo/mcp-sse-bridge",
           `${baseUrl}/mcp/${apiKey}`
         ]
       }
     };
  }, [userWithApiKey, currentUser]);

  const mcpSseText = mcpConfig ? JSON.stringify(mcpConfig["mcpServers"]["notes-mcp"], null, 2) : "Loading...";
  const mcpStdioText = mcpStdioConfig ? JSON.stringify(mcpStdioConfig["notes-mcp"], null, 2) : "Loading...";

  const [sseCopied, setSseCopied] = useState(false);
  const [stdioCopied, setStdioCopied] = useState(false);

  const copySse = () => {
    if (!mcpConfig) return;
    const text = `"notes-mcp": ${mcpSseText}`;
    const success = copy(text);
    if (success) {
      setSseCopied(true);
      setTimeout(() => setSseCopied(false), 2000);
    }
  };

  const copyStdio = () => {
    if (!mcpStdioConfig) return;
    const text = `"notes-mcp": ${mcpStdioText}`;
    const success = copy(text);
    if (success) {
      setStdioCopied(true);
      setTimeout(() => setStdioCopied(false), 2000);
    }
  };

  // --- Admin Actions ---

  const handleEditClick = (u) => {
      setEditUser(u);
      setEditUsername(u.username);
      setEditPassword("");
      setEditConfirmPassword("");
      setEditIsAdmin(u.is_admin === 1);
  };

  const handleSaveEdit = () => {
      if (!editUser) return;
      const updates = {};
      if (editUsername !== editUser.username) updates.username = editUsername;
      
      if (editPassword) {
          if (editPassword !== editConfirmPassword) {
              setConfirmDialog({
                  open: true,
                  title: "Validation Error",
                  description: "Passwords do not match.",
                  isAlert: true
              });
              return;
          }
          updates.password = editPassword;
      }
      updates.is_admin = editIsAdmin ? 1 : 0;

      const isSelfUpdate = editUser.id === currentUser.id;
      const apiPath = isSelfUpdate && !currentUser.is_admin 
          ? "/api/users/current" 
          : `/api/admin/users/${editUser.id}`;

      fetch(apiPath, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
      })
      .then(r => r.json())
      .then(res => {
          if (res.error) {
              setConfirmDialog({
                  open: true,
                  title: "Update Failed",
                  description: res.error,
                  isAlert: true
              });
          } else {
              setEditUser(null);
              // Refresh users list
              if (onRefreshUsers) onRefreshUsers();
          }
      });
  };

  const handleDeleteClick = (id) => {
      setDeleteUserId(id);
  };

  const confirmDelete = () => {
      if (!deleteUserId) return;
      fetch(`/api/admin/users/${deleteUserId}`, {
          method: "DELETE"
      })
      .then(r => r.json())
      .then(res => {
          if (res.error) {
              setConfirmDialog({
                  open: true,
                  title: "Delete Failed",
                  description: res.error,
                  isAlert: true
              });
          } else {
              setDeleteUserId(null);
              if (onRefreshUsers) onRefreshUsers();
          }
      });
  };

  const handleMergeClick = (sourceId) => {
      setMergeState({ sourceUserId: sourceId, targetUserId: "" });
  };

  const confirmMerge = () => {
      if (!mergeState || !mergeState.targetUserId) return;
      fetch("/api/admin/users/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mergeState)
      })
      .then(r => r.json())
      .then(res => {
          if (res.error) {
              setConfirmDialog({
                  open: true,
                  title: "Merge Failed",
                  description: res.error,
                  isAlert: true
              });
          } else {
              setMergeState(null);
              setConfirmDialog({
                  open: true,
                  title: "Merge Successful",
                  description: "User data has been merged.",
                  isAlert: true
              });
              if (onRefreshUsers) onRefreshUsers();
          }
      });
  };



  const handleDownloadDb = () => {
    window.location.href = "/api/admin/database";
  };

  const handleUploadDb = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setFileToRestore(file);
      setRestoreConfirmInput("");
      setRestoreDialogOpen(true);
      
      // Reset input value so the same file can be selected again if cancelled
      e.target.value = null;
  };

  const proceedWithUpload = () => {
    if (!fileToRestore || restoreConfirmInput !== "restore") return;

    const formData = new FormData();
    formData.append("database", fileToRestore);

    fetch("/api/admin/database", {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(res => {
        if (res.error) {
            setConfirmDialog({
                open: true,
                title: "Restore Failed",
                description: res.error,
                isAlert: true
            });
        } else {
            setRestoreSuccess(true);
        }
    })
    .catch(err => {
         setConfirmDialog({
             open: true,
             title: "Upload Failed",
             description: err.message,
             isAlert: true
         });
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[700px] flex flex-col dark:bg-zinc-900 dark:border-zinc-700">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings, data, and application configuration.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="account" className="flex-1 flex flex-col min-h-0">
          <TabsList className="dark:bg-zinc-800 dark:border-zinc-700 flex-shrink-0">
            <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4"/> Account</TabsTrigger>
            <TabsTrigger value="mcp" className="gap-2"><Terminal className="h-4 w-4"/> MCP</TabsTrigger>
            {currentUser?.is_admin === 1 && (
                <>
                <TabsTrigger value="admin" className="gap-2"><UsersIcon className="h-4 w-4"/> Users</TabsTrigger>
                <TabsTrigger value="database" className="gap-2"><Database className="h-4 w-4"/> DB</TabsTrigger>
                </>
            )}
          </TabsList>

          <TabsContent value="account" className="p-4 mt-2 space-y-4">
             {currentUser ? (
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                       <User className="h-6 w-6 text-primary" />
                     </div>
                     <div>
                       <p className="font-medium">Signed in as</p>
                       <p className="text-sm text-muted-foreground">{currentUser.username}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleEditClick(currentUser)}>Edit</Button>
                        <Button variant="destructive" onClick={onLogout}>Sign Out</Button>
                   </div>
                 </div>

                 <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 bg-secondary/50 p-3 rounded-md h-full">
                     <input 
                         type="checkbox" 
                         id="theme-toggle"
                         className="h-4 w-4"
                         checked={(function() {
                             try {
                                 return JSON.parse(currentUser.settings || '{}').theme === 'dark';
                             } catch(e) { return false; }
                         })()}
                         onChange={(e) => {
                              const isDark = e.target.checked;
                              try {
                                  const currentSettings = JSON.parse(currentUser.settings || '{}');
                                  onUpdateSettings({ ...currentSettings, theme: isDark ? 'dark' : 'light' });
                              } catch(e) {
                                  onUpdateSettings({ theme: isDark ? 'dark' : 'light' });
                              }
                         }}
                     />
                     <Label htmlFor="theme-toggle">Dark Mode</Label>
                   </div>

                   <div className="flex flex-col bg-secondary/50 p-3 rounded-md h-full">
                     <Label className="text-xs mb-1">Grouping</Label>
                     <div className="flex flex-col gap-1">
                         {(function() {
                              let groupBy = 'month';
                              try { groupBy = JSON.parse(currentUser.settings || '{}').groupBy || 'month'; } catch(e) {}
                              
                              const updateGroupBy = (val) => {
                                 try {
                                    const currentSettings = JSON.parse(currentUser.settings || '{}');
                                    onUpdateSettings({ ...currentSettings, groupBy: val });
                                 } catch(e) {
                                    onUpdateSettings({ groupBy: val });
                                 }
                              };

                              return (
                                 <>
                                     <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                         <input 
                                             type="radio" 
                                             name="groupBy" 
                                             checked={groupBy === 'month'} 
                                             onChange={() => updateGroupBy('month')}
                                             className="accent-primary h-3 w-3"
                                         />
                                         <span>{new Date().toISOString().slice(0, 7)}</span>
                                     </label>
                                     <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                         <input 
                                             type="radio" 
                                             name="groupBy" 
                                             checked={groupBy === 'day'} 
                                             onChange={() => updateGroupBy('day')}
                                             className="accent-primary h-3 w-3"
                                         />
                                         <span>{new Date().toISOString().slice(0, 10)}</span>
                                     </label>
                                 </>
                              );
                         })()}
                     </div>
                   </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Export Data</h3>
                      <p className="text-sm text-muted-foreground mb-2">Download all your notes as a JSON file.</p>
                      <Button onClick={onExport} disabled={!currentUser}>Export Notes</Button>
                    </div>
                    <div className="border-t pt-4 dark:border-zinc-700">
                      <h3 className="font-medium mb-1">Import Data</h3>
                      <p className="text-sm text-muted-foreground mb-2">Import notes from a backup file.</p>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="import-replace"
                            className="h-4 w-4"
                            checked={importReplace}
                            onChange={(e) => setImportReplace(e.target.checked)}
                        />
                        <Label htmlFor="import-replace" className="cursor-pointer">Delete existing notes before import</Label>
                      </div>
                      <Button onClick={() => onImport({ replace: importReplace })} variant="outline" disabled={!currentUser}>Import Notes</Button>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="pt-4">
                 <Tabs defaultValue="login" className="w-full max-w-sm mx-auto">
                   <TabsList className="grid w-full grid-cols-2 mb-4">
                     <TabsTrigger value="login">Sign In</TabsTrigger>
                     <TabsTrigger value="register">Create Account</TabsTrigger>
                   </TabsList>
                   
                   <TabsContent value="login" className="space-y-4">
                     <div className="space-y-2">
                       <Label>Username</Label>
                       <Input maxLength={16} value={loginUsername} onChange={e => setLoginUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                     </div>
                     <div className="space-y-2">
                       <Label>Password</Label>
                       <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                     </div>
                     <Button className="w-full" onClick={handleLogin}>Login</Button>
                   </TabsContent>

                   <TabsContent value="register" className="space-y-4">
                     <div className="space-y-2">
                       <Label>Username</Label>
                       <Input maxLength={16} value={registerUsername} onChange={e => setRegisterUsername(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                       <Label>Password</Label>
                       <Input type="password" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} autoComplete="new-password" />
                     </div>
                     {registerPassword && (
                          <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                          </div>
                     )}
                     <Button className="w-full" onClick={handleRegister}>Register</Button>
                   </TabsContent>
                 </Tabs>
               </div>
             )}
          </TabsContent>



          <TabsContent value="mcp" className="p-4 mt-2 space-y-4">
             {currentUser ? (
               <div className="space-y-6">
                 
                 {/* STDIO Block */}
                 <div>
                    <h3 className="text-sm font-medium mb-2">Stdio (Bridge)</h3>
                    <div className="relative">
                        <ScrollArea className="h-[140px] w-full rounded-md border p-4 font-mono text-xs bg-muted/50 text-muted-foreground/90">
                            <pre>
{`"notes-mcp": ${mcpStdioText}`}
                            </pre>
                        </ScrollArea>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-background z-10"
                            onClick={copyStdio}
                            disabled={!mcpStdioConfig}
                        >
                            {stdioCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                 </div>

                 {/* SSE Block */}
                 <div>
                    <h3 className="text-sm font-medium mb-2">SSE (Direct)</h3>
                    <div className="relative">
                        <ScrollArea className="h-[100px] w-full rounded-md border p-4 font-mono text-xs bg-muted/50 text-muted-foreground/90">
                            <pre>
{`"notes-mcp": ${mcpSseText}`}
                            </pre>
                        </ScrollArea>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-background z-10"
                            onClick={copySse}
                            disabled={!mcpConfig}
                        >
                            {sseCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                 </div>

               </div>
             ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Please log in to view MCP configuration.
                </div>
             )}
          </TabsContent>

          {currentUser?.is_admin === 1 && (
            <TabsContent value="admin" className="p-4 mt-2 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">User Management</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Manage users, merge accounts.
                </p>
                <ScrollArea className="h-[320px] border rounded-md p-2">
                    <div className="space-y-2 pr-2">
                        {users && users.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {u.username}
                                            {u.is_super_admin ? (
                                                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/20">Super Admin</span>
                                            ) : u.is_admin === 1 && (
                                                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Admin</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ID: {u.id} • {u.note_count || 0} notes
                                            {u.last_note_at && (
                                                <span title={(() => {
                                                    const d = new Date(u.last_note_at);
                                                    const y = d.getFullYear();
                                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    const h = String(d.getHours()).padStart(2, '0');
                                                    const min = String(d.getMinutes()).padStart(2, '0');
                                                    const sec = String(d.getSeconds()).padStart(2, '0');
                                                    return `${y}/${m}/${day} ${h}:${min}:${sec}`;
                                                })()}>
                                                     • Last active: {(() => {
                                                        const d = new Date(u.last_note_at);
                                                        const y = d.getFullYear();
                                                        const m = String(d.getMonth() + 1).padStart(2, '0');
                                                        const day = String(d.getDate()).padStart(2, '0');
                                                        return `${y}/${m}/${day}`;
                                                     })()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {u.id === currentUser.id && (
                                        <span className="text-xs text-muted-foreground italic px-2">You</span>
                                    )}
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            
                                            {(!u.is_super_admin || u.id === currentUser.id) && (
                                                <DropdownMenuItem onClick={() => handleEditClick(u)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit User
                                                </DropdownMenuItem>
                                            )}

                                            {u.id !== currentUser.id && !u.is_super_admin && (
                                                <>
                                                <DropdownMenuItem onClick={() => handleMergeClick(u.id)}>
                                                  <Merge className="mr-2 h-4 w-4" /> Merge Into...
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteClick(u.id)}>
                                                  <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
          )}

          {currentUser?.is_admin === 1 && (
            <TabsContent value="database" className="p-4 mt-2 space-y-4">
                 <div className="flex items-center gap-2 mb-1">
                    <Database className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Database Management</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Download or restore the entire SQLite database file.
                </p>

                <div className="space-y-6">
                    <div className="border rounded-md p-4 bg-muted/20">
                        <h4 className="flex items-center gap-2 font-medium mb-2">
                            <Download className="h-4 w-4" /> Download Database
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                            Save a backup of the current <code>local_notes_mcp.db</code> file.
                        </p>
                        <Button variant="outline" onClick={handleDownloadDb}>
                            Download .db File
                        </Button>
                    </div>

                    <div className="border rounded-md p-4 border-destructive/20 bg-destructive/5">
                        <h4 className="flex items-center gap-2 font-medium mb-2 text-destructive">
                            <Upload className="h-4 w-4" /> Restore Database
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                            Upload a .db file to replace the current database. <span className="font-bold text-destructive">This is destructive and cannot be undone.</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="file" 
                                accept=".db,.sqlite,.sqlite3" 
                                onChange={handleUploadDb}
                                className="w-full max-w-sm" 
                            />
                        </div>
                    </div>
                </div>
            </TabsContent>
          )}


        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Edit Dialog */}
    <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit User: {editUser?.username}</DialogTitle>
                <DialogDescription>Modify username or reset password.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Username</Label>
                    <Input maxLength={16} value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                    <p className="text-xs text-muted-foreground">16 characters max</p>
                </div>
                <div className="space-y-2">
                    <Label>New Password (leave blank to keep current)</Label>
                    <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                </div>
                {editPassword && (
                    <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input type="password" value={editConfirmPassword} onChange={e => setEditConfirmPassword(e.target.value)} />
                    </div>
                )}
                <div className="flex items-center space-x-2 pt-2">
                    <input 
                        type="checkbox" 
                        id="edit-is-admin" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        disabled={!currentUser?.is_super_admin || editUser?.id === currentUser?.id}
                        checked={editIsAdmin}
                        onChange={e => setEditIsAdmin(e.target.checked)}
                    />
                    <Label htmlFor="edit-is-admin" className={(!currentUser?.is_super_admin || editUser?.id === currentUser?.id) ? "opacity-50" : ""}>Admin Access</Label>
                    <span className="text-xs text-muted-foreground ml-2">
                        {(!currentUser?.is_super_admin) 
                            ? "(Only Super Admin can change this)" 
                            : (editUser?.id === currentUser?.id) 
                                ? "(Cannot change your own admin status)" 
                                : "(Can manage users and system settings)"}
                    </span>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Delete Confirmation */}
    <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete this user? This action cannot be undone and will delete all their notes.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteUserId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete}>Delete User</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Merge Dialog */}
    <Dialog open={!!mergeState} onOpenChange={(open) => !open && setMergeState(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Merge User Data</DialogTitle>
                <DialogDescription>
                    Move all notes from the selected user into another user account. The source user will have 0 notes after this.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Target User (Receiver)</Label>
                    <Select onValueChange={(val) => setMergeState(prev => ({ ...prev, targetUserId: val }))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                            {users?.filter(u => u.id !== mergeState?.sourceUserId).map(u => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.username} (ID: {u.id})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setMergeState(null)}>Cancel</Button>
                <Button onClick={confirmMerge} disabled={!mergeState?.targetUserId}>Merge Notes</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>


    {/* Restore Database Confirmation Dialog */}
    <Dialog open={restoreDialogOpen} onOpenChange={(open) => {
        if (!open) {
            setRestoreDialogOpen(false);
            setFileToRestore(null);
            setRestoreSuccess(false);
            setRestoreConfirmInput("");
        }
    }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {restoreSuccess ? "Restore Successful" : "Confirm Database Restore"}
                </DialogTitle>
                {!restoreSuccess && (
                    <DialogDescription className="text-destructive font-medium">
                        Warning: This action is destructive and cannot be undone.
                    </DialogDescription>
                )}
            </DialogHeader>

            {restoreSuccess ? (
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-500">
                        <Check className="h-6 w-6" />
                        <p className="font-medium">Database has been successfully restored.</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        The application needs to reload to apply the new database.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        You are about to overwrite the current database with <strong>{fileToRestore?.name}</strong>. All existing data will be permanently lost.
                    </p>
                    <div className="space-y-2">
                        <Label>Type <span className="font-mono font-bold">restore</span> to confirm:</Label>
                        <Input 
                            value={restoreConfirmInput} 
                            onChange={e => setRestoreConfirmInput(e.target.value)}
                            placeholder="restore"
                            className="font-mono"
                        />
                    </div>
                </div>
            )}

            <DialogFooter>
                {restoreSuccess ? (
                    <Button onClick={() => window.location.reload()}>
                        Reload Page
                    </Button>
                ) : (
                    <>
                    <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
                    <Button 
                        variant="destructive" 
                        onClick={proceedWithUpload}
                        disabled={restoreConfirmInput !== "restore"}
                    >
                        Confirm Restore
                    </Button>
                    </>
                )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="OK"
        isAlert={confirmDialog.isAlert}
    />
    </>
  );
}
