import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import Captcha, { type CaptchaValue } from "@/components/Captcha";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Register() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [form, setForm] = useState({ username: "", displayName: "", password: "", confirm: "" });
  const [captcha, setCaptcha] = useState<CaptchaValue>({ captchaId: null, answer: "", robotChecked: false });
  const [error, setError] = useState("");

  const register = trpc.auth.register.useMutation({
    onSuccess: (res) => {
      setSession(res.token);
      navigate("/");
    },
    onError: (e) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Konfirmasi password tidak sama");
    if (!captcha.captchaId) return setError("Captcha belum siap, tunggu sebentar");
    register.mutate({
      username: form.username,
      displayName: form.displayName,
      password: form.password,
      captchaId: captcha.captchaId,
      captchaAnswer: captcha.answer,
      robotChecked: captcha.robotChecked,
    });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-8 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
        <Link to="/" className="block text-center">
          <span className="text-4xl">🎮</span>
          <h1 className="mt-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-2xl font-black text-transparent">
            Daftar Kine Store
          </h1>
        </Link>
        <Input placeholder="Username (huruf/angka, tanpa spasi)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" required minLength={3} />
        <Input placeholder="Nama toko / nama tampilan" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" required minLength={2} />
        <Input type="password" placeholder="Password (min. 6 karakter)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" required minLength={6} />
        <Input type="password" placeholder="Ulangi password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-100" required />
        <Captcha value={captcha} onChange={setCaptcha} />
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={register.isPending} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600">
          {register.isPending ? "Memproses..." : "Buat Akun"}
        </Button>
        <p className="text-center text-sm text-slate-400">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-violet-400 hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  );
}
