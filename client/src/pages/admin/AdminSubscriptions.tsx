import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Crown, 
  Sparkles, 
  Search,
  Filter,
  ChevronRight,
  Calendar,
  CreditCard,
  History,
  Percent,
  DollarSign,
  X,
  Plus,
  Loader2,
  AlertTriangle,
  Check,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "./AdminLayout";
import { apiRequest } from "@/lib/queryClient";

interface UserWithSubscription {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
  userPlan: {
    plan: string;
    storageUsed: number;
  } | null;
  activeDiscounts: any[];
  recentPayments: any[];
}

interface Discount {
  id: string;
  name: string;
  code: string;
  type: string;
  value: number;
  scope: string;
  isActive: boolean;
  createdAt: string;
}

const planLabels: Record<string, string> = {
  free: "De base",
  premium: "Premium",
  platine: "Platine",
};

const planColors: Record<string, string> = {
  free: "bg-stone-100 text-stone-700",
  premium: "bg-blue-100 text-blue-700",
  platine: "bg-amber-100 text-amber-700",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  canceled: "Annulé",
  suspended: "Suspendu",
  past_due: "En retard",
  none: "Aucun",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
  past_due: "bg-yellow-100 text-yellow-700",
  none: "bg-stone-100 text-stone-500",
};

export default function AdminSubscriptions() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showApplyDiscount, setShowApplyDiscount] = useState(false);
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [changePlanNotes, setChangePlanNotes] = useState("");

  const [discountForm, setDiscountForm] = useState({
    name: "",
    type: "percentage",
    value: "",
    code: "",
    scope: "user",
    expiresAt: "",
    durationMonths: "0", // 0 = indefinite, 1-12 = months
  });

  const { data: users = [], isLoading } = useQuery<UserWithSubscription[]>({
    queryKey: ["/api/admin/subscriptions/users", filterPlan],
    queryFn: async () => {
      const filter = filterPlan !== "all" ? `?filter=${filterPlan}` : "";
      const res = await fetch(`/api/admin/subscriptions/users${filter}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: userDetails } = useQuery({
    queryKey: ["/api/admin/subscriptions/users", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const res = await fetch(`/api/admin/subscriptions/users/${selectedUser.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedUser && showUserDetail,
  });

  const { data: discounts = [] } = useQuery<Discount[]>({
    queryKey: ["/api/admin/discounts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/discounts", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch discounts");
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, newPlan, notes }: { userId: string; newPlan: string; notes: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/change-plan`, { newPlan, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/users"] });
      setShowChangePlan(false);
      setNewPlan("");
      setChangePlanNotes("");
    },
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (data: typeof discountForm) => {
      const payload = {
        ...data,
        value: data.type === "fixed" 
          ? Math.round(parseFloat(data.value) * 100)
          : parseInt(data.value),
        durationMonths: parseInt(data.durationMonths) || 0,
      };
      return apiRequest("POST", "/api/admin/discounts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      setShowCreateDiscount(false);
      setDiscountForm({ name: "", type: "percentage", value: "", code: "", scope: "user", expiresAt: "", durationMonths: "0" });
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: async ({ userId, discountId }: { userId: string; discountId: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/discounts`, { discountId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/users"] });
      setShowApplyDiscount(false);
    },
  });

  const removeDiscountMutation = useMutation({
    mutationFn: async ({ userId, discountId }: { userId: string; discountId: string }) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}/discounts/${discountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/users"] });
    },
  });

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.fullName?.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout title="Gestion des abonnements">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-users"
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-40" data-testid="select-filter-plan">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="free">De base</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="platine">Platine</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="canceled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowCreateDiscount(true)} data-testid="button-create-discount">
            <Plus className="h-4 w-4 mr-2" />
            Créer un rabais
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateurs ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-stone-500 py-8">Aucun utilisateur trouvé</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 px-4 font-medium text-stone-600">Utilisateur</th>
                      <th className="text-center py-3 px-4 font-medium text-stone-600">Plan</th>
                      <th className="text-center py-3 px-4 font-medium text-stone-600">Statut</th>
                      <th className="text-center py-3 px-4 font-medium text-stone-600">Rabais</th>
                      <th className="text-center py-3 px-4 font-medium text-stone-600">Inscrit le</th>
                      <th className="text-right py-3 px-4 font-medium text-stone-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetail(true);
                        }}
                        data-testid={`row-user-${user.id}`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-stone-800">{user.fullName || "Sans nom"}</p>
                            <p className="text-xs text-stone-500">{user.email || "Pas d'email"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${planColors[user.userPlan?.plan || "free"]}`}>
                            {user.userPlan?.plan === "platine" && <Sparkles className="h-3 w-3" />}
                            {user.userPlan?.plan === "premium" && <Crown className="h-3 w-3" />}
                            {planLabels[user.userPlan?.plan || "free"]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[user.subscription?.status || "none"]}`}>
                            {statusLabels[user.subscription?.status || "none"]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {user.activeDiscounts?.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <Percent className="h-3 w-3" />
                              {user.activeDiscounts.length}
                            </span>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-stone-600">
                          {new Date(user.createdAt).toLocaleDateString("fr-CA")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="h-4 w-4 text-stone-400 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Rabais disponibles ({discounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {discounts.length === 0 ? (
              <p className="text-center text-stone-500 py-4">Aucun rabais créé</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discounts.map((discount) => (
                  <div 
                    key={discount.id} 
                    className={`p-4 rounded-xl border ${discount.isActive ? "border-green-200 bg-green-50" : "border-stone-200 bg-stone-50"}`}
                    data-testid={`card-discount-${discount.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-stone-800">{discount.name}</h4>
                      {discount.isActive ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      {discount.type === "percentage" ? (
                        <>-{discount.value}%</>
                      ) : (
                        <>-{(discount.value / 100).toFixed(2)} $</>
                      )}
                    </div>
                    {discount.code && (
                      <p className="text-xs text-stone-500 mt-1">Code: {discount.code}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Détails de l'utilisateur
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Nom</Label>
                  <p className="font-medium">{selectedUser.fullName || "Non renseigné"}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Email</Label>
                  <p className="font-medium">{selectedUser.email || "Non renseigné"}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <span className="font-medium">Plan actuel</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${planColors[selectedUser.userPlan?.plan || "free"]}`}>
                    {planLabels[selectedUser.userPlan?.plan || "free"]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">Statut</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedUser.subscription?.status || "none"]}`}>
                    {statusLabels[selectedUser.subscription?.status || "none"]}
                  </span>
                </div>
                {userDetails?.monthsElapsed !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Mois d'abonnement</span>
                    <span className="font-medium">{userDetails.monthsElapsed}</span>
                  </div>
                )}
              </div>

              {selectedUser.activeDiscounts?.length > 0 && (
                <div>
                  <Label className="text-stone-500 mb-2 block">Rabais actifs</Label>
                  <div className="space-y-2">
                    {selectedUser.activeDiscounts.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{d.discount?.name}</span>
                          <span className="text-green-700 font-bold">
                            {d.discount?.type === "percentage" ? `-${d.discount?.value}%` : `-${(d.discount?.value / 100).toFixed(2)} $`}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Retirer le rabais "${d.discount?.name}" ?`)) {
                              removeDiscountMutation.mutate({ userId: selectedUser.id, discountId: d.id });
                            }
                          }}
                          disabled={removeDiscountMutation.isPending}
                          data-testid={`button-remove-discount-${d.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userDetails?.planHistory?.length > 0 && (
                <div>
                  <Label className="text-stone-500 mb-2 block flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historique des changements
                  </Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userDetails.planHistory.map((h: any) => (
                      <div key={h.id} className="flex items-center justify-between p-2 bg-stone-50 rounded text-sm">
                        <div>
                          <span className="text-stone-500">{h.previousPlan || "Aucun"}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">{planLabels[h.newPlan]}</span>
                        </div>
                        <span className="text-xs text-stone-400">
                          {new Date(h.createdAt).toLocaleDateString("fr-CA")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userDetails?.payments?.length > 0 && (
                <div>
                  <Label className="text-stone-500 mb-2 block flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Derniers paiements
                  </Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userDetails.payments.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-stone-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${p.status === "succeeded" ? "bg-green-500" : "bg-red-500"}`}></span>
                          <span>{(p.amount / 100).toFixed(2)} $ {p.currency}</span>
                        </div>
                        <span className="text-xs text-stone-400">
                          {new Date(p.createdAt).toLocaleDateString("fr-CA")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUserDetail(false);
                    setShowApplyDiscount(true);
                  }}
                  data-testid="button-apply-discount"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Appliquer un rabais
                </Button>
                <Button
                  onClick={() => {
                    setShowUserDetail(false);
                    setNewPlan(selectedUser.userPlan?.plan || "free");
                    setShowChangePlan(true);
                  }}
                  data-testid="button-change-plan"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Changer le plan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePlan} onOpenChange={setShowChangePlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le plan</DialogTitle>
            <DialogDescription>
              Sélectionnez le nouveau plan pour {selectedUser?.fullName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nouveau plan</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger data-testid="select-new-plan">
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">De base (Gratuit)</SelectItem>
                  <SelectItem value="premium">Premium (1,99 $/mois)</SelectItem>
                  <SelectItem value="platine">Platine (4,99 $/mois)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea 
                value={changePlanNotes}
                onChange={(e) => setChangePlanNotes(e.target.value)}
                placeholder="Raison du changement..."
                data-testid="input-plan-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlan(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => {
                if (selectedUser && newPlan) {
                  changePlanMutation.mutate({ 
                    userId: selectedUser.id, 
                    newPlan, 
                    notes: changePlanNotes 
                  });
                }
              }}
              disabled={changePlanMutation.isPending}
              data-testid="button-confirm-change-plan"
            >
              {changePlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApplyDiscount} onOpenChange={setShowApplyDiscount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appliquer un rabais</DialogTitle>
            <DialogDescription>
              Sélectionnez un rabais à appliquer à {selectedUser?.fullName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {discounts.filter(d => d.isActive).length === 0 ? (
              <p className="text-center text-stone-500 py-4">Aucun rabais actif disponible</p>
            ) : (
              discounts.filter(d => d.isActive).map((discount) => (
                <div 
                  key={discount.id}
                  className="p-4 border rounded-xl hover:bg-stone-50 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    if (selectedUser) {
                      applyDiscountMutation.mutate({ 
                        userId: selectedUser.id, 
                        discountId: discount.id 
                      });
                    }
                  }}
                  data-testid={`option-discount-${discount.id}`}
                >
                  <div>
                    <p className="font-medium">{discount.name}</p>
                    <p className="text-sm text-stone-500">{discount.code || "Sans code"}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {discount.type === "percentage" ? `-${discount.value}%` : `-${(discount.value / 100).toFixed(2)} $`}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDiscount} onOpenChange={setShowCreateDiscount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un rabais</DialogTitle>
            <DialogDescription>
              Définissez les paramètres du nouveau rabais
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nom du rabais *</Label>
              <Input 
                value={discountForm.name}
                onChange={(e) => setDiscountForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ex: Rabais fidélité 20%"
                data-testid="input-discount-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select 
                  value={discountForm.type} 
                  onValueChange={(v) => setDiscountForm(f => ({ ...f, type: v, value: "" }))}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{discountForm.type === "percentage" ? "Pourcentage *" : "Montant *"}</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    step={discountForm.type === "percentage" ? "1" : "0.01"}
                    min="0"
                    max={discountForm.type === "percentage" ? "100" : undefined}
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={discountForm.type === "percentage" ? "20" : "5.00"}
                    className={discountForm.type === "percentage" ? "pr-8" : "pl-6"}
                    data-testid="input-discount-value"
                  />
                  {discountForm.type === "percentage" ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
                  ) : (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {discountForm.type === "percentage" 
                    ? "Entrez un pourcentage entre 0 et 100" 
                    : "Entrez le montant en dollars (ex: 5.00)"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Durée *</Label>
                <Select 
                  value={discountForm.durationMonths} 
                  onValueChange={(v) => setDiscountForm(f => ({ ...f, durationMonths: v }))}
                >
                  <SelectTrigger data-testid="select-discount-duration">
                    <SelectValue placeholder="Durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Indéfiniment</SelectItem>
                    <SelectItem value="1">1 mois</SelectItem>
                    <SelectItem value="2">2 mois</SelectItem>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="4">4 mois</SelectItem>
                    <SelectItem value="5">5 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="7">7 mois</SelectItem>
                    <SelectItem value="8">8 mois</SelectItem>
                    <SelectItem value="9">9 mois</SelectItem>
                    <SelectItem value="10">10 mois</SelectItem>
                    <SelectItem value="11">11 mois</SelectItem>
                    <SelectItem value="12">12 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Code promo (optionnel)</Label>
                <Input 
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="PROMO20"
                  data-testid="input-discount-code"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDiscount(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => createDiscountMutation.mutate(discountForm)}
              disabled={createDiscountMutation.isPending || !discountForm.name || !discountForm.value}
              data-testid="button-confirm-create-discount"
            >
              {createDiscountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
