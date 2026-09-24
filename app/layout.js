"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import { AuthProvider } from "@/components/contexts/AuthContext";
import { SidebarProvider } from "@/components/contexts/SidebarContext";
import { ToastProvider } from "@/components/contexts/ToastContext";
import { ThemeProvider } from "@/components/contexts/ThemeContext";
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
  return parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = i === parts.length - 1;
    return isLast ? (
      <span key={href} className="text-[var(--color-ink-3)]">{label}</span>
    ) : (
      <a key={href} href={href} className="text-[var(--color-primary)] hover:underline">{label}</a>
    );
  });
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "MAA Enterprise";
  const breadcrumb = getBreadcrumb(pathname);

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
                <div className="flex flex-1">
                  <Sidebar />
                  <div className="flex flex-col flex-1 ml-64 lg:ml-64">
                    <Header title={title} breadcrumb={breadcrumb} />
                    <main className="flex-1 p-6 lg:p-8 overflow-auto bg-[var(--color-base)]" id="main-content">
                      {children}
                    </main>
                  </div>
                </div>
                <ToastContainer />
              </ToastProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
