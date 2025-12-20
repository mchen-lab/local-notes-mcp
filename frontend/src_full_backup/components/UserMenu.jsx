import React, { useState, useRef, useEffect } from "react";
import { UserIcon } from "@heroicons/react/24/outline";

export default function UserMenu({ currentUser, onSwitch, onLogout, onExport, onImport }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if clicking inside the menu or the button
      if (
        menuRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) {
      // Use click event on the next tick to allow button clicks to process first
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside, true);
      }, 0);
      return () => {
        document.removeEventListener("click", handleClickOutside, true);
      };
    }
  }, [isOpen]);

  const handleExport = () => {
    setIsOpen(false);
    onExport();
  };

  const handleImport = () => {
    setIsOpen(false);
    onImport();
  };

  const handleSwitch = () => {
    setIsOpen(false);
    onSwitch();
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        className="btn btn-ghost"
        onClick={() => setIsOpen(!isOpen)}
        title="User menu"
        aria-label="User menu"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <UserIcon style={{ width: 18, height: 18 }} />
        <span>{currentUser?.username || "User"}</span>
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 8,
            background: "var(--dialog-bg)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            boxShadow: "var(--shadow)",
            minWidth: "160px",
            zIndex: 1000,
            overflow: "hidden",
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            style={{
              width: "100%",
              textAlign: "left",
              borderRadius: 0,
              border: "none",
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
              padding: "8px 12px",
              flexShrink: 0,
            }}
            type="button"
          >
            Export All
          </button>
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleImport();
            }}
            style={{
              width: "100%",
              textAlign: "left",
              borderRadius: 0,
              border: "none",
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
              padding: "8px 12px",
              flexShrink: 0,
            }}
            type="button"
          >
            Import All
          </button>
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleSwitch();
            }}
            style={{
              width: "100%",
              textAlign: "left",
              borderRadius: 0,
              border: "none",
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
              padding: "8px 12px",
              flexShrink: 0,
            }}
            type="button"
          >
            Switch
          </button>
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{
              width: "100%",
              textAlign: "left",
              borderRadius: "0 0 10px 10px",
              border: "none",
              cursor: "pointer",
              padding: "8px 12px",
              flexShrink: 0,
              position: "relative",
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

