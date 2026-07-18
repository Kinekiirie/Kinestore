import { useParams, useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import Layout from "@/components/Layout";
import { BadgeRow } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { formatIDR, useAuth } from "@/lib/auth";
import { MessageCircle, Phone, ShieldCheck } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const product = trpc.product.byId.useQuery({ id: Number(id) });
  const startChat = trpc.chat.start.useMutation({
    onSuccess: (res) => navigate(`/chat?c=${res.id}`),
  });

  if (product.isLoading) return <Layout><p className="py-16 text-center text-slate-500">Memuat produk...</p></Layout>;
  if (!product.data) return <Layout><p className="py-16 text-center text-slate-500">Produk tidak ditemukan</p></Layout>;

  const p = product.data;
  const waPhone = p.seller?.phone?.replace(/^0/, "62").replace(/[^0-9]/g, "");

  return (
    <Layout>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="relative grid h-80 place-items-center rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-800 to-slate-900 text-9xl">
          {p.image}
          {p.status === "sold" && (
            <span className="absolute inset-0 grid place-items-center rounded-3xl bg-slate-950/70 text-3xl font-black tracking-widest text-red-400">
              TERJUAL
            </span>
          )}
        </div>
        <div>
          <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-semibold text-violet-300">{p.game} · {p.category}</span>
          <h1 className="mt-3 text-2xl font-black md:text-3xl">{p.title}</h1>
          {p.level && <p className="mt-1 text-sm text-slate-400">🏅 Rank/Level: {p.level}</p>}
          <p className="mt-4 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-3xl font-black text-transparent">
            {formatIDR(p.price)}
          </p>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-bold text-slate-300">Deskripsi</h3>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-400">{p.description || "Tidak ada deskripsi."}</p>
          </div>

          {/* Seller card */}
          {p.seller && (
            <Link to={`/seller/${p.seller.id}`} className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-violet-500/40">
              <span className="text-3xl">{p.seller.avatar}</span>
              <div className="flex-1">
                <p className="font-bold">{p.seller.displayName} {p.seller.isVerified && "✅"}</p>
                <BadgeRow badges={p.sellerBadges} small />
              </div>
              <span className="text-xs text-violet-400">Lihat toko →</span>
            </Link>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              disabled={p.status === "sold"}
              onClick={() => (user ? p.seller && startChat.mutate({ sellerId: p.seller.id }) : navigate("/login"))}
              className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Chat Seller untuk Beli
            </Button>
            {waPhone && (
              <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/10">
                  <Phone className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
              </a>
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Tips aman: selalu konfirmasi detail akun lewat chat sebelum transfer.
          </p>
        </div>
      </div>
    </Layout>
  );
}
