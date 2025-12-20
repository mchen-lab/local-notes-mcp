import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy, Info } from "lucide-react";

export default function ConfigDialog({ open, onOpenChange, currentUser }) {
  const [userWithApiKey, setUserWithApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentUser && open) {
      setLoading(true);
      fetch("/api/users")
        .then((r) => r.json())
        .then((users) => {
          const user = users.find((u) => u.id === currentUser.id);
          setUserWithApiKey(user);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load user details:", err);
          setLoading(false);
        });
    }
  }, [currentUser, open]);

  const config = useMemo(() => {
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

  const text = config ? JSON.stringify(config, null, 2) : "Loading...";

  function copy() {
    if (!config) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>MCP Configuration</DialogTitle>
          <DialogDescription>
            Configure your MCP client to connect to this server.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
           {!loading && (
             <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p><strong>User:</strong> {currentUser?.username}</p>
                {userWithApiKey?.api_key && (
                  <p className="flex items-center gap-2">
                    <strong>API Key:</strong> 
                    <code className="bg-background px-1 py-0.5 rounded border">{userWithApiKey.api_key}</code>
                  </p>
                )}
             </div>
           )}

           <Alert>
             <Info className="h-4 w-4" />
             <AlertTitle>SSE Transport</AlertTitle>
             <AlertDescription>
               This server uses SSE (Server-Sent Events) for transport. The generated config handles this automatically.
             </AlertDescription>
           </Alert>

           <div className="relative">
             <ScrollArea className="h-[200px] w-full rounded-md border p-4 font-mono text-sm bg-muted/50">
               <pre>{text}</pre>
             </ScrollArea>
             <Button
                size="icon"
                variant="outline"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={copy}
                disabled={!config}
             >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
