"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import "./globals.css";
import { AuthProvider, useAuth } from "@/components/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/components/contexts/SidebarContext";
import { ToastProvider } from "@/components/contexts/ToastContext";
import { ThemeProvider } from "@/components/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ToastContainer from "@/components/layout/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pageTitles = {
  "/": "Dashboard",
  "/loan-management": "Loan Management",
  "/loan-management/add-organization": "Add Organization",
  "/loan-management/add-loan": "Add Loan",
  "/loan-management/pay-loan": "Pay Loan",
  "/employee-management": "Employee Management",
  "/employee-management/employees": "Employees",
  "/employee-management/salary": "Salary Distribution",
  "/accounts": "Accounts",
  "/accounts/add-investment": "Add Investment",
  "/accounts/deposit": "Company Deposit",
  "/office-expense": "Office Expense",
  "/office-expense/data-entry": "Monthly Data Entry",
  "/office-expense/settings": "Settings",
  "/route-calculation": "Route Calculation",
  "/route-calculation/add-cost": "Add Route Cost",
  "/route-calculation/settings": "Settings",
  "/reports": "Reports",
  "/settings": "Settings",
};

function getBreadcrumb(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const items = [];
  parts.forEach((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = i === parts.length - 1;
    if (i > 0) {
      items.push(
        <span key={`sep-${href}`} aria-hidden="true" className="mx-1">
          /
        </span>
      );
    }
    items.push(
      isLast ? (
        <span key={href} className="text-[var(--color-ink-3)]">
          {label}
        </span>
      ) : (
        <a key={href} href={href} className="text-[var(--color-primary)] hover:underline">
          {label}
        </a>
      )
    );
  });
  return items;
}

function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, mobileOpen } = useSidebar();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === "/login";
  const title = pageTitles[pathname] || "MAA Enterprise";
  const breadcrumb = getBreadcrumb(pathname);

  // Protect all non-login routes: unauthenticated users go to /login
  useEffect(() => {
    if (!isLoginPage && !loading && !user) {
      router.replace("/login");
    }
  }, [isLoginPage, loading, user, router]);

  // Lock background scroll while the mobile sidebar overlay is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  if (isLoginPage) {
    return <main id="main-content">{children}</main>;
  }

  // Avoid flashing protected UI while auth resolves or redirect happens
  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-base)]" aria-label="Loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" aria-hidden="true" />
          <p className="text-sm text-[var(--color-ink-3)]">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div
        className={cn(
          // Mobile: no sidebar offset — the sidebar is an overlay drawer
          "flex flex-col flex-1 min-w-0 transition-all duration-300 ease-out ml-0",
          // Desktop: offset follows the fixed sidebar width
          isCollapsed ? "lg:ml-[76px]" : "lg:ml-[272px]"
        )}
      >
        <Header title={title} breadcrumb={breadcrumb} />
        <main
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-[var(--color-base)] min-h-screen"
          id="main-content"
          style={{ paddingTop: 88 }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <ToastProvider>
                <AppShell>{children}</AppShell>
                <ToastContainer />
              </ToastProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
