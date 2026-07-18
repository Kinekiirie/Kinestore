import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function Chat() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c") ? Number(params.get("c")) : null;
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const convs = trpc.chat.conversations.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 4000,
  });
  const thread = trpc.chat.messages.useQuery(
    { conversationId: activeId! },
    { enabled: !!user && activeId !== null, refetchInterval: 3000 },
  );
  const utils = trpc.useUtils();
  const send = trpc.chat.send.useMutation({
    onSuccess: () => {
      setText("");
      utils.chat.messages.invalidate();
      utils.chat.conversations.invalidate();
    },
  });

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data?.messages.length]);

  if (!user) return <Layout><p className="py-16 text-center text-slate-500">...</p></Layout>;

  return (
    <Layout>
      <div className="mt-4 grid overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 md:grid-cols-[300px_1fr]" style={{ height: "calc(100vh - 8rem)" }}>
        {/* Conversation list */}
        <div className={`border-r border-slate-800 overflow-y-auto ${activeId ? "hidden md:block" : ""}`}>
          <h2 className="border-b border-slate-800 p-4 font-bold">💬 Pesan</h2>
          {convs.data?.length === 0 && (
            <p className="p-4 text-sm text-slate-500">Belum ada percakapan. Chat seller dari halaman produk!</p>
          )}
          {convs.data?.map((c) => (
            <button
              key={c.id}
              onClick={() => setParams({ c: String(c.id) })}
              className={`flex w-full items-center gap-3 border-b border-slate-800/60 p-3 text-left transition hover:bg-slate-800/60 ${
                activeId === c.id ? "bg-violet-950/40" : ""
              }`}
            >
              <span className="text-2xl">{c.other?.avatar}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.other?.displayName}</span>
                <span className="block truncate text-xs text-slate-500">{c.lastMessage?.text ?? "Mulai percakapan..."}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          {activeId && thread.data ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-800 p-4">
                <button className="text-slate-400 md:hidden" onClick={() => setParams({})}>←</button>
                <span className="text-2xl">{thread.data.other?.avatar}</span>
                <Link to={`/seller/${thread.data.other?.id}`} className="font-semibold hover:text-violet-300">
                  {thread.data.other?.displayName}
                </Link>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.data.messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">Belum ada pesan. Sapa dulu! 👋</p>
                )}
                {thread.data.messages.map((m) => {
                  const mine = m.senderId === thread.data.me;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          mine
                            ? "rounded-br-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                            : "rounded-bl-sm bg-slate-800 text-slate-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-slate-500"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) send.mutate({ conversationId: activeId, text: text.trim() });
                }}
                className="flex gap-2 border-t border-slate-800 p-3"
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tulis pesan..."
                  className="border-slate-700 bg-slate-800 text-slate-100"
                />
                <Button type="submit" disabled={send.isPending || !text.trim()} className="bg-violet-600">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-slate-500">
              <p>Pilih percakapan untuk mulai chat 💬</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
