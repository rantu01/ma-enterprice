"use client";

import { useState } from "react";
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
  // {
  //   title: "Employee Management",
  //   icon: Users,
  //   items: [
  //     { label: "Overview", href: "/employee-management" },
  //     { label: "Employees", href: "/employee-management/employees" },
  //     { label: "Salary Distribution", href: "/employee-management/salary" },
  //   ],
  // },
  // {
  //   title: "Accounts",
  //   icon: Wallet,
  //   items: [
  //     { label: "Add Investment", href: "/accounts/add-investment" },
  //     { label: "Company Deposit", href: "/accounts/deposit" },
  //   ],
  // },
  // {
  //   title: "Office Expense",
  //   icon: FileText,
  //   items: [
  //     { label: "Overview", href: "/office-expense" },
  //     { label: "Monthly Data Entry", href: "/office-expense/data-entry" },
  //     { label: "Settings", href: "/office-expense/settings" },
  //   ],
  // },
  // {
  //   title: "Route Calculation",
  //   icon: Route,
  //   items: [
  //     { label: "Overview", href: "/route-calculation" },
  //     { label: "Add Route Cost", href: "/route-calculation/add-cost" },
  //     { label: "Settings", href: "/route-calculation/settings" },
  //   ],
  // },
  // {
  //   title: "Reports",
  //   icon: BarChart3,
  //   items: [{ label: "Reports", href: "/reports" }],
  // },
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

function NavItem({ item, groupIcon, isCollapsed, isActive }) {
  const Icon = groupIcon;
  return (
    <a
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--text-sm)] font-medium transition-all duration-150 ease-out",
        isActive
          ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border-l-2 border-[var(--color-primary)] pl-2.5"
          : "text-[var(--color-ink-2)] hover:bg-[var(--color-base)] hover:text-[var(--color-ink)]",
        isCollapsed && "justify-center px-0"
      )}
      title={isCollapsed ? item.label : undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = item.href;
        }
      }}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!isCollapsed && <span>{item.label}</span>}
    </a>
  );
}

function NavGroup({ group, isCollapsed, pathname, isOpen, onToggle }) {
  const Icon = group.icon;
  const hasMultipleItems = group.items.length > 1;
  const isExpanded = hasMultipleItems && isOpen;
  const groupIsActive = isGroupActive(group, pathname);

  return (
    <li className="mb-1" role="none">
      <button
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-xs)] font-semibold uppercase tracking-wider transition-colors duration-150",
          groupIsActive
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]",
          isCollapsed && "justify-center px-0"
        )}
        onClick={() => hasMultipleItems && onToggle(group.title)}
        aria-expanded={hasMultipleItems ? isExpanded : undefined}
        aria-label={group.title}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (hasMultipleItems) onToggle(group.title);
          }
        }}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{group.title}</span>
            {hasMultipleItems && (
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </button>
      {isCollapsed && (
        <div className="flex flex-col items-center gap-1 py-1">
          <Icon className="h-5 w-5 text-[var(--color-ink-3)]" aria-hidden="true" />
        </div>
      )}
      {!isCollapsed && hasMultipleItems && (
        <ul
          className={cn(
            "ml-3 overflow-hidden transition-all duration-200 ease-in-out",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
          role="list"
          aria-hidden={!isExpanded}
        >
          {group.items.map((item) => (
            <li key={item.label} role="none">
              <NavItem
                item={item}
                groupIcon={Icon}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            </li>
          ))}
        </ul>
      )}
      {!isCollapsed && !hasMultipleItems && (
        <ul className="ml-7 mt-1" role="list">
          {group.items.map((item) => (
            <li key={item.label} role="none">
              <NavItem
                item={item}
                groupIcon={Icon}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();
  const pathname = usePathname();
  const activeGroup = getActiveMultiItemGroup(pathname);
  const activeTitle = activeGroup ? activeGroup.title : null;
  const [uiState, setUiState] = useState({ pathname, open: activeTitle });

  const openGroup =
    uiState.pathname === pathname ? uiState.open : activeTitle;

  const handleToggle = (title) => {
    setUiState({
      pathname,
      open: openGroup === title ? null : title,
    });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-full bg-[var(--color-chrome)] border-r border-[var(--color-line)] flex flex-col transition-all duration-300 ease-out",
        isCollapsed ? "w-16" : "w-64"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="h-[56px] flex items-center justify-center border-b border-[var(--color-line)] shrink-0">
        {isCollapsed ? (
          <span className="text-[var(--text-xs)] font-bold text-[var(--color-primary)]" aria-label="MAA Enterprise">
            M
          </span>
        ) : (
          <span className="text-[var(--text-base)] font-bold text-[var(--color-ink)]">
            MAA Enterprise
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 sidebar-content" aria-label="Primary">
        <ul className="px-2" role="list">
          {navSections.map((group) => (
            <NavGroup
              key={group.title}
              group={group}
              isCollapsed={isCollapsed}
              pathname={pathname}
              isOpen={openGroup === group.title}
              onToggle={handleToggle}
            />
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-[var(--color-line)] p-2 sidebar-icon-only">
        <button
          className="w-full h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-3)] hover:bg-[var(--color-base)] hover:text-[var(--color-ink)] transition-colors duration-150"
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
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}