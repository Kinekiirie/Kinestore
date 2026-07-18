import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

const COLOR_MAP: Record<string, string> = {
  purple: "from-violet-600 to-fuchsia-600",
  blue: "from-blue-600 to-cyan-500",
  pink: "from-pink-600 to-rose-500",
  green: "from-emerald-600 to-teal-500",
  orange: "from-orange-600 to-amber-500",
};

export default function StoryBar() {
  const feed = trpc.story.feed.useQuery(undefined, { refetchInterval: 30000 });
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(null);

  const groups = feed.data ?? [];
  const active = open !== null ? groups[open] : null;

  return (
    <div className="mb-8">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {user && (
          <Link to="/dashboard" className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="relative grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-slate-600 bg-slate-900 text-2xl">
              {user.avatar}
              <span className="absolute -right-0.5 -bottom-0.5 grid h-5 w-5 place-items-center rounded-full bg-violet-600">
                <Plus className="h-3 w-3 text-white" />
              </span>
            </span>
            <span className="text-[11px] text-slate-400">Statusmu</span>
          </Link>
        )}
        {groups.map((g, i) => (
          <button key={g.user.id} onClick={() => setOpen(i)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="rounded-full bg-gradient-to-tr from-fuchsia-500 via-rose-500 to-amber-400 p-[3px]">
              <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-slate-950 bg-slate-900 text-2xl">
                {g.user.avatar}
              </span>
            </span>
            <span className="w-16 truncate text-[11px] text-slate-300">{g.user.displayName}</span>
          </button>
        ))}
        {groups.length === 0 && !user && (
          <p className="py-4 text-sm text-slate-500">Belum ada status. Jadilah yang pertama!</p>
        )}
      </div>

      <Dialog open={active !== null} onOpenChange={() => setOpen(null)}>
        <DialogContent className="max-w-sm border-slate-700 bg-slate-900 p-0 text-slate-100">
          {active && (
            <div>
              <div className="flex items-center gap-3 border-b border-slate-700 p-4">
                <span className="text-2xl">{active.user.avatar}</span>
                <div>
                  <p className="font-semibold">{active.user.displayName}</p>
                  <Link to={`/seller/${active.user.id}`} className="text-xs text-violet-400 hover:underline" onClick={() => setOpen(null)}>
                    Lihat toko →
                  </Link>
                </div>
                <button onClick={() => setOpen(null)} className="ml-auto text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                {active.stories.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-2xl bg-gradient-to-br ${COLOR_MAP[s.color] ?? COLOR_MAP.purple} p-6 text-center`}
                  >
                    <div className="mb-2 text-4xl">{s.emoji}</div>
                    <p className="text-lg font-bold text-white drop-shadow">{s.text}</p>
                    <p className="mt-3 text-[11px] text-white/70">
                      {new Date(s.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
