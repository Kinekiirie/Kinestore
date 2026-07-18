import { Link, useNavigate } from "react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gamepad2, MessageCircle, LayoutDashboard, LogOut, Store } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-40 border-b border-violet-500/20 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg">
              🎮
            </span>
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-xl font-black text-transparent">
              Kine Store
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-slate-300">
              <Store className="mr-1 h-4 w-4" /> Katalog
            </Button>
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/chat")} className="text-slate-300">
                  <MessageCircle className="mr-1 h-4 w-4" /> Chat
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-slate-900 px-3 py-1.5 text-sm hover:border-violet-400">
                      <span className="text-lg">{user.avatar}</span>
                      <span className="max-w-24 truncate font-medium">{user.displayName}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border-slate-700 bg-slate-900 text-slate-100">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard Saya
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/seller/${user.id}`)} className="cursor-pointer">
                      <Gamepad2 className="mr-2 h-4 w-4" /> Profil Toko
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="cursor-pointer text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-slate-300">
                  Masuk
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                >
                  Daftar
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 pb-16">{children}</main>
    </div>
  );
}
