export const BADGE_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  verified: { label: "Terverifikasi", emoji: "✅", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  trusted: { label: "Terpercaya", emoji: "🛡️", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  top_seller: { label: "Top Seller", emoji: "👑", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  new: { label: "Member Baru", emoji: "🌱", color: "bg-lime-500/20 text-lime-300 border-lime-500/40" },
  fast_response: { label: "Fast Respon", emoji: "⚡", color: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
};

export function BadgeChip({ badge, small }: { badge: string; small?: boolean }) {
  const info = BADGE_INFO[badge] ?? { label: badge, emoji: "🏅", color: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${info.color} ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
      title={info.label}
    >
      <span>{info.emoji}</span>
      {!small && <span>{info.label}</span>}
    </span>
  );
}

export function BadgeRow({ badges, small }: { badges: string[]; small?: boolean }) {
  if (!badges.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {badges.map((b) => (
        <BadgeChip key={b} badge={b} small={small} />
      ))}
    </span>
  );
}
