import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function MainLayout({ 
  children, 
  sidebar, 
  className,
  mobileView = 'list',
  isFullScreen = false
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn("flex h-screen w-full bg-background overflow-hidden", className)}>
      {/* Desktop Sidebar */}
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden w-[350px] flex-col border-r bg-muted/10 print:hidden",
        !isFullScreen && "md:flex"
      )}>
        <ScrollArea className="h-full">
          {sidebar}
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar (Drawer) - For Detail View */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[80vw] sm:w-[300px] p-0">
          <ScrollArea className="h-full">
            {React.isValidElement(sidebar) 
              ? React.cloneElement(sidebar, { onMobileClose: () => setIsMobileMenuOpen(false) }) 
              : sidebar}
          </ScrollArea>
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
