import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./AdminLayout";

interface Stats {
  users: { total: number };
  orders: { total: number; byStatus: Record<string, number> };
  orderStats: { status: string; count: number; totalAmount: number }[];
  revenue: { last30Days: { date: string; amount: number }[] };
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement stats");
      return res.json();
    },
  });

  const statusLabels: Record<string, string> = {
    pending_payment: "En attente de paiement",
    paid: "Payé",
    processing: "En traitement",
    shipped: "Expédié",
    delivered: "Livré",
    cancelled: "Annulé",
    refunded: "Remboursé",
  };

  const statusColors: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-stone-100 text-stone-600",
    refunded: "bg-red-100 text-red-700",
  };

  const totalRevenue = stats?.orderStats?.reduce((sum, s) => sum + (s.totalAmount || 0), 0) || 0;
  const usersCount = stats?.users?.total || 0;
  const ordersCount = stats?.orders?.total || 0;
  const orderStats = stats?.orderStats || [];
  const revenueByDay = stats?.revenue?.last30Days || [];

  return (
    <AdminLayout title="Tableau de bord">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Revenus totaux
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(totalRevenue / 100).toFixed(2)}$ CAD
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Commandes
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordersCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Utilisateurs
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usersCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Taux de conversion
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usersCount && ordersCount 
                    ? ((ordersCount / usersCount) * 100).toFixed(1) 
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes par statut</CardTitle>
              </CardHeader>
              <CardContent>
                {orderStats.length > 0 ? (
                  <div className="space-y-3">
                    {orderStats.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-stone-100'}`}>
                            {statusLabels[item.status] || item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-stone-600">{item.count} commande(s)</span>
                          <span className="font-medium">{(item.totalAmount / 100).toFixed(2)}$</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-500 text-center py-8">Aucune commande</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenus (30 derniers jours)</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByDay.length > 0 ? (
                  <div className="space-y-2">
                    {revenueByDay.slice(-7).map((item) => (
                      <div key={item.date} className="flex items-center justify-between">
                        <span className="text-sm text-stone-600">{item.date}</span>
                        <span className="font-medium">{(item.amount / 100).toFixed(2)}$</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-500 text-center py-8">Aucun revenu</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
