import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  ChevronLeft,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, navigate] = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const navItems = [
    { path: "/app/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { path: "/app/admin/orders", label: "Commandes", icon: ShoppingCart },
    { path: "/app/admin/users", label: "Utilisateurs", icon: Users },
    { path: "/app/admin/exports", label: "Exports PDF", icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">Accès refusé</h1>
          <p className="text-stone-600 mb-6">
            Vous n'avez pas les droits administrateur pour accéder à cette page.
          </p>
          <Button onClick={() => navigate("/app")} className="w-full">
            Retour à l'application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-200">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="text-stone-600">
              <ChevronLeft size={16} className="mr-1" />
              Retour à l'app
            </Button>
          </Link>
        </div>
        
        <div className="p-4">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Administration
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.path || 
                (item.path !== "/app/admin" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-stone-200 px-6 py-4">
          <h1 className="text-xl font-bold text-stone-800">{title}</h1>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
