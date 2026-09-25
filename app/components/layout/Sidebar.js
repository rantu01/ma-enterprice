"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/contexts/SidebarContext";
import {
  LayoutDashboard,
  Landmark,
  Users,
  Wallet,
  FileText,
  Route,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [{ label: "Overview", href: "/" }],
  },
  {
    title: "Loan Management",
    icon: Landmark,
    items: [
      { label: "Overview", href: "/loan-management" },
      { label: "Add Organization", href: "/loan-management/add-organization" },
      { label: "Add Loan", href: "/loan-management/add-loan" },
      { label: "Pay Loan", href: "/loan-management/pay-loan" },
    ],
  },
  {
    title: "Employee Management",
    icon: Users,
    items: [
      { label: "Overview", href: "/employee-management" },
      { label: "Employees", href: "/employee-management/employees" },
      { label: "Salary Distribution", href: "/employee-management/salary" },
    ],
  },
  {
    title: "Accounts",
    icon: Wallet,
    items: [
      { label: "Add Investment", href: "/accounts/add-investment" },
      { label: "Company Deposit", href: "/accounts/deposit" },
    ],
  },
  {
    title: "Office Expense",
    icon: FileText,
    items: [
      { label: "Overview", href: "/office-expense" },
      { label: "Monthly Data Entry", href: "/office-expense/data-entry" },
      { label: "Settings", href: "/office-expense/settings" },
    ],
  },
  {
    title: "Route Calculation",
    icon: Route,
    items: [
      { label: "Overview", href: "/route-calculation" },
      { label: "Add Route Cost", href: "/route-calculation/add-cost" },
      { label: "Settings", href: "/route-calculation/settings" },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [{ label: "Reports", href: "/reports" }],
  },
];

function getPathRoot(href) {
  const segments = href.split("/").filter(Boolean);
  return segments.length ? `/${segments[0]}` : "/";
}

function isGroupActive(group, pathname) {
  const pathRoot = getPathRoot(pathname);
  return group.items.some((item) => getPathRoot(item.href) === pathRoot);
}

function getActiveMultiItemGroup(pathname) {
  return navSections.find(
    (group) => group.items.length > 1 && isGroupActive(group, pathname)
  );
}

/* ---------- Nav Item ---------- */
function NavItem({ item, isCollapsed, isActive }) {
  return (
    <a
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? item.label : undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = item.href;
        }
      }}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl text-[13px] font-medium",
        "transition-all duration-200 ease-out",
        isCollapsed ? "justify-center h-10 px-0" : "px-3 py-2",
        isActive
          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
          : "text-[var(--color-ink-2)] hover:bg-[var(--color-base)] hover:text-[var(--color-ink)]"
      )}
    >
      {/* Active left accent bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--color-primary)]"
          aria-hidden="true"
        />
      )}

      {/* Bullet / dot */}
      <span
        className={cn(
          "shrink-0 rounded-full transition-all duration-200",
          isCollapsed ? "hidden" : "block",
          isActive
            ? "h-1.5 w-1.5 bg-[var(--color-primary)]"
            : "h-1.5 w-1.5 bg-[var(--color-ink-3)]/40 group-hover:bg-[var(--color-ink-3)]"
        )}
        aria-hidden="true"
      />

      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </a>
  );
}

/* ---------- Nav Group ---------- */
function NavGroup({ group, isCollapsed, pathname, isOpen, onToggle }) {
  const Icon = group.icon;
  const hasMultipleItems = group.items.length > 1;
  const isExpanded = hasMultipleItems && isOpen;
  const groupIsActive = isGroupActive(group, pathname);

  // Single item group → render as a direct link
  if (!hasMultipleItems) {
    const item = group.items[0];
    const isActive = pathname === item.href;

    return (
      <li className="mb-1" role="none">
        <a
          href={item.href}
          title={isCollapsed ? group.title : undefined}
          aria-current={isActive ? "page" : undefined}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              window.location.href = item.href;
            }
          }}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl text-[13px] font-semibold",
            "transition-all duration-200 ease-out",
            isCollapsed ? "justify-center h-10 px-0" : "px-3 py-2.5",
            isActive
              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "text-[var(--color-ink-2)] hover:bg-[var(--color-base)] hover:text-[var(--color-ink)]"
          )}
        >
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--color-primary)]"
              aria-hidden="true"
            />
          )}
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              isActive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-ink-3)] group-hover:text-[var(--color-ink)]"
            )}
            aria-hidden="true"
          />
          {!isCollapsed && <span className="truncate">{group.title}</span>}
        </a>
      </li>
    );
  }

  // Multi item group → collapsible
  return (
    <li className="mb-1" role="none">
      <button
        onClick={() => onToggle(group.title)}
        aria-expanded={isExpanded}
        aria-label={group.title}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(group.title);
          }
        }}
        title={isCollapsed ? group.title : undefined}
        className={cn(
          "group relative w-full flex items-center gap-3 rounded-xl",
          "text-[13px] font-semibold transition-all duration-200 ease-out",
          isCollapsed ? "justify-center h-10 px-0" : "px-3 py-2.5",
          groupIsActive
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-ink-2)] hover:bg-[var(--color-base)] hover:text-[var(--color-ink)]"
        )}
      >
        {groupIsActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--color-primary)]"
            aria-hidden="true"
          />
        )}
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            groupIsActive
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-ink-3)] group-hover:text-[var(--color-ink)]"
          )}
          aria-hidden="true"
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{group.title}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-[var(--color-ink-3)] transition-transform duration-300",
                isExpanded && "rotate-180 text-[var(--color-primary)]"
              )}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {/* Smooth expand using grid trick */}
      {!isCollapsed && (
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            isExpanded ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0"
          )}
          aria-hidden={!isExpanded}
        >
          <div className="overflow-hidden">
            <ul className="ml-5 pl-3 border-l border-[var(--color-line)] space-y-0.5 py-1" role="list">
              {group.items.map((item) => (
                <li key={item.label} role="none">
                  <NavItem
                    item={item}
                    isCollapsed={false}
                    isActive={pathname === item.href}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------- Sidebar ---------- */
export default function Sidebar() {
  const { isCollapsed, toggle, mobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();
  const activeGroup = getActiveMultiItemGroup(pathname);
  const activeTitle = activeGroup ? activeGroup.title : null;
  const [uiState, setUiState] = useState({ pathname, open: activeTitle });
  const [isMobile, setIsMobile] = useState(false);

  // Track below-lg breakpoint so the drawer always renders expanded on mobile
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023.98px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Close the overlay drawer on navigation and on Escape
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  const openGroup = uiState.pathname === pathname ? uiState.open : activeTitle;
  // On mobile the drawer is always full-width expanded; collapse applies on lg+ only
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  const handleToggle = (title) => {
    setUiState({
      pathname,
      open: openGroup === title ? null : title,
    });
  };

  return (
    <>
      {/* Backdrop — sits above page content + header, below the drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-3 top-3 bottom-3 z-50 flex flex-col",
          "rounded-2xl border border-[var(--color-border)]",
          "bg-[var(--color-chrome)]/95 backdrop-blur-2xl",
          "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.18),0_1px_0_0_rgba(255,255,255,0.06)_inset]",
          "transition-transform duration-300 ease-out overflow-hidden",
          // Mobile: full expanded drawer, off-canvas when closed
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+12px)]",
          // Desktop: always visible, width follows collapse state
          "lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-64"
        )}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={isMobile && !mobileOpen ? true : undefined}
      >
      {/* Top hairline accent */}
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[var(--color-primary)]/40"
        aria-hidden="true"
      />

      {/* ---------- Brand ---------- */}
      <div className="h-14 flex items-center px-3 shrink-0 border-b border-[var(--color-line)]">
        <div className={cn("flex items-center gap-2.5 min-w-0", effectiveCollapsed && "justify-center w-full")}>
          {/* Solid brand mark */}
          <div
            className={cn(
              "h-8 w-8 shrink-0 flex items-center justify-center rounded-lg",
              "bg-[var(--color-primary)] text-white",
              "shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]"
            )}
            aria-hidden="true"
          >
            <span className="text-[13px] font-bold tracking-tight">M</span>
          </div>

          {!effectiveCollapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-[13px] font-bold text-[var(--color-ink)] truncate">
                MAA Enterprise
              </span>
              <span className="text-[10px] font-medium text-[var(--color-ink-3)] mt-0.5">
                Loan Dashboard
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Nav ---------- */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 sidebar-content"
        aria-label="Primary"
      >
        <ul role="list">
          {navSections.map((group) => (
            <NavGroup
              key={group.title}
              group={group}
              isCollapsed={effectiveCollapsed}
              pathname={pathname}
              isOpen={openGroup === group.title}
              onToggle={handleToggle}
            />
          ))}
        </ul>
      </nav>

      {/* ---------- Footer / Collapse (desktop only) ---------- */}
      <div className="shrink-0 border-t border-[var(--color-line)] p-2 hidden lg:block">
        <button
          className={cn(
            "group w-full h-9 flex items-center justify-center gap-2",
            "rounded-xl text-[var(--color-ink-3)]",
            "hover:bg-[var(--color-base)] hover:text-[var(--color-ink)]",
            "active:scale-[0.97] transition-all duration-200"
          )}
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              <span className="text-[12px] font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}