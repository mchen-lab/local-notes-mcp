import React, { useMemo, useState, useEffect } from "react";

export default function MCPConfigDialog({ onClose, currentUser }) {
  const [userWithApiKey, setUserWithApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      // Fetch the current user's full details including API key
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
  }, [currentUser]);

  const config = useMemo(() => {
    // Only return config if we have a valid API key
    const apiKey = userWithApiKey?.api_key || currentUser?.apiKey;
    if (!apiKey) {
      return null;
    }

    const baseUrl = window.location.origin; // e.g., http://localhost:31111
    
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

    // Fallback for HTTP (non-HTTPS) contexts where navigator.clipboard is not available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback: use a temporary textarea
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
      document.body.removeChild(textarea);
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <div className="dialog-header">
          <div>MCP Config</div>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="dialog-body">
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            <strong>MCP Configuration</strong>
            <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
              This configuration is for user:{" "}
              <strong>{currentUser?.username || "..."}</strong>
            </p>
            {loading && (
              <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
                Loading API key...
              </p>
            )}
            {userWithApiKey && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                }}
              >
                <strong>API Key:</strong>{" "}
                <code style={{ wordBreak: "break-all" }}>
                  {userWithApiKey.api_key}
                </code>
              </div>
            )}
            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginTop: "0.5rem",
              }}
            >
              ✓ All notes created through this MCP connection will belong to
              you
            </p>
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.5rem",
                backgroundColor: "#e3f2fd",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            >
              <strong>Transport:</strong> SSE (Server-Sent Events)
              <br />
              <span style={{ fontSize: "0.8rem", color: "#666" }}>
                This uses SSE transport over HTTP. The URL protocol (http://) is just the base URL; the actual connection uses Server-Sent Events.
              </span>
            </div>
          </div>
          <pre>
            <code>{text}</code>
          </pre>
        </div>
        <div className="dialog-footer">
          <button 
            className="btn btn-accent" 
            onClick={copy}
            disabled={!config}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
