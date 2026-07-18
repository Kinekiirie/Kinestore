import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/lib/auth";
import Captcha, { type CaptchaValue } from "@/components/Captcha";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaValue>({ captchaId: null, answer: "", robotChecked: false });
  const [error, setError] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: (res) => {
      setSession(res.token);
      navigate("/");
    },
    onError: (e) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!captcha.captchaId) return setError("Captcha belum siap, tunggu sebentar");
    login.mutate({
      username,
      password,
      captchaId: captcha.captchaId,
      captchaAnswer: captcha.answer,
      robotChecked: captcha.robotChecked,
    });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
        <Link to="/" className="block text-center">
          <span className="text-4xl">🎮</span>
          <h1 className="mt-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-2xl font-black text-transparent">
            Masuk ke Kine Store
          </h1>
        </Link>
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="border-slate-700 bg-slate-800 text-slate-100" required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-slate-700 bg-slate-800 text-slate-100" required />
        <Captcha value={captcha} onChange={setCaptcha} />
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={login.isPending} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600">
          {login.isPending ? "Memproses..." : "Masuk"}
        </Button>
        <p className="text-center text-sm text-slate-400">
          Belum punya akun?{" "}
          <Link to="/register" className="text-violet-400 hover:underline">
            Daftar di sini
          </Link>
        </p>
        <p className="text-center text-xs text-slate-600">Demo: raka_gg / password123</p>
      </form>
    </div>
  );
}
