import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Loader2,
  Crown,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./AdminLayout";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface ChartData {
  labels: string[];
  values: number[];
}

interface SubscriptionPlan {
  plan: string;
  count: number;
}

interface Stats {
  users: { total: number };
  orders: { total: number; byStatus: Record<string, number> };
  orderStats: { status: string; count: number; totalAmount: number }[];
  revenue: { last30Days: { date: string; amount: number }[] };
  subscriptionPlans?: SubscriptionPlan[];
  charts?: {
    gender: ChartData;
    region: ChartData;
    products: ChartData;
  };
}

const COLORS = ['#6A9FB5', '#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#264653', '#9B2335', '#8E7CC3'];

function transformChartData(data: ChartData | undefined) {
  if (!data || !data.labels || !data.values) return [];
  return data.labels.map((label, index) => ({
    name: label,
    value: data.values[index] || 0
  }));
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

  const genderData = transformChartData(stats?.charts?.gender);
  const regionData = transformChartData(stats?.charts?.region);
  const productData = transformChartData(stats?.charts?.products);
  const subscriptionPlans = stats?.subscriptionPlans || [];

  const planLabels: Record<string, string> = {
    free: "De base (Gratuit)",
    premium: "Premium",
    platine: "Platine",
  };

  const planColors: Record<string, string> = {
    free: "bg-stone-100 text-stone-700",
    premium: "bg-blue-100 text-blue-700",
    platine: "bg-amber-100 text-amber-700",
  };

  const planPrices: Record<string, string> = {
    free: "0,00 $",
    premium: "1,99 $/mois",
    platine: "4,99 $/mois",
  };

  const totalSubscribers = subscriptionPlans.reduce((sum, p) => sum + p.count, 0);

  return (
    <AdminLayout title="Tableau de bord">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Revenus totaux
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-revenue">
                  {(totalRevenue / 100).toFixed(2)}$ CAD
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-orders">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Commandes
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-orders">{ordersCount}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-users">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Utilisateurs
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-users">{usersCount}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-conversion">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">
                  Taux de conversion
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-conversion-rate">
                  {usersCount && ordersCount 
                    ? ((ordersCount / usersCount) * 100).toFixed(1) 
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card data-testid="chart-gender">
              <CardHeader>
                <CardTitle className="text-lg">Genre des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                {genderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {genderData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} utilisateur(s)`, 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-stone-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="chart-region">
              <CardHeader>
                <CardTitle className="text-lg">Régions</CardTitle>
              </CardHeader>
              <CardContent>
                {regionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={regionData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => [`${value}`, 'Commandes']} />
                      <Bar dataKey="value" fill="#6A9FB5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-stone-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="chart-products">
              <CardHeader>
                <CardTitle className="text-lg">Types de produits</CardTitle>
              </CardHeader>
              <CardContent>
                {productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={productData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {productData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} commande(s)`, 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-stone-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-orders-by-status">
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

            <Card data-testid="card-revenue-chart">
              <CardHeader>
                <CardTitle className="text-lg">Revenus (30 derniers jours)</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueByDay.slice(-7).map(d => ({ ...d, amount: d.amount / 100 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(2)}$`, 'Revenus']} />
                      <Bar dataKey="amount" fill="#2A9D8F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-stone-500 text-center py-8">Aucun revenu</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="table-subscriptions">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Types d'abonnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionPlans.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-200">
                        <th className="text-left py-3 px-4 font-medium text-stone-600">Plan</th>
                        <th className="text-center py-3 px-4 font-medium text-stone-600">Prix</th>
                        <th className="text-center py-3 px-4 font-medium text-stone-600">Abonnés</th>
                        <th className="text-right py-3 px-4 font-medium text-stone-600">% du total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionPlans.map((item) => (
                        <tr key={item.plan} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`row-plan-${item.plan}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {item.plan === 'platine' && <Sparkles className="h-4 w-4 text-amber-500" />}
                              {item.plan === 'premium' && <Crown className="h-4 w-4 text-blue-500" />}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[item.plan] || 'bg-stone-100'}`}>
                                {planLabels[item.plan] || item.plan}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-stone-600" data-testid={`text-price-${item.plan}`}>
                            {planPrices[item.plan] || '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold" data-testid={`text-count-${item.plan}`}>
                            {item.count}
                          </td>
                          <td className="py-3 px-4 text-right text-stone-600">
                            {totalSubscribers > 0 ? ((item.count / totalSubscribers) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-stone-50 font-medium">
                        <td className="py-3 px-4">Total</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-center" data-testid="text-total-subscribers">{totalSubscribers}</td>
                        <td className="py-3 px-4 text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-stone-500 text-center py-8">Aucun abonnement</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
