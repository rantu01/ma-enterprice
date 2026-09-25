"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/components/contexts/SidebarContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import { useAuth } from "@/components/contexts/AuthContext";
import {
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Search,
  Sun,
  Moon,
  Loader2,
  Sparkles,
  Command,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header({ title, breadcrumb }) {
  const { isCollapsed, openMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Close the menu on route change so it never gets stuck open
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserMenuOpen(false);
  }, [pathname]);

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setUserMenuOpen(false);
      setLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  const goToSettings = () => {
    setUserMenuOpen(false);
    router.push("/settings");
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header
      className={cn(
        // Mobile: full-width bar with side gutters, no sidebar offset
        "fixed top-3 z-20 left-3 right-3 transition-all duration-300 ease-out",
        // Desktop: offset follows the fixed sidebar width
        isCollapsed ? "lg:left-[76px]" : "lg:left-[272px]",
        "lg:right-3"
      )}
      role="banner"
    >
      {/* Floating pill container */}
      {/* NOTE: no overflow-hidden here — the user-menu dropdown renders
          below this bar and would otherwise be clipped/invisible. */}
      <div
        className={cn(
          "relative flex h-14 items-center justify-between gap-4 px-3 sm:px-4",
          "rounded-2xl border border-[var(--color-border)]",
          "bg-[var(--color-chrome)]/75 backdrop-blur-2xl",
          "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.18),0_1px_0_0_rgba(255,255,255,0.06)_inset]"
        )}
      >
        {/* Top hairline (solid, no gradient) */}
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[var(--color-primary)]/40"
          aria-hidden="true"
        />

        {/* ---------- LEFT ---------- */}
        <div className="relative flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Hamburger — opens the sidebar overlay on mobile */}
          <span className="lg:hidden shrink-0">
            <IconButton label="Open menu" hoverClass="hover:text-sky-500 hover:bg-sky-500/10" onClick={openMobile}>
              <Menu className="h-[18px] w-[18px]" />
            </IconButton>
          </span>
          {/* Brand mark — SOLID color */}
          <div
            className={cn(
              "hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              "bg-[var(--color-primary)] text-white",
              "shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]"
            )}
            aria-hidden="true"
          >
            <Sparkles className="h-4.5 w-4.5" />
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            {breadcrumb && (
              <nav
                aria-label="Breadcrumb"
                className="hidden md:flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]"
              >
                {breadcrumb}
              </nav>
            )}
            <h1 className="text-[15px] sm:text-base font-semibold tracking-tight text-[var(--color-ink)] truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* ---------- RIGHT ---------- */}
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          {/* Search — command palette style */}
          <div className="relative hidden lg:block group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-3)] transition-colors group-focus-within:text-[var(--color-primary)]"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search..."
              className={cn(
                "h-9 w-[200px] xl:w-[260px] pl-9 pr-16",
                "rounded-xl border border-[var(--color-border)]",
                "bg-[var(--color-base)]/60",
                "text-[13px] text-[var(--color-ink)]",
                "placeholder:text-[var(--color-placeholder)]",
                "transition-all duration-200",
                "focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-card)]",
                "focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
              )}
              aria-label="Search"
            />
            <kbd
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "hidden xl:flex items-center gap-0.5 px-1.5 py-0.5",
                "rounded-md border border-[var(--color-border)] bg-[var(--color-card)]",
                "text-[10px] font-medium text-[var(--color-ink-3)]"
              )}
            >
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </div>

          {/* Notification */}
          <IconButton
            label="Notifications"
            hoverClass="hover:text-amber-500 hover:bg-amber-500/10"
          >
            <Bell className="h-[18px] w-[18px] transition-transform group-hover:rotate-12" />
            <span className="absolute top-2 right-2 flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-[var(--color-chrome)]" />
            </span>
          </IconButton>

          {/* Theme */}
          <IconButton
            label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            hoverClass="hover:text-violet-500 hover:bg-violet-500/10"
            onClick={toggleTheme}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTheme();
              }
            }}
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px] transition-transform duration-500 group-hover:rotate-90" />
            ) : (
              <Moon className="h-[18px] w-[18px] transition-transform duration-500 group-hover:-rotate-12" />
            )}
          </IconButton>

          {/* Settings */}
          <IconButton
            label="Settings"
            hoverClass="hover:text-sky-500 hover:bg-sky-500/10"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-[18px] w-[18px] transition-transform duration-500 group-hover:rotate-90" />
          </IconButton>

          {/* Divider */}
          <div
            className="hidden sm:block h-6 w-px mx-1 bg-[var(--color-line)]"
            aria-hidden="true"
          />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              className={cn(
                "group flex items-center gap-2 h-9 pl-1 pr-1.5 rounded-full",
                "transition-all duration-200",
                "hover:bg-[var(--color-base)] active:scale-[0.97]",
                userMenuOpen && "bg-[var(--color-base)]"
              )}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setUserMenuOpen(!userMenuOpen);
                }
                if (e.key === "Escape") setUserMenuOpen(false);
              }}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-ink-3)]" />
              ) : (
                <>
                  <div className="relative">
                    {/* Avatar — SOLID color */}
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        "text-xs font-bold text-white tracking-wide",
                        "bg-[var(--color-primary)]",
                        "ring-2 ring-[var(--color-chrome)]",
                        "shadow-[0_2px_10px_-2px_rgba(37,99,235,0.5)]",
                        "transition-transform duration-200 group-hover:scale-105"
                      )}
                      aria-hidden="true"
                    >
                      {getInitials(user?.name)}
                    </div>
                    {/* Online dot */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--color-chrome)]"
                      aria-hidden="true"
                    />
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-[var(--color-ink-3)] transition-transform duration-300",
                      userMenuOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </>
              )}
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-3 w-64",
                  "bg-[var(--color-card)]/95 backdrop-blur-2xl",
                  "border border-[var(--color-border)]",
                  "rounded-2xl",
                  "shadow-[0_20px_48px_-12px_rgba(0,0,0,0.25),0_2px_8px_-2px_rgba(0,0,0,0.08)]",
                  "z-50 overflow-hidden",
                  "animate-in fade-in slide-in-from-top-3 zoom-in-95 duration-200"
                )}
                role="menu"
                aria-label="User menu"
              >
                {/* Header — SOLID tint, no gradient */}
                <div className="px-4 py-4 bg-[var(--color-base)]/60 border-b border-[var(--color-line)]">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        "text-sm font-bold text-white",
                        "bg-[var(--color-primary)]",
                        "shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]"
                      )}
                      aria-hidden="true"
                    >
                      {getInitials(user?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-[var(--color-ink-3)] capitalize truncate">
                        {user?.role || "user"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-1.5">
                  <MenuItem
                    icon={User}
                    iconBg="bg-sky-500/10 text-sky-500"
                    onClick={goToSettings}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    icon={Settings}
                    iconBg="bg-violet-500/10 text-violet-500"
                    onClick={goToSettings}
                  >
                    Settings
                  </MenuItem>
                </div>

                {/* Logout */}
                <div className="p-1.5 pt-0">
                  <button
                    className={cn(
                      "flex items-center gap-3 w-full px-2 py-2 rounded-xl",
                      "text-sm font-medium text-rose-500",
                      "hover:bg-rose-500/10 transition-colors duration-150",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Helper components ---------- */

function IconButton({ children, label, hoverClass, onClick, onKeyDown }) {
  return (
    <button
      className={cn(
        "group relative h-9 w-9 flex items-center justify-center",
        "rounded-xl text-[var(--color-ink-3)]",
        "hover:bg-[var(--color-base)]",
        "active:scale-95 transition-all duration-200",
        hoverClass
      )}
      aria-label={label}
      title={label}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  );
}

function MenuItem({ icon: Icon, iconBg, children, onClick }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-xl w-full text-left",
        "text-sm font-medium text-[var(--color-ink)]",
        "hover:bg-[var(--color-base)] transition-colors duration-150"
      )}
      role="menuitem"
      onClick={onClick}
    >
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconBg)}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      {children}
    </button>
  );
}