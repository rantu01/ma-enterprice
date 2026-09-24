"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/contexts/SidebarContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { Bell, Settings, LogOut, User, ChevronDown, Search, Sun, Moon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header({ title, breadcrumb }) {
  const { isCollapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="fixed top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-chrome)] px-4 transition-all duration-300"
      style={{ left: isCollapsed ? 64 : 260, width: isCollapsed ? "calc(100vw - 64px)" : "calc(100vw - 260px)" }}
      role="banner"
    >
      <div className="flex items-center gap-4 min-w-0">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[var(--text-sm)] text-[var(--color-ink-3)] shrink-0">
            {breadcrumb}
          </nav>
        )}
        <h1 className="text-[var(--text-lg)] font-semibold text-[var(--color-ink)] truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-3)]" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-[220px] pl-9 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--text-sm)] text-[var(--color-ink)] placeholder:text-[var(--color-placeholder)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            aria-label="Search"
          />
        </div>

        <button
          className="relative h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-3)] hover:bg-[var(--color-base)] transition-colors duration-150"
          aria-label="Notifications"
          tabIndex={0}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--color-error)]" aria-hidden="true" />
        </button>

        <button
          className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-3)] hover:bg-[var(--color-base)] transition-colors duration-150"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          tabIndex={0}
          onClick={toggleTheme}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleTheme();
            }
          }}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        <button
          className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-3)] hover:bg-[var(--color-base)] transition-colors duration-150"
          aria-label="Settings"
          tabIndex={0}
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-2 h-9 px-2 rounded-[var(--radius-md)] hover:bg-[var(--color-base)] transition-colors duration-150"
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
              if (e.key === "Escape") {
                setUserMenuOpen(false);
              }
            }}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-ink-3)]" aria-hidden="true" />
            ) : (
              <>
                <div
                  className="h-9 w-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[var(--text-sm)] font-semibold"
                  aria-hidden="true"
                >
                  {getInitials(user?.name)}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[var(--color-ink-2)] transition-transform duration-200",
                    userMenuOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 z-50"
              role="menu"
              aria-label="User menu"
            >
              <div className="px-4 py-2 border-b border-[var(--color-line)]">
                <p className="text-[var(--text-sm)] font-medium text-[var(--color-ink)]">{user?.name || "User"}</p>
                <p className="text-[var(--text-xs)] text-[var(--color-ink-3)] capitalize">{user?.role || "user"}</p>
              </div>
              <a
                href="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-[var(--text-sm)] text-[var(--color-ink)] hover:bg-[var(--color-base)] transition-colors duration-150"
                role="menuitem"
                tabIndex={-1}
                onClick={() => setUserMenuOpen(false)}
              >
                <User className="h-4 w-4 text-[var(--color-ink-2)]" aria-hidden="true" />
                Profile
              </a>
              <a
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-[var(--text-sm)] text-[var(--color-ink-2)] hover:bg-[var(--color-base)] transition-colors duration-150"
                role="menuitem"
                tabIndex={-1}
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings className="h-4 w-4 text-[var(--color-ink-2)]" aria-hidden="true" />
                Settings
              </a>
              <button
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--text-sm)] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors duration-150 text-left"
                role="menuitem"
                tabIndex={-1}
                onClick={() => { handleLogout(); setUserMenuOpen(false); }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}