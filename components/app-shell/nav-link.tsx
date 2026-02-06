/**
 * NavLink - A client-side navigation link with active-route highlighting.
 *
 * Used by both the desktop Sidebar and the MobileNav drawer to render
 * individual navigation items. The component reads the current URL via
 * Next.js `usePathname()` and applies an "active" style when the link
 * matches the current route.
 *
 * Active-route matching logic:
 * - The home route ("/") requires an **exact** match to avoid highlighting
 *   on every page (since all paths start with "/").
 * - All other routes use a **prefix** match so that nested pages
 *   (e.g. "/settings/profile") still highlight the parent nav item.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Props for the NavLink component. */
export interface NavLinkProps {
  /** The route this link navigates to. */
  href: string;
  /** Label text rendered beside the icon. */
  children: React.ReactNode;
  /** Optional Lucide icon element displayed to the left of the label. */
  icon?: React.ReactNode;
  /** Additional Tailwind classes forwarded to the underlying <Link>. */
  className?: string;
}

/**
 * Renders a styled Next.js `<Link>` that highlights when the user is on the
 * matching route.
 *
 * @param href      - Target route path.
 * @param children  - Link label / content.
 * @param icon      - Optional leading icon.
 * @param className - Extra CSS classes.
 */
export function NavLink({ href, children, icon, className }: NavLinkProps) {
  const pathname = usePathname();

  // Exact match for home ("/") to avoid false positives; prefix match for all others
  // so nested routes still highlight their parent nav item.
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {icon && <span className="h-5 w-5">{icon}</span>}
      {children}
    </Link>
  );
}
