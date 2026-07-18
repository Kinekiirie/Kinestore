import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import Layout from "@/components/Layout";
import { useAuth, formatIDR } from "@/lib/auth";
import { BadgeRow } from "@/components/Badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

const EMOJI_CHOICES = ["🎯", "🛡️", "🔥", "⚡", "🌸", "🔫", "🧱", "⭐", "🐉", "👑", "💎", "🗡️"];
const AVATAR_CHOICES = ["🎮", "🕹️", "👾", "🐉", "⚔️", "🏆", "🦊", "🐺", "🤖", "👑", "💀", "🔥"];
const STORY_COLORS = ["purple", "blue", "pink", "green", "orange"];

type ProductForm = {
  id?: number;
  title: string;
  game: string;
  category: string;
  description: string;
  price: string;
  image: string;
  level: string;
};

const emptyForm: ProductForm = { title: "", game: "", category: "Akun", description: "", price: "", image: "🎯", level: "" };

export default function Dashboard() {
  const { user, badges, loading, refetch } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const myProducts = trpc.product.mine.useQuery(undefined, { enabled: !!user });
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil tersimpan!");
      refetch();
    },
  });
  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success("Produk ditambahkan!");
      setDialogOpen(false);
      utils.product.mine.invalidate();
      utils.product.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => {
      toast.success("Produk diperbarui!");
      setDialogOpen(false);
      utils.product.mine.invalidate();
      utils.product.list.invalidate();
    },
  });
  const removeProduct = trpc.product.remove.useMutation({
    onSuccess: () => {
      toast.success("Produk dihapus");
      utils.product.mine.invalidate();
      utils.product.list.invalidate();
    },
  });
  const createStory = trpc.story.create.useMutation({
    onSuccess: () => {
      toast.success("Status diposting! Tayang 24 jam.");
      setStoryText("");
      utils.story.feed.invalidate();
    },
  });

  // profile form
  const [profile, setProfile] = useState({ displayName: "", bio: "", avatar: "🎮", phone: "", qrisNote: "", qrisImage: "" });
  useEffect(() => {
    if (user) {
      setProfile({
        displayName: user.displayName,
        bio: user.bio ?? "",
        avatar: user.avatar,
        phone: user.phone ?? "",
        qrisNote: user.qrisNote ?? "",
        qrisImage: user.qrisImage ?? "",
      });
    }
  }, [user]);

  // product dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  // story form
  const [storyText, setStoryText] = useState("");
  const [storyEmoji, setStoryEmoji] = useState("🔥");
  const [storyColor, setStoryColor] = useState("purple");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (!user) return <Layout><p className="py-16 text-center text-slate-500">...</p></Layout>;

  const saveProduct = () => {
    const price = parseInt(form.price.replace(/[^0-9]/g, ""), 10);
    if (!form.title || !form.game || !price) return toast.error("Lengkapi judul, game, dan harga");
    const payload = {
      title: form.title,
      game: form.game,
      category: form.category,
      description: form.description,
      price,
      image: form.image,
      level: form.level || undefined,
    };
    if (form.id) updateProduct.mutate({ id: form.id, ...payload });
    else createProduct.mutate(payload);
  };

  const handleQrisFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 500 * 1024) return toast.error("Gambar QRIS maksimal 500KB");
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, qrisImage: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <span className="text-5xl">{user.avatar}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-black">{user.displayName}</h1>
          <p className="text-sm text-slate-500">@{user.username}</p>
          <div className="mt-1"><BadgeRow badges={badges} /></div>
        </div>
        <Link to={`/seller/${user.id}`}>
          <Button variant="outline" className="border-slate-700 text-slate-300">Lihat Profil Publik</Button>
        </Link>
      </div>

      <Tabs defaultValue="products" className="mt-6">
        <TabsList className="bg-slate-900">
          <TabsTrigger value="products">🛒 Produk Saya</TabsTrigger>
          <TabsTrigger value="story">📸 Posting Status</TabsTrigger>
          <TabsTrigger value="profile">⚙️ Profil & Pembayaran</TabsTrigger>
        </TabsList>

        {/* Products */}
        <TabsContent value="products">
          <Button
            onClick={() => {
              setForm(emptyForm);
              setDialogOpen(true);
            }}
            className="mb-4 bg-gradient-to-r from-violet-600 to-fuchsia-600"
          >
            <Plus className="mr-1 h-4 w-4" /> Tambah Produk
          </Button>
          {myProducts.data?.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">Belum ada produk. Tambahkan akun game pertamamu!</p>
          )}
          <div className="space-y-3">
            {myProducts.data?.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-4xl">{p.image}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.game} · {formatIDR(p.price)}</p>
                </div>
                <button
                  onClick={() => updateProduct.mutate({ id: p.id, status: p.status === "available" ? "sold" : "available" })}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    p.status === "available" ? "bg-emerald-600/20 text-emerald-300" : "bg-red-600/20 text-red-300"
                  }`}
                >
                  {p.status === "available" ? "Tersedia" : "Terjual"}
                </button>
                <button
                  onClick={() => {
                    setForm({
                      id: p.id, title: p.title, game: p.game, category: p.category,
                      description: p.description ?? "", price: String(p.price), image: p.image, level: p.level ?? "",
                    });
                    setDialogOpen(true);
                  }}
                  className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-violet-300"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => confirm("Hapus produk ini?") && removeProduct.mutate({ id: p.id })}
                  className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Story */}
        <TabsContent value="story">
          <div className="max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="font-bold">Buat Status (tampil 24 jam, seperti Instagram Story)</h3>
            <Textarea
              placeholder="Tulis status... mis: RESTOCK akun ML murah! 🔥"
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              maxLength={280}
              className="border-slate-700 bg-slate-800 text-slate-100"
            />
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((e) => (
                <button key={e} onClick={() => setStoryEmoji(e)} className={`rounded-lg p-2 text-xl ${storyEmoji === e ? "bg-violet-600/40 ring-1 ring-violet-400" : "bg-slate-800"}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {STORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setStoryColor(c)}
                  className={`h-8 w-8 rounded-full ${storyColor === c ? "ring-2 ring-white" : ""} ${
                    { purple: "bg-violet-600", blue: "bg-blue-600", pink: "bg-pink-600", green: "bg-emerald-600", orange: "bg-orange-600" }[c]
                  }`}
                />
              ))}
            </div>
            <Button
              disabled={!storyText.trim() || createStory.isPending}
              onClick={() => createStory.mutate({ text: storyText.trim(), emoji: storyEmoji, color: storyColor })}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              Posting Status
            </Button>
          </div>
        </TabsContent>

        {/* Profile & payment */}
        <TabsContent value="profile">
          <div className="max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="font-bold">Edit Profil</h3>
            <div>
              <label className="text-xs text-slate-400">Avatar</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {AVATAR_CHOICES.map((e) => (
                  <button key={e} onClick={() => setProfile({ ...profile, avatar: e })} className={`rounded-lg p-2 text-xl ${profile.avatar === e ? "bg-violet-600/40 ring-1 ring-violet-400" : "bg-slate-800"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <Input placeholder="Nama tampilan" value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />
            <Textarea placeholder="Bio toko..." value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />

            <h3 className="pt-2 font-bold">📱 Kontak & Pembayaran</h3>
            <Input placeholder="Nomor telepon / WhatsApp (08xx)" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />
            <Input placeholder="Catatan QRIS (mis: QRIS a.n. Toko Raka)" value={profile.qrisNote} onChange={(e) => setProfile({ ...profile, qrisNote: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />
            <div>
              <label className="text-xs text-slate-400">Gambar QRIS (opsional, maks 500KB)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleQrisFile(e.target.files?.[0])}
                className="mt-1 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:text-white"
              />
              {profile.qrisImage && (
                <div className="mt-2 flex items-start gap-3">
                  <img src={profile.qrisImage} alt="QRIS" className="h-28 w-28 rounded-xl border border-slate-600 object-cover" />
                  <button onClick={() => setProfile({ ...profile, qrisImage: "" })} className="text-xs text-red-400">Hapus gambar</button>
                </div>
              )}
            </div>

            <Button
              onClick={() =>
                updateProfile.mutate({
                  displayName: profile.displayName,
                  bio: profile.bio,
                  avatar: profile.avatar,
                  phone: profile.phone,
                  qrisNote: profile.qrisNote,
                  qrisImage: profile.qrisImage,
                })
              }
              disabled={updateProfile.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              Simpan Profil
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((e) => (
                <button key={e} onClick={() => setForm({ ...form, image: e })} className={`rounded-lg p-1.5 text-lg ${form.image === e ? "bg-violet-600/40 ring-1 ring-violet-400" : "bg-slate-800"}`}>
                  {e}
                </button>
              ))}
            </div>
            <Input placeholder="Judul (mis: Akun ML Mythic 120 Skin)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Game (mis: Mobile Legends)" value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />
              <Input placeholder="Harga (Rp)" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, "") })} className="border-slate-700 bg-slate-800 text-slate-100" />
            </div>
            <Input placeholder="Rank/Level (opsional, mis: Mythic Glory)" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />
            <Textarea placeholder="Deskripsi akun..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" />
            <Button onClick={saveProduct} disabled={createProduct.isPending || updateProduct.isPending} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600">
              {form.id ? "Simpan Perubahan" : "Tambah ke Katalog"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
