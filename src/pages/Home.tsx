import { useState } from "react";
import { trpc } from "@/providers/trpc";
import Layout from "@/components/Layout";
import StoryBar from "@/components/StoryBar";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, Zap, BadgeCheck } from "lucide-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [game, setGame] = useState("Semua");
  const products = trpc.product.list.useQuery({ search: search || undefined, game });
  const games = trpc.product.games.useQuery();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-slate-900 to-fuchsia-950/40 p-8 md:p-12">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <h1 className="relative text-3xl font-black md:text-5xl">
          Jual Beli Akun Game
          <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
            Aman & Terpercaya
          </span>
        </h1>
        <p className="relative mt-3 max-w-xl text-sm text-slate-400 md:text-base">
          Kine Store adalah marketplace akun game dengan seller terverifikasi, chat langsung, dan pembayaran via QRIS / transfer. ML, Genshin, Valorant, FF, PUBG — semua ada.
        </p>
        <div className="relative mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Seller terverifikasi</span>
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-400" /> Chat langsung</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-violet-400" /> Badge kepercayaan</span>
        </div>
      </section>

      {/* Stories */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">📸 Status Seller</h2>
        <StoryBar />
      </div>

      {/* Search & filter */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Cari akun... (mis: Mythic, Genshin, Reaver)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-700 bg-slate-900 pl-9 text-slate-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["Semua", ...(games.data ?? [])].map((g) => (
            <button
              key={g}
              onClick={() => setGame(g)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                game === g
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-500/50"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog */}
      {products.isLoading ? (
        <p className="py-16 text-center text-slate-500">Memuat katalog...</p>
      ) : products.data && products.data.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.data.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-slate-500">Tidak ada produk ditemukan 😢</p>
      )}
    </Layout>
  );
}
