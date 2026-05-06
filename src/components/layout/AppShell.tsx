import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, PackageSearch, ScanLine, BarChart3, ScrollText, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/shipments", label: "Shipments", icon: PackageSearch },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen text-foreground">
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="size-9 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
            <Truck className="size-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">LogiTrace</div>
            <div className="text-[11px] text-muted-foreground mono">v1.0 · ops</div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-muted-foreground mono">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            live · simulated feed
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <Truck className="size-5 text-primary" />
            <span className="font-semibold tracking-tight">LogiTrace</span>
          </div>
          <nav className="flex gap-1">
            {NAV.map(({ to, icon: Icon }) => (
              <Link key={to} to={to} className="p-2 rounded-md text-muted-foreground [&.active]:text-primary" activeProps={{ className: "active" }}>
                <Icon className="size-4" />
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
