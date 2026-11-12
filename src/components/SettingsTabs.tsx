"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icons";

const TABS: { href: string; label: string; icon: IconName; staffOnly?: boolean }[] = [
  { href: "/settings/appearance", label: "Apparence", icon: "palette" },
  { href: "/settings/classes", label: "Effectif des classes", icon: "school", staffOnly: true },
];

/** Onglets des pages Paramètres (le lien « Effectif des classes » n'est proposé qu'au personnel). */
export default function SettingsTabs({ staff }: { staff: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="settings-tabs no-print" aria-label="Paramètres">
      {TABS.filter((t) => !t.staffOnly || staff).map((t) => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <Icon name={t.icon} size={16} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
