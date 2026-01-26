import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "local-notes-mcp:sidebarCollapsed";

export default function MainLayout({ 
  children, 
  sidebar, 
  className,
  mobileView = 'list',
  isFullScreen = false
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <div className={cn("flex h-screen w-full bg-background overflow-hidden", className)}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden flex-col border-r bg-muted/10 print:hidden transition-all duration-300 ease-in-out relative",
        !isFullScreen && "md:flex",
        isSidebarCollapsed ? "w-[48px]" : "w-[350px]"
      )}>
        {React.isValidElement(sidebar) 
          ? React.cloneElement(sidebar, { isCollapsed: isSidebarCollapsed }) 
          : sidebar}
        
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent hidden md:flex"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>

      {/* Mobile Sidebar (Drawer) - For Detail View */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[80vw] sm:w-[300px] p-0 flex flex-col">
          {React.isValidElement(sidebar) 
             ? React.cloneElement(sidebar, { onMobileClose: () => setIsMobileMenuOpen(false) }) 
             : sidebar}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile List View: Renders sidebar directly when in list mode */}
        <div className={cn(
             "h-full flex-col md:hidden print:hidden", 
             mobileView === 'list' ? "flex" : "hidden"
        )}>
             {sidebar}
        </div>

        {/* Content / Mobile Detail View */}
        <div className={cn(
            "flex-1 flex flex-col h-full overflow-hidden relative",
            mobileView === 'detail' || mobileView === undefined ? "flex" : "hidden md:flex"
        )}>
            {/* Mobile Header trigger (Only in Detail Mode) */}
            <div className="md:hidden flex items-center p-4 border-b shrink-0 print:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
              <span className="ml-4 font-semibold">Local Notes</span>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
        </div>
      </main>
    </div>
  );
}
