import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Search, 
  Plus, 
  Star, 
  Calendar, 
  FileText 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SidebarContent({
  notes,
  selectedId,
  onSelect,
  onAdd,
  searchTerm,
  onSearchChange,
  onToggleFavorite,
  favorOnly,
  onFavorOnlyChange,
  onOpenSettings,
  currentUser,
  onMobileClose
}) {
  // Group notes by month
  const groupedNotes = useMemo(() => {
    const groups = {};
    notes.forEach(note => {
      const d = new Date(note.createdAt);
      const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    });
    return groups;
  }, [notes]);

  return (
    <div className="flex flex-col h-full bg-sidebar-background text-sidebar-foreground">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        {currentUser && (
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search titles or content..."
            className="pl-9 bg-secondary/50 border-none"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Filters (Mockup style) */}
      <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
        <Button 
          variant={!favorOnly ? "default" : "secondary"} 
          size="sm" 
          className="rounded-full h-8"
          onClick={() => onFavorOnlyChange(false)}
        >
          All
        </Button>
        <Button 
          variant={favorOnly ? "default" : "secondary"} 
          size="sm" 
          className="rounded-full h-8 gap-1"
          onClick={() => onFavorOnlyChange(true)}
        >
          <Star className="h-3 w-3" /> Favorites
        </Button>
        {/* Placeholder filters for future features */}
         <Button variant="secondary" size="sm" className="rounded-full h-8 opacity-50 cursor-not-allowed">Work</Button>
         <Button variant="secondary" size="sm" className="rounded-full h-8 opacity-50 cursor-not-allowed">Personal</Button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-2">
        {Object.entries(groupedNotes).map(([month, groupNotes]) => (
          <div key={month} className="mb-6">
            <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {month}
              <Badge variant="secondary" className="ml-auto text-xs">{groupNotes.length}</Badge>
            </div>
            <div className="space-y-1">
              {groupNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => {
                    onSelect(note.id);
                    if (onMobileClose) onMobileClose();
                  }}
                  className={cn(
                    "group flex flex-col gap-2 rounded-lg p-3 text-sm transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    selectedId === note.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="truncate">{note.title || "Untitled"}</span>
                    {note.favorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  </div>
                  <div className="line-clamp-2 text-xs opacity-80">
                    {note.content?.slice(0, 100) || "No content"}
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-60">
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    {/* Mock tag */}
                    {/* <Badge variant="outline" className="text-[10px] h-4 py-0 px-1">Personal</Badge> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
         {notes.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              <p>No notes found.</p>
            </div>
          )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button className="w-full rounded-full gap-2 shadow-lg" onClick={onAdd} disabled={!currentUser}>
             <Plus className="h-5 w-5" /> New Note
          </Button>
      </div>
    </div>
  );
}
