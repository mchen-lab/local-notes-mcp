import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function MainLayout({ 
  children, 
  sidebar, 
  className 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn("flex h-screen w-full bg-background overflow-hidden", className)}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[280px] flex-col border-r bg-muted/10">
        <ScrollArea className="h-full">
          {sidebar}
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
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
        {/* Mobile Header trigger */}
        <div className="md:hidden flex items-center p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <span className="ml-4 font-semibold">Local Notes</span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
