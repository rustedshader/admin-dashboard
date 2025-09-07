import { Bell, Map, Home, HelpCircle, Plane } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="bg-card border-b border-border shadow-sm px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and App Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Map className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Paryatak Sarthi</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 text-foreground hover:text-primary">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          
          <Link href="/map" className="flex items-center space-x-2 text-foreground hover:text-primary">
            <Map className="w-5 h-5" />
            <span>Map Tool</span>
          </Link>
          
          <Link href="/help" className="flex items-center space-x-2 text-foreground hover:text-primary">
            <HelpCircle className="w-5 h-5" />
            <span>Provide Help</span>
          </Link>
          
          <Link href="/transport" className="flex items-center space-x-2 text-foreground hover:text-primary">
            <Plane className="w-5 h-5" />
            <span>Transport Guide</span>
          </Link>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;