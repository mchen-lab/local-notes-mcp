import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from 'react-textarea-autosize';
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ArrowUp,
  Share, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Save, 
  X,
  Printer,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MermaidBlock from "./MermaidBlock";
import ConfirmDialog from "@/components/ConfirmDialog";
import { MarkdownToolbar } from "@/components/MarkdownToolbar";
import { uploadImage } from "@/utils/upload";

// Reusable code block component with syntax highlighting
function CodeBlock({ inline, className, children }) {
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");
  
  // Detect dark mode from document
  const isDarkMode = typeof document !== 'undefined' && 
    document.documentElement.classList.contains('dark');
  
  // Handle Mermaid diagrams
  if (!inline && match && match[1] === "mermaid") {
    return <MermaidBlock chart={codeString} />;
  }
  
  // Syntax highlighted code block
  if (!inline && match) {
    return (
      <SyntaxHighlighter
        style={isDarkMode ? oneDark : oneLight}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: '1rem 0',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    );
  }
  
  // Inline code or code without language
  return (
    <code className={`${className || ''} bg-muted px-1.5 py-0.5 rounded text-sm font-mono`}>
      {children}
    </code>
  );
}

// Helper to extract tags
const extractTags = (text) => {
  if (!text) return [];
  const regex = /(?:^|\s)(#[a-zA-Z0-9_\-]+)(?=$|\s|[.,!?;:()])/g;
  const matches = [...(text.matchAll(regex) || [])];
  const tags = matches.map(m => m[1]);
  return [...new Set(tags)];
};

// Format date as YYYY/MM/DD HH:mm:ss (24-hour format) for View Mode
function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${y}/${m}/${day} ${h}:${min}:${sec}`;
}

// Helper to display tags
function TagList({ text, onTagClick }) {
  const tags = extractTags(text);
  if (tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map(tag => (
        <span 
          key={tag} 
          className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
          onClick={() => onTagClick && onTagClick(tag)}
          title="Click to search this tag"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export default function NoteDetail({ 
  note, 
  onSave, 
  onDelete, 
  onBack,
  currentUser,
  autoEdit,
  onAutoEditHandled,
  setIsUnsaved,
  onDiscardNew,
  isFullScreen,
  onToggleFullScreen,
  onSearchTag
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef(null);
  const splitRef = useRef(null);
  const textareaRef = useRef(null);
  const viewScrollRef = useRef(null);

  const [isCopied, setIsCopied] = useState(false);

  const lastNoteIdRef = useRef(null);
  const lastNoteUpdatedRef = useRef(null);
  const originalStateRef = useRef({ title: "", content: "" });
  const [hasNewVersion, setHasNewVersion] = useState(false);

  // Reset dirty state on view mode
  useEffect(() => {
    if (!isEditing && setIsUnsaved) {
      setIsUnsaved(false);
    }
  }, [isEditing, setIsUnsaved]);

  // Track dirty state
  useEffect(() => {
      if (isEditing && setIsUnsaved) {
          const isDirty = title !== originalStateRef.current.title || content !== originalStateRef.current.content;
          setIsUnsaved(isDirty);
      }
  }, [title, content, isEditing, setIsUnsaved]);

  useEffect(() => {
    if (note) {
      const noteChanged = note.id !== lastNoteIdRef.current;
      
      if (noteChanged) {
          lastNoteIdRef.current = note.id;
          lastNoteUpdatedRef.current = note.updatedAt;
          const t = note.title || "";
          const c = note.content || "";
          setTitle(t);
          setContent(c);
          originalStateRef.current = { title: t, content: c };
          setHasNewVersion(false);
          
          if (autoEdit) {
             setIsEditing(true);
             if (onAutoEditHandled) onAutoEditHandled();
          } else {
             setIsEditing(false);
          }
      } else {
          // Same ID, check for content update (e.g. from background merge)
          if (note.updatedAt !== lastNoteUpdatedRef.current) {
               // Check if the content is actually different from what we have locally as "original"
               // If we just saved, originalStateRef is updated to the new content.
               // So if the incoming note matches originalStateRef, it's likely our own save coming back.
               const isSameContent = 
                  (note.title || "") === originalStateRef.current.title && 
                  (note.content || "") === originalStateRef.current.content;

               if (isSameContent) {
                   // Content matches, just update the timestamp reference silently
                   lastNoteUpdatedRef.current = note.updatedAt;
               } else {
                   // Server has newer version with ACTUAL changes
                   setHasNewVersion(true);
               }
          }

          if (autoEdit) {
              setIsEditing(true);
              if (onAutoEditHandled) onAutoEditHandled();
          }
      }
    }
  }, [note, autoEdit, onAutoEditHandled]);

  // ... (resize logic skipped here, no change needed) ...

  // Handle Resize Dragging
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      if (!splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const ratio = Math.min(0.85, Math.max(0.15, x / rect.width));
      setSplitRatio(ratio);
    };
    const onUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging]);


  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
        setConfirmDialog({
            open: true,
            title: "Validation Error",
            description: "Title and Body cannot be empty.",
            isAlert: true
        });
        return;
    }
    onSave({ title, content });
    originalStateRef.current = { title, content }; // Update original state to match saved
    setIsEditing(false);
  };

  const [confirmDialog, setConfirmDialog] = useState({ 
     open: false, 
     title: "", 
     description: "", 
     onConfirm: null 
  });

  const handleCancel = () => {
    const isDirty = title !== originalStateRef.current.title || content !== originalStateRef.current.content;
    
    if (isDirty) {
        setConfirmDialog({
           open: true,
           title: "Unsaved Changes",
           description: "You have unsaved changes. Are you sure you want to discard them?",
           onConfirm: () => {
               // If it's a new note, discard it completely
               if (note.id === "new") {
                   onDiscardNew();
               } else {
                   // Reset to original state
                   setTitle(originalStateRef.current.title);
                   setContent(originalStateRef.current.content);
                   setIsEditing(false);
               }
               setConfirmDialog(prev => ({ ...prev, open: false }));
           }
        });
        return;
    }
    
    // Clean cancel
    if (note.id === "new") {
        onDiscardNew();
    } else {
        // Reset to original state
        setTitle(originalStateRef.current.title);
        setContent(originalStateRef.current.content);
        setIsEditing(false);
    }
  };

  const insertTextAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    
    // Restore cursor position after insertion
    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
    }, 0);
  };

  const handleRefresh = () => {
      // Check for unsaved changes first
      const isDirty = title !== originalStateRef.current.title || content !== originalStateRef.current.content;
      if (isDirty) {
          setConfirmDialog({
             open: true,
             title: "Unsaved Changes",
             description: "Usage of external tools has updated this note. updating will overwrite your unsaved changes. Continue?",
             confirmText: "Overwrite",
             isAlert: true,
             onConfirm: () => {
                 performRefresh();
                 setConfirmDialog(prev => ({ ...prev, open: false }));
             }
          });
      } else {
          performRefresh();
      }
  };

  const performRefresh = () => {
      if (!note) return;
      lastNoteUpdatedRef.current = note.updatedAt;
      setTitle(note.title || "");
      setContent(note.content || "");
      originalStateRef.current = { title: note.title || "", content: note.content || "" };
      setHasNewVersion(false);
  };

  const uploadImageAndGetMarkdown = async (file) => {
    try {
        const result = await uploadImage(file);
        return `![${result.alt || 'image'}](${result.url})`;
    } catch (error) {
        console.error("Image upload failed:", error);
        setConfirmDialog({
            open: true,
            title: "Upload Failed",
            description: `Failed to upload image: ${error.message}`,
            isAlert: true
        });
        return null;
    }
  };

  const handlePaste = async (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.indexOf("image") === 0);

    if (imageItems.length > 0) {
        e.preventDefault();
        
        const promises = imageItems.map(item => uploadImageAndGetMarkdown(item.getAsFile()));
        const results = await Promise.all(promises);
        const validMarkdown = results.filter(r => r !== null).join('\n');
        
        if (validMarkdown) {
            insertTextAtCursor(validMarkdown);
        }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length > 0) {
        const promises = imageFiles.map(file => uploadImageAndGetMarkdown(file));
        const results = await Promise.all(promises);
        const validMarkdown = results.filter(r => r !== null).join('\n');
        
        if (validMarkdown) {
            insertTextAtCursor(validMarkdown);
        }
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Optional: show error toast here if you had one
    }
  };
  const handleExport = () => { /* ... */ 
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground p-4 text-center">
        Select a note to view or create a new one.
      </div>
    );
  }

  // --- View Mode ---
  if (!isEditing) {
      // (View mode content)
     return (
      <div className="flex flex-col h-full bg-background relative">
        {/* Update Banner */}
        {hasNewVersion && (
            <div className="bg-blue-100 text-blue-800 px-4 py-2 text-sm flex items-center justify-between shrink-0">
                <span>A newer version of this note is available.</span>
                <Button variant="outline" size="sm" className="h-7 bg-white text-blue-800 hover:bg-blue-50 border-blue-200" onClick={handleRefresh}>
                    Refresh
                </Button>
            </div>
        )}
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            {onBack && (
               <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                 <ArrowLeft className="h-5 w-5" />
               </Button>
            )}
             {onToggleFullScreen && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onToggleFullScreen}
                  className="hidden md:flex"
                  title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                  {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
             )}
             <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">
                    View Mode 
                    {note.id !== "new" && <span className="ml-2 text-xs text-muted-foreground font-mono">ID: {note.id}</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                    {note.updatedAt ? formatDateTime(note.updatedAt) : 'Unsaved'}
                </span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} disabled={!currentUser}>
               <Pencil className="h-5 w-5" />
             </Button>
             <Button variant="ghost" size="icon" onClick={handleCopy}>
                {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
             </Button>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon">
                   <MoreHorizontal className="h-5 w-5" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={handleExport}>
                   <Download className="mr-2 h-4 w-4" /> Export MD
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => window.print()}>
                   <Printer className="mr-2 h-4 w-4" /> Print
                 </DropdownMenuItem>
                 {currentUser && (
                   <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onSelect={(e) => {
                            // Prevent menu from closing immediately if needed, or just trigger action
                            // In this case, standard behavior is fine, but onSelect is more reliable 
                            onDelete();
                        }} 
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                   </>
                 )}
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        {/* Content Viewer */}
        <ScrollArea 
          className="flex-1 p-6 md:p-12" 
          ref={viewScrollRef}
          onScrollCapture={(e) => {
            const scrollTop = e.target.scrollTop;
            setShowBackToTop(scrollTop > 300);
          }}
        >
            <div className="w-full">
              <h1 className="text-3xl font-bold mb-6 break-words">{title || "Untitled"}</h1>
              <TagList text={content} onTagClick={onSearchTag} />
              <Separator className="my-6" />
              <div className="markdown-body">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CodeBlock
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
        </ScrollArea>

        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            variant="secondary"
            size="icon"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all print:hidden"
            onClick={() => {
              if (viewScrollRef.current) {
                const viewport = viewScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                  viewport.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            }}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    );
  }

  // --- Edit Mode (Split View) ---
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Edit Toolbar */}
      <div className="flex items-center justify-between p-2 border-b shrink-0 gap-2">
         {/* Edit Mode Banner Overlay or Integrated? 
             Let's put it above the toolbar or inside. 
             Inside might crowd it. Above is consistent. 
         */}
         {hasNewVersion && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-blue-100 text-blue-800 px-4 py-1 text-sm flex items-center justify-between border-b border-blue-200">
                <span>Newer version available.</span>
                <Button variant="outline" size="sm" className="h-6 text-xs bg-white text-blue-800 hover:bg-blue-50 border-blue-200" onClick={handleRefresh}>
                    Refresh
                </Button>
            </div>
         )}
         
         <div className={`flex items-center gap-2 flex-1 min-w-0 ${hasNewVersion ? "mt-8" : ""}`}>
            {onToggleFullScreen && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={onToggleFullScreen}
                 className="hidden md:flex"
                 title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
               >
                 {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
               </Button>
            )}
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="font-bold border-none shadow-none focus-visible:ring-0 px-2 h-9 text-lg"
              placeholder="Note Title"
            />
         </div>
         <div className={`flex items-center gap-2 ${hasNewVersion ? "mt-8" : ""}`}>
             <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
             <Button size="sm" onClick={handleSave} className="gap-2">
               <Save className="h-4 w-4" /> Save
             </Button>
         </div>
      </div>

      {/* Split Pane - Desktop: CSS Grid side-by-side, Mobile: Editor only (pure CSS responsive) */}
      <div 
        className="flex-1 flex sm:grid overflow-hidden" 
        ref={splitRef}
        style={{
          // Grid columns only apply when display is grid (sm and up)
          gridTemplateColumns: `${splitRatio * 100}% 12px 1fr`
        }}
      >
        {/* Editor Pane - full width on mobile (flex), split width on desktop (grid) */}
        <div className="w-full sm:w-auto flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
             <MarkdownToolbar textareaRef={textareaRef} value={content} setValue={setContent} />
             <ScrollArea className="flex-1 w-full">
                <TextareaAutosize
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="w-full resize-none border-none shadow-none focus-visible:ring-0 p-4 font-mono text-base leading-relaxed bg-transparent outline-none"
                    placeholder="Write markdown here... Drag & drop or paste images."
                    minRows={20}
                  />
             </ScrollArea>
        </div>

        {/* Handle - hidden on mobile, visible on desktop */}
        <div 
            className="hidden sm:flex w-3 items-center justify-center cursor-col-resize bg-border/40 hover:bg-accent/50 transition-colors"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
        >
           <div className="w-px h-8 bg-border" />
        </div>

        {/* Preview Pane - hidden on mobile, visible on desktop */}
        <div className="hidden sm:flex flex-col min-w-0 min-h-0 bg-secondary/10">
             <div className="flex items-center h-[41px] px-2 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
               Preview
             </div>
             <ScrollArea className="flex-1 p-6">
                 <TagList text={content} onTagClick={onSearchTag} />
                 <div className="markdown-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
             </ScrollArea>
        </div>
      </div>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText={confirmDialog.onConfirm ? "Discard Changes" : "OK"}
        isAlert={confirmDialog.isAlert}
        cancelText={confirmDialog.isAlert ? null : "Cancel"}
      />
    </div>
  );
}
