import React, { useMemo, useState, useRef } from "react";
import { Virtuoso } from 'react-virtuoso';
import Logo from "./Logo";
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
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Trash2,
  Download,
  GitBranch,
  CheckSquare,
  X,
  MousePointer2,
  ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";

// Format date based on grouping type
// If grouped by month: show as YYYY/MM/DD
// If grouped by day: show as YYYY/MM/DD HH:MM:SS
function formatDateShort(dateStr, groupBy = 'month') {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  if (groupBy === 'day') {
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day}  ${h}:${min}`;
  }
  
  return `${y}/${m}/${day}`;
}

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
  onOpenAdmin,
  currentUser,
  onMobileClose,
  onBatchDelete,
  onBatchFavorite,
  onBatchExport,
  onBatchMerge
}) {
  // Extract tags from text
  const extractTags = (text) => {
    if (!text) return [];
    // Match hash tags: #tagname
    // Must be preceded by space or start of line
    // Must be followed by space, end of line, or punctuation
    const regex = /(?:^|\s)(#[a-zA-Z0-9_\-]+)(?=$|\s|[.,!?;:()])/g;
    const matches = [...(text.matchAll(regex) || [])];
    const tags = matches.map(m => m[1]); // m[1] is the capturing group
    return [...new Set(tags)]; // Unique tags
  };
  // Track collapsed months
  const [collapsedMonths, setCollapsedMonths] = useState(new Set());
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Back to top state
  const [showBackToTop, setShowBackToTop] = useState(false);
  const virtuosoRef = useRef(null);

  const toggleSelectionMode = () => {
      setIsSelectionMode(prev => {
          if (prev) {
              // Exiting selection mode, clear selection
              setSelectedIds(new Set());
              return false;
          }
           return true;
      });
  };

  const toggleSelected = (id) => {
      setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleBatchAction = (action) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      switch(action) {
          case 'delete': onBatchDelete && onBatchDelete(ids); break;
          case 'favorite': onBatchFavorite && onBatchFavorite(ids); break;
          case 'export': onBatchExport && onBatchExport(ids); break;
          case 'merge': onBatchMerge && onBatchMerge(ids); break;
      }
      // Optional: Exit selection mode after action? 
      // Often better to stay in it for Favorite/Export, but maybe exit for Delete/Merge?
      // Let's keep it simple and stay in mode, but maybe clear selection if items are gone (handled by App update).
  };
  
  // Get groupBy preference
  const groupBy = useMemo(() => {
    try {
      return JSON.parse(currentUser?.settings || '{}').groupBy || 'month';
    } catch(e) {
      return 'month';
    }
  }, [currentUser]);

  // Group notes
  const groupedNotes = useMemo(() => {
    const groups = {};
    notes.forEach(note => {
      const d = new Date(note.createdAt);
      let key;
      if (groupBy === 'day') {
        // YYYY-MM-DD
        key = d.toISOString().slice(0, 10);
      } else {
        // YYYY-MM
        key = d.toISOString().slice(0, 7);
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    });
    return groups;
  }, [notes, groupBy]);

  const monthKeys = Object.keys(groupedNotes);
  const allCollapsed = monthKeys.length > 0 && monthKeys.every(m => collapsedMonths.has(m));

  const toggleMonth = (month) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  const toggleAllMonths = () => {
    if (allCollapsed) {
      // Expand all
      setCollapsedMonths(new Set());
    } else {
      // Collapse all
      setCollapsedMonths(new Set(monthKeys));
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar-background text-sidebar-foreground">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="relative flex items-center ml-2">
             <Logo className="absolute left-1 top-1 z-0 scale-110" />
             <h1 className="text-2xl font-bold tracking-tight relative z-10 -ml-2 pointer-events-none">Notes</h1>
           </div>
           <Button variant="ghost" size="icon" onClick={onAdd} className="h-8 w-8 text-muted-foreground hover:text-foreground">
             <Plus className="h-5 w-5" />
           </Button>
        </div>
        <div className="flex items-center gap-1">

           {currentUser && (
             <>
               <span className="text-sm font-medium mr-1 truncate max-w-[100px]">{currentUser.username}</span>
               <Button variant="ghost" size="icon" onClick={onOpenSettings} title="Settings">
                  <Settings className="h-5 w-5" />
               </Button>
             </>
           )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search ID, title or content..."
            className="pl-9 bg-secondary/50 border-none"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Expand/Collapse All + Favorites Toggle */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={toggleAllMonths}
          title={allCollapsed ? "Expand all" : "Collapse all"}
        >
          {allCollapsed ? (
            <ChevronsDown className="h-4 w-4" />
          ) : (
            <ChevronsUp className="h-4 w-4" />
          )}
        </Button>
        <div className="flex items-center gap-1">
             <Button 
                variant={isSelectionMode ? "secondary" : "ghost"} 
                size="sm" 
                onClick={toggleSelectionMode} 
                title={isSelectionMode ? "Exit Selection Mode" : "Select Notes"}
                className={cn("h-8 gap-2", isSelectionMode ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
             >
                {isSelectionMode ? (
                  <X className="h-4 w-4" />
                ) : (
                  <MousePointer2 className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">Multi-select</span>
             </Button>
        </div>
        <Button 
          variant={favorOnly ? "secondary" : "ghost"} 
          size="sm" 
          className={cn("h-8 gap-2", favorOnly ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
          onClick={() => onFavorOnlyChange(!favorOnly)}
        >
          <Star className={cn("h-4 w-4", favorOnly && "fill-yellow-400 text-yellow-400")} />
          <span className="text-xs font-medium">Favorites</span>
        </Button>
      </div>

      {/* Batch Actions Bar */ }
      {isSelectionMode && (
          <div className="px-4 pb-2 flex items-center justify-between gap-1 animate-in slide-in-from-top-2 fade-in">
              <div className="text-xs font-medium text-muted-foreground mr-auto">
                  {selectedIds.size} selected
              </div>
              <div title="Toggle Favorite">
                  <Button size="icon" variant="ghost" onClick={() => handleBatchAction('favorite')} disabled={selectedIds.size === 0}>
                      <Star className="h-4 w-4" />
                  </Button>
              </div>
              <div title="Merge">
                  <Button size="icon" variant="ghost" onClick={() => handleBatchAction('merge')} disabled={selectedIds.size < 2}>
                      <GitBranch className="h-4 w-4" />
                  </Button>
              </div>
               <div title="Export">
                  <Button size="icon" variant="ghost" onClick={() => handleBatchAction('export')} disabled={selectedIds.size === 0}>
                      <Download className="h-4 w-4" />
                  </Button>
              </div>
              <div title="Delete">
                  <Button size="icon" variant="ghost" onClick={() => handleBatchAction('delete')} className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={selectedIds.size === 0}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
          </div>
      )}

      {/* Notes List with Virtualization (Non-Sticky Headers) */}
      {(() => {
          // 1. Prepare Data: Flatten groups into a single list
          const groups = Object.entries(groupedNotes);
          
          if (groups.length === 0) {
              return (
                <div className="flex-1 overflow-y-auto px-4 py-8 text-center text-muted-foreground">
                  <p>No notes found.</p>
                </div>
              );
          }

          // Flatten: [ {type:'header', month}, {type:'note', note}, ... ]
          const flatItems = [];
          
          groups.forEach(([month, groupNotes]) => {
              // Add Header
              flatItems.push({ type: 'header', month, count: groupNotes.length });
              
              // Add Notes if not collapsed
              if (!collapsedMonths.has(month)) {
                  groupNotes.forEach(note => {
                      flatItems.push({ type: 'note', note });
                  });
              }
          });

          // 2. Item Renderer that handles both types
          const itemContent = (index) => {
              const item = flatItems[index];

              if (item.type === 'header') {
                  const isCollapsed = collapsedMonths.has(item.month);
                  return (
                      <div className="mb-1 mt-4 first:mt-0"> {/* Spacing for headers, except first */}
                          <div 
                            className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => toggleMonth(item.month)}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <Calendar className="h-4 w-4" />
                            {item.month}
                            <Badge variant="secondary" className="ml-auto text-xs">{item.count}</Badge>
                          </div>
                      </div>
                  );
              }

              // It's a note
              const note = item.note;
              return (
                <div className="px-2 pb-1"> 
                    <div
                      onClick={() => {
                        if (isSelectionMode) {
                            toggleSelected(note.id);
                        } else {
                            onSelect(note.id);
                            if (onMobileClose) onMobileClose();
                        }
                      }}
                      className={cn(
                        "group flex flex-col gap-2 rounded-lg p-3 text-sm transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        selectedId === note.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {isSelectionMode && (
                                <div className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                                    selectedIds.has(note.id) ? "bg-primary text-primary-foreground" : "opacity-50"
                                )}>
                                    {selectedIds.has(note.id) && <CheckSquare className="h-3 w-3" />}
                                </div>
                            )}
                            <span className="break-words">{note.title || "Untitled"}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(note.id);
                          }}
                          className="p-1 rounded hover:bg-secondary/80 transition-colors flex-shrink-0"
                          title={note.favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star 
                            className={cn(
                              "h-4 w-4 transition-colors",
                              note.favorite 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-muted-foreground/40 hover:text-muted-foreground"
                            )} 
                          />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs opacity-60 mt-1">
                        <span>{formatDateShort(note.createdAt, groupBy)}</span>
                        
                        {/* Tags Display */}
                        {(() => {
                           const tags = extractTags(note.content || "");
                           if (tags.length === 0) return null;
                           // Show up to 3 tags
                           const displayTags = tags.slice(0, 3);
                           const hasMore = tags.length > 3;
                           
                           return (
                             <div className="flex items-center gap-1 ml-auto overflow-hidden">
                                {displayTags.map(tag => (
                                   <span key={tag} className="inline-flex items-center rounded-sm bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary break-all">
                                      {tag}
                                   </span>
                                ))}
                                {hasMore && <span className="text-[10px] opacity-70">+{tags.length - 3}</span>}
                             </div>
                           );
                        })()}
                      </div>
                    </div>
                </div>
              );
          };

          return (
            <div className="flex-1 relative">
             <Virtuoso 
                ref={virtuosoRef}
                className="h-full"
                totalCount={flatItems.length}
                itemContent={itemContent}
                /* Use overscan to keep UI smooth while scrolling fast */
                overscan={200}
                onScroll={(e) => {
                  const scrollTop = e.target.scrollTop;
                  setShowBackToTop(scrollTop > 300);
                }}
             />
             {/* Back to Top Button */}
             {showBackToTop && (
               <Button
                 variant="secondary"
                 size="icon"
                 className="absolute bottom-4 right-4 z-50 rounded-full shadow-lg hover:shadow-xl transition-all h-8 w-8"
                 onClick={() => {
                   if (virtuosoRef.current) {
                     virtuosoRef.current.scrollToIndex({ index: 0, behavior: 'smooth' });
                   }
                 }}
               >
                 <ArrowUp className="h-4 w-4" />
               </Button>
             )}
            </div>
          );
      })()}
    </div>
  );
}
