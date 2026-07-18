import { useParams, useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { BadgeRow } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, QrCode, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth";

const COLOR_MAP: Record<string, string> = {
  purple: "from-violet-600 to-fuchsia-600",
  blue: "from-blue-600 to-cyan-500",
  pink: "from-pink-600 to-rose-500",
  green: "from-emerald-600 to-teal-500",
  orange: "from-orange-600 to-amber-500",
};

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = trpc.user.profile.useQuery({ id: Number(id) });
  const startChat = trpc.chat.start.useMutation({
    onSuccess: (res) => navigate(`/chat?c=${res.id}`),
  });

  if (profile.isLoading) return <Layout><p className="py-16 text-center text-slate-500">Memuat profil...</p></Layout>;
  if (!profile.data) return <Layout><p className="py-16 text-center text-slate-500">Seller tidak ditemukan</p></Layout>;

  const { user: seller, badges, products, stories } = profile.data;
  const waPhone = seller.phone?.replace(/^0/, "62").replace(/[^0-9]/g, "");

  return (
    <Layout>
      {/* Header */}
      <div className="mt-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-violet-950/40 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border-2 border-violet-500/40 bg-slate-800 text-5xl">
            {seller.avatar}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black">{seller.displayName}</h1>
              {seller.isVerified && <span title="Terverifikasi">✅</span>}
            </div>
            <p className="text-sm text-slate-500">@{seller.username}</p>
            <div className="mt-2"><BadgeRow badges={badges} /></div>
            {seller.bio && <p className="mt-3 max-w-xl text-sm text-slate-300">{seller.bio}</p>}
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" /> Bergabung {new Date(seller.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </p>
          </div>
          {user?.id !== seller.id && (
            <Button
              onClick={() => (user ? startChat.mutate({ sellerId: seller.id }) : navigate("/login"))}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Chat Seller
            </Button>
          )}
        </div>

        {/* Kontak */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Phone className="h-4 w-4 text-emerald-400" /> Nomor Telepon / WhatsApp
            </h3>
            {seller.phone ? (
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded-lg bg-emerald-600/20 px-4 py-2 font-mono text-lg font-bold text-emerald-300 hover:bg-emerald-600/30"
              >
                {seller.phone}
              </a>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Seller belum menambahkan nomor telepon</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <QrCode className="h-4 w-4 text-violet-400" /> Pembayaran QRIS
            </h3>
            {seller.qrisImage ? (
              <div className="mt-2">
                <img src={seller.qrisImage} alt="QRIS" className="h-40 w-40 rounded-xl border border-slate-600 object-cover" />
                {seller.qrisNote && <p className="mt-1 text-xs text-slate-400">{seller.qrisNote}</p>}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {seller.qrisNote ? `💳 ${seller.qrisNote} (minta kode QRIS via chat)` : "Minta kode QRIS langsung via chat"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      {stories.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">📸 Status Seller</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <div key={s.id} className={`rounded-2xl bg-gradient-to-br ${COLOR_MAP[s.color] ?? COLOR_MAP.purple} p-5 text-center`}>
                <div className="text-3xl">{s.emoji}</div>
                <p className="mt-2 font-bold text-white">{s.text}</p>
                <p className="mt-2 text-[11px] text-white/70">
                  {new Date(s.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produk */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold">🛒 Katalog ({products.length})</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={{ ...p, seller: { id: seller.id, displayName: seller.displayName, avatar: seller.avatar } }} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-slate-500">Belum ada produk. <Link to="/" className="text-violet-400">Kembali ke katalog</Link></p>
        )}
      </div>
    </Layout>
  );
}
