import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Input } from "@/components/ui/input";
import { RefreshCw, ShieldCheck } from "lucide-react";

export type CaptchaValue = {
  captchaId: number | null;
  answer: string;
  robotChecked: boolean;
};

export default function Captcha({
  value,
  onChange,
}: {
  value: CaptchaValue;
  onChange: (v: CaptchaValue) => void;
}) {
  const captcha = trpc.auth.getCaptcha.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const [fetching, setFetching] = useState(false);

  const id = captcha.data?.id ?? null;
  if (id !== null && value.captchaId !== id) {
    onChange({ ...value, captchaId: id });
  }

  const refresh = async () => {
    setFetching(true);
    const res = await captcha.refetch();
    onChange({ captchaId: res.data?.id ?? null, answer: "", robotChecked: value.robotChecked });
    setFetching(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      {/* reCAPTCHA-style checkbox */}
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-3 select-none">
        <input
          type="checkbox"
          checked={value.robotChecked}
          onChange={(e) => onChange({ ...value, robotChecked: e.target.checked })}
          className="h-5 w-5 accent-violet-500"
        />
        <span className="text-sm font-medium text-slate-200">Saya bukan robot</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
          <ShieldCheck className="h-6 w-6 text-violet-400" />
          KineCAPTCHA
          <br />
          Privasi - Syarat
        </span>
      </label>

      {/* Verification code */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-gradient-to-r from-violet-950 to-fuchsia-950 px-4 py-2.5 text-center font-mono text-sm font-bold tracking-wider text-violet-200">
          {captcha.data?.question ?? "Memuat..."}
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-slate-600 p-2.5 text-slate-400 hover:text-violet-300"
          title="Ganti soal"
        >
          <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
        </button>
      </div>
      <Input
        placeholder="Tulis jawaban verifikasi..."
        value={value.answer}
        onChange={(e) => onChange({ ...value, answer: e.target.value })}
        className="border-slate-600 bg-slate-800 text-slate-100"
      />
    </div>
  );
}
