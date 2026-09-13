import Link from "next/link";
import { MobiconLogo } from "@/components/MobiconLogo";
import { LogoutButton } from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "Übersicht" },
  { href: "/rufnummern", label: "Rufnummern" },
  { href: "/rechnungen", label: "Rechnungen" },
  { href: "/berichte", label: "Berichte" },
  { href: "/warnliste", label: "Warnliste" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <MobiconLogo />
          <nav className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-mobicon-dark"
              >
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
