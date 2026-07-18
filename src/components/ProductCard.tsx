import { Link } from "react-router";
import { formatIDR } from "@/lib/auth";

export type ProductCardData = {
  id: number;
  title: string;
  game: string;
  price: number;
  image: string;
  level: string | null;
  status: string;
  seller?: { id: number; displayName: string; avatar: string } | null;
};

export default function ProductCard({ p }: { p: ProductCardData }) {
  return (
    <Link
      to={`/product/${p.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
    >
      <div className="relative grid h-36 place-items-center bg-gradient-to-br from-slate-800 to-slate-900 text-6xl">
        {p.image}
        {p.status === "sold" && (
          <span className="absolute inset-0 grid place-items-center bg-slate-950/70 text-lg font-black tracking-widest text-red-400">
            TERJUAL
          </span>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-violet-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
          {p.game}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-100 group-hover:text-violet-300">
          {p.title}
        </h3>
        {p.level && <p className="mt-0.5 text-[11px] text-slate-400">🏅 {p.level}</p>}
        <p className="mt-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-base font-black text-transparent">
          {formatIDR(p.price)}
        </p>
        {p.seller && (
          <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] text-slate-400">
            <span>{p.seller.avatar}</span> {p.seller.displayName}
          </p>
        )}
      </div>
    </Link>
  );
}
