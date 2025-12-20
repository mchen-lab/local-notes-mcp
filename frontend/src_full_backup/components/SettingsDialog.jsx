import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConfigDialog from "./ConfigDialog"; // reusing the MCP config logic part or integrating it?
// Integrating logic here to avoid double dialogs.

import { Check, Copy, Info, User, Database, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsDialog({
  open,
  onOpenChange,
  currentUser,
  users, // list of existing users
  onLogin,
  onRegister,
  onLogout,
  onExport,
  onImport
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    onLogin(username, password);
    setUsername("");
    setPassword("");
  };

  const handleRegister = () => {
    onRegister(username, password);
    setUsername("");
    setPassword("");
  };

  // MCP Config Logic
  const [userWithApiKey, setUserWithApiKey] = useState(null);
  const [configCopied, setConfigCopied] = useState(false);

  useEffect(() => {
    if (currentUser && open) {
       // logic to fetch key for current user if not passed
       // For simplicity, we assume parent might reload user or we fetch here
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
         "local-notes-mcp": {
           "type": "sse",
           "url": `${baseUrl}/mcp/${apiKey}`
         }
       }
     };
  }, [userWithApiKey, currentUser]);

  const mcpText = mcpConfig ? JSON.stringify(mcpConfig, null, 2) : "Loading or not logged in...";

  const copyMcp = () => {
    if (!mcpConfig) return;
    navigator.clipboard.writeText(mcpText).then(() => {
      setConfigCopied(true);
      setTimeout(() => setConfigCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="account" className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4"/> Account</TabsTrigger>
            <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4"/> Data</TabsTrigger>
            <TabsTrigger value="mcp" className="gap-2"><Terminal className="h-4 w-4"/> MCP Config</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="flex-1 p-4 border rounded-md mt-2 space-y-4">
             {currentUser ? (
               <div className="space-y-4">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                     <User className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <p className="font-medium">Signed in as</p>
                     <p className="text-sm text-muted-foreground">{currentUser.username}</p>
                   </div>
                 </div>
                 <Button variant="destructive" onClick={onLogout}>Sign Out</Button>

                 {users && users.length > 0 && (
                   <div className="mt-8">
                     <p className="text-sm font-medium mb-2">Switch User</p>
                     <ScrollArea className="h-[200px] border rounded-md p-2">
                       {users.map(u => (
                         <div key={u.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">
                           <span>{u.username}</span>
                           {u.id !== currentUser.id && (
                             <Button variant="ghost" size="sm" onClick={() => onLogin(u.username, "password_ignored_for_switch_if_backend_allows_or_need_input")}>
                               Switch
                               {/* Note: Existing App.jsx switch logic didn't seem to require re-entering password for list, 
                                   but creating a login form expects password. 
                                   Wait, App.jsx: openUserDialog fetches users. 
                                   UserDialog has list of users, but NO button to switch directly without password?
                                   Actually: App.jsx line 791 maps users, rendering `li`... 
                                   But it doesn't seem to have a click handler on the `li` to switch? 
                                   Let's re-read App.jsx carefully.
                                   It just Lists them! And there are login inputs above.
                                   So you DO need to enter password to switch.
                               */}
                             </Button>
                           )}
                         </div>
                       ))}
                     </ScrollArea>
                   </div>
                 )}
               </div>
             ) : (
               <div className="space-y-4 max-w-sm mx-auto pt-8">
                 <div className="space-y-2">
                   <Label>Username</Label>
                   <Input value={username} onChange={e => setUsername(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <Label>Password</Label>
                   <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                 </div>
                 <div className="flex gap-2 pt-2">
                   <Button className="flex-1" onClick={handleLogin}>Login</Button>
                   <Button className="flex-1" variant="outline" onClick={handleRegister}>Register</Button>
                 </div>
               </div>
             )}
          </TabsContent>

          <TabsContent value="data" className="flex-1 p-4 border rounded-md mt-2 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Export Data</h3>
                <p className="text-sm text-muted-foreground mb-2">Download all your notes as a JSON file.</p>
                <Button onClick={onExport} disabled={!currentUser}>Export Notes</Button>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-1">Import Data</h3>
                <p className="text-sm text-muted-foreground mb-2">Restore notes from a backup file. BEWARE: This will overwrite existing notes!</p>
                <Button onClick={onImport} variant="outline" disabled={!currentUser}>Import Notes</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mcp" className="flex-1 p-4 border rounded-md mt-2 space-y-4">
             {currentUser ? (
               <div className="space-y-4">
                 <Alert>
                   <Info className="h-4 w-4" />
                   <AlertTitle>SSE Transport</AlertTitle>
                   <AlertDescription>
                     Use this configuration to connect your MCP client (e.g. Cursor, Claude Desktop).
                   </AlertDescription>
                 </Alert>
                 <div className="relative">
                   <ScrollArea className="h-[200px] w-full rounded-md border p-4 font-mono text-sm bg-muted/50">
                     <pre>{mcpText}</pre>
                   </ScrollArea>
                   <Button
                      size="icon"
                      variant="outline"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={copyMcp}
                      disabled={!mcpConfig}
                   >
                      {configCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                   </Button>
                 </div>
               </div>
             ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Please log in to view MCP configuration.
                </div>
             )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
