import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Share, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Save, 
  X,
  Printer,
  Copy,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MermaidBlock from "./MermaidBlock";

export default function NoteDetail({ 
  note, 
  onSave, 
  onDelete, 
  onBack,
  currentUser
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const topRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "Untitled");
      setContent(note.content || "");
      // If it's a new note (assumed by specific conditions or passed prop, 
      // but here we can check if content is empty and it's a newly created one... 
      // For now, let's reset editing state unless we want to auto-edit new notes)
      // We will let the parent control auto-editing or handle it here if we had a isNew prop.
      // For now, just reset.
      setIsEditing(false);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [note]);

  // Expose a way to force edit mode (e.g. for new notes)
  // We can do this via a prop `initialMode` or by checking if the note is "fresh"
  // For now simple toggle is fine.

  const handleSave = () => {
    onSave({ title, content });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    // Could show a toast here
  };

  const handleExport = () => {
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
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a note to view
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background" ref={topRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {onBack && (
             <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
          )}
          <div className="text-sm text-muted-foreground">
             {/* Breadcrumbs or status */}
             {isEditing ? "Editing" : "View"}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {!isEditing ? (
             <>
               <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} disabled={!currentUser}>
                 <Pencil className="h-5 w-5" />
               </Button>
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon">
                     <MoreHorizontal className="h-5 w-5" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={handleCopy}>
                     <Copy className="mr-2 h-4 w-4" /> Copy Text
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={handleExport}>
                     <Download className="mr-2 h-4 w-4" /> Export Markdown
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => window.print()}>
                     <Printer className="mr-2 h-4 w-4" /> Print
                   </DropdownMenuItem>
                   {currentUser && (
                     <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                     </>
                   )}
                 </DropdownMenuContent>
               </DropdownMenu>
             </>
           ) : (
             <>
               <Button variant="ghost" className="text-muted-foreground" onClick={handleCancel}>
                 Cancel
               </Button>
               <Button onClick={handleSave}>
                 Save
               </Button>
             </>
           )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6 md:p-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 md:text-4xl h-auto py-2"
                placeholder="Note Title"
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[500px] resize-none border-none shadow-none focus-visible:ring-0 px-0 font-mono text-base bg-transparent p-0"
                placeholder="Start writing..."
              />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <h1 className="text-3xl font-bold mb-4">{title}</h1>
              <div className="text-sm text-muted-foreground mb-8">
                 Last edited {new Date(note.updatedAt).toLocaleString()}
              </div>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                className="markdown-body"
                components={{
                  code({ inline, className, children }) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!inline && match && match[1] === "mermaid") {
                      return <MermaidBlock chart={String(children).replace(/\n$/, "")} />;
                    }
                    return <code className={className}>{children}</code>;
                  },
                  // Optional: styling for other elements can go here
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
