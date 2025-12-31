import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Keyboard, BarChart2, User, Settings, Trophy, LogOut, Sparkles, Github, Twitter, Mail, Globe, Zap, Shield, BookOpen, Users, Award, TrendingUp, Code, Book, Headphones, Star, Menu, MessageSquarePlus, Palette, Sun, Waves, Trees, Moon, Minimize2, Sunset as SunsetIcon, Tv, Cpu } from "lucide-react";
import FeedbackWidget from "@/components/FeedbackWidget";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Inline Logo Component for reliable rendering across all pages and themes
function LogoHorizontal({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative z-10 inline-flex items-center gap-2 select-none whitespace-nowrap", className)}
      aria-label="TypeMasterAI Logo"
    >
      {/* TM Badge Circle */}
      {/* Badge background */}
      {/* TM Letters inside badge */}
      {/* TypeMaster Text */}
      <div className="relative h-8 w-8 shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px]">
          <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-extrabold text-slate-50">
            TM
          </div>
        </div>
      </div>
      <div className="text-[18px] leading-none font-bold text-foreground shrink-0">
        TypeMaster<span className="text-cyan-400">AI</span>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/85713ae9-cd6d-4b11-aa90-6589ea95de7c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:55',message:'Layout rendered',data:{user:!!user,location,hasLevelIconCode:false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H5'})}).catch(()=>{});
  }, [user, location]);
  // #endregion

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const primaryNavItems = [
    { href: "/", icon: Keyboard, label: "Quick Test", description: "Practice typing with various texts and languages" },
    { href: "/code-mode", icon: Code, label: "Code Practice", description: "Practice typing real programming code" },
    // HIDDEN FOR LAUNCH - Book Library (will be enabled post-launch)
    // { href: "/books", icon: Book, label: "Book Library", description: "Type passages from famous books" },
    { href: "/dictation-mode", icon: Headphones, label: "Listen & Type", description: "Listen and type what you hear" },
    { href: "/stress-test", icon: Zap, label: "Speed Challenge", description: "Test your typing under pressure" },
    { href: "/multiplayer", icon: Users, label: "Live Race", description: "Race against other players in real-time" },
  ];

  const secondaryNavItems = [
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard", description: "See top typists and rankings" },
    { href: "/analytics", icon: BarChart2, label: "Analytics", description: "View your typing statistics and progress" },
    { href: "/chat", icon: Sparkles, label: "AI Chat", description: "Get AI-powered typing tips and help" },
    { href: "/profile", icon: User, label: "Profile", description: "View and edit your profile" },
    { href: "/settings", icon: Settings, label: "Settings", description: "Customize your typing experience" },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 isolate border-b border-border/40 bg-background/95 backdrop-blur-md shadow-sm">
        <div className="max-w-[1800px] mx-auto px-2 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center shrink-0 cursor-pointer group p-1.5 whitespace-nowrap">
              <LogoHorizontal 
                className="h-8 w-auto transition-transform group-hover:scale-105"
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center flex-1 justify-center">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium cursor-pointer whitespace-nowrap",
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-card border-border">
                    <p className="text-sm">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            
            {location !== "/" && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent whitespace-nowrap"
                        data-testid="nav-theme-toggle"
                      >
                        <Palette className="w-4 h-4" />
                        <span>Theme</span>
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-card border-border">
                    <p className="text-sm">Change color theme</p>
                  </TooltipContent>
                </Tooltip>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme("focus")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-focus"
                >
                  <Zap className="w-4 h-4 text-blue-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
                  <span className="flex-1 text-sm">Focus</span>
                  {theme === "focus" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-light"
                >
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500" />
                  <span className="flex-1 text-sm">Light</span>
                  {theme === "light" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("ocean")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-ocean"
                >
                  <Waves className="w-4 h-4 text-cyan-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600" />
                  <span className="flex-1 text-sm">Ocean</span>
                  {theme === "ocean" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("forest")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-forest"
                >
                  <Trees className="w-4 h-4 text-green-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600" />
                  <span className="flex-1 text-sm">Forest</span>
                  {theme === "forest" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dracula")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-dracula"
                >
                  <Moon className="w-4 h-4 text-purple-400" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span className="flex-1 text-sm">Dracula</span>
                  {theme === "dracula" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("minimal")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-minimal"
                >
                  <Minimize2 className="w-4 h-4 text-gray-400" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600" />
                  <span className="flex-1 text-sm">Minimal</span>
                  {theme === "minimal" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("sunset")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-sunset"
                >
                  <SunsetIcon className="w-4 h-4 text-orange-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-pink-500" />
                  <span className="flex-1 text-sm">Sunset</span>
                  {theme === "sunset" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("retro")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-retro"
                >
                  <Tv className="w-4 h-4 text-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-600" />
                  <span className="flex-1 text-sm">Retro</span>
                  {theme === "retro" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("cyber")}
                  className="flex items-center gap-3 cursor-pointer"
                  data-testid="theme-option-cyber"
                >
                  <Cpu className="w-4 h-4 text-pink-500" />
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span className="flex-1 text-sm">Cyber</span>
                  {theme === "cyber" && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 w-7 rounded-full p-0">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.email?.toLowerCase() === "amar01pawar80@gmail.com" && (
                      <>
                        <Link href="/admin/feedback">
                          <DropdownMenuItem data-testid="button-admin-feedback">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Feedback
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger data-testid="button-theme-menu">
                        <Palette className="w-4 h-4 mr-2" />
                        Theme
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem 
                          onClick={() => setTheme("focus")}
                          className={cn(theme === "focus" && "bg-accent")}
                          data-testid="theme-focus"
                        >
                          <Zap className="w-3.5 h-3.5 mr-2 text-blue-500" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 mr-2" />
                          <span className="flex-1">Focus</span>
                          {theme === "focus" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("light")}
                          className={cn(theme === "light" && "bg-accent")}
                          data-testid="theme-light"
                        >
                          <Sun className="w-3.5 h-3.5 mr-2 text-yellow-500" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 mr-2" />
                          <span className="flex-1">Light</span>
                          {theme === "light" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("ocean")}
                          className={cn(theme === "ocean" && "bg-accent")}
                          data-testid="theme-ocean"
                        >
                          <Waves className="w-3.5 h-3.5 mr-2 text-cyan-500" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mr-2" />
                          <span className="flex-1">Ocean</span>
                          {theme === "ocean" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("forest")}
                          className={cn(theme === "forest" && "bg-accent")}
                          data-testid="theme-forest"
                        >
                          <Trees className="w-3.5 h-3.5 mr-2 text-green-500" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mr-2" />
                          <span className="flex-1">Forest</span>
                          {theme === "forest" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("dracula")}
                          className={cn(theme === "dracula" && "bg-accent")}
                          data-testid="theme-dracula"
                        >
                          <Moon className="w-3.5 h-3.5 mr-2 text-purple-400" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mr-2" />
                          <span className="flex-1">Dracula</span>
                          {theme === "dracula" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("minimal")}
                          className={cn(theme === "minimal" && "bg-accent")}
                          data-testid="theme-minimal"
                        >
                          <Minimize2 className="w-3.5 h-3.5 mr-2 text-gray-400" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 mr-2" />
                          <span className="flex-1">Minimal</span>
                          {theme === "minimal" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("sunset")}
                          className={cn(theme === "sunset" && "bg-accent")}
                          data-testid="theme-sunset"
                        >
                          <SunsetIcon className="w-3.5 h-3.5 mr-2 text-orange-500" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 mr-2" />
                          <span className="flex-1">Sunset</span>
                          {theme === "sunset" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("retro")}
                          className={cn(theme === "retro" && "bg-accent")}
                          data-testid="theme-retro"
                        >
                          <Tv className="w-3.5 h-3.5 mr-2 text-amber-500" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 mr-2" />
                          <span className="flex-1">Retro</span>
                          {theme === "retro" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme("cyber")}
                          className={cn(theme === "cyber" && "bg-accent")}
                          data-testid="theme-cyber"
                        >
                          <Cpu className="w-3.5 h-3.5 mr-2 text-pink-500" />
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mr-2" />
                          <span className="flex-1">Cyber</span>
                          {theme === "cyber" && <span className="ml-auto">✓</span>}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2" data-testid="button-nav-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-[11px] h-7 px-2" data-testid="button-nav-register">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden h-7 w-7 p-0" data-testid="button-mobile-menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-mono font-bold text-lg">
                      T
                    </div>
                    TypeMasterAI
                  </SheetTitle>
                </SheetHeader>
                

                <div className="p-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                  <div className="space-y-1">
                    {allNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer",
                              isActive
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                            data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Theme
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("focus");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "focus"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-focus"
                      >
                        <Zap className="w-4 h-4 text-blue-500" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
                        <span className="flex-1 text-left">Focus</span>
                        {theme === "focus" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("light");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "light"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-light"
                      >
                        <Sun className="w-4 h-4 text-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500" />
                        <span className="flex-1 text-left">Light</span>
                        {theme === "light" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("ocean");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "ocean"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-ocean"
                      >
                        <Waves className="w-4 h-4 text-cyan-500" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600" />
                        <span className="flex-1 text-left">Ocean</span>
                        {theme === "ocean" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("forest");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "forest"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-forest"
                      >
                        <Trees className="w-4 h-4 text-green-500" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600" />
                        <span className="flex-1 text-left">Forest</span>
                        {theme === "forest" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("dracula");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "dracula"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-dracula"
                      >
                        <Moon className="w-4 h-4 text-purple-400" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        <span className="flex-1 text-left">Dracula</span>
                        {theme === "dracula" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("minimal");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "minimal"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-minimal"
                      >
                        <Minimize2 className="w-4 h-4 text-gray-400" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600" />
                        <span className="flex-1 text-left">Minimal</span>
                        {theme === "minimal" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("sunset");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "sunset"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-sunset"
                      >
                        <SunsetIcon className="w-4 h-4 text-orange-500" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-pink-500" />
                        <span className="flex-1 text-left">Sunset</span>
                        {theme === "sunset" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("retro");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "retro"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-retro"
                      >
                        <Tv className="w-4 h-4 text-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-600" />
                        <span className="flex-1 text-left">Retro</span>
                        {theme === "retro" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("cyber");
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                          theme === "cyber"
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid="mobile-theme-cyber"
                      >
                        <Cpu className="w-4 h-4 text-pink-500" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        <span className="flex-1 text-left">Cyber</span>
                        {theme === "cyber" && <span className="text-primary">✓</span>}
                      </button>
                    </div>
                  </div>
                  
                  {!user && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Link href="/login">
                        <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-button-login">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-button-register">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {user && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        data-testid="mobile-button-logout"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 pb-12 container mx-auto px-4">
        {children}
      </main>

      <footer 
        className="border-t border-border/40"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <Link href="/contact" className="hover:text-primary transition-colors" data-testid="link-footer-contact">Contact</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/about" className="hover:text-primary transition-colors" data-testid="link-footer-about">About</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors" data-testid="link-footer-privacy">Privacy</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors" data-testid="link-footer-terms">Terms</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/cookie-policy" className="hover:text-primary transition-colors" data-testid="link-footer-cookies">Cookies</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/ai-transparency" className="hover:text-primary transition-colors" data-testid="link-footer-ai">AI Transparency</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/accessibility" className="hover:text-primary transition-colors" data-testid="link-footer-accessibility">Accessibility</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/verify" className="hover:text-primary transition-colors" data-testid="link-footer-verify">Verify Certificate</Link>
            <span className="text-muted-foreground/40">·</span>
            <span>© {new Date().getFullYear()} TypeMasterAI</span>
            <span className="text-muted-foreground/40">·</span>
            <a href="mailto:support@typemasterai.com" className="hover:text-primary transition-colors" data-testid="link-footer-support-email">support@typemasterai.com</a>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[10px]">Registered in Solapur, India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
