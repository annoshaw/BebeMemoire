import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  Search,
  ChevronDown,
  Eye,
  MoreHorizontal
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  bookId: string;
  productType: string;
  status: string;
  totalAmount: number;
  pageCount: number;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending_payment: "En attente",
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

const productLabels: Record<string, string> = {
  softcover: "Couverture souple",
  hardcover: "Couverture rigide",
  ebook: "E-Book",
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders", statusFilter],
    queryFn: async () => {
      const url = statusFilter && statusFilter !== "all" 
        ? `/api/admin/orders?status=${statusFilter}` 
        : "/api/admin/orders";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement commandes");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur mise à jour");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query)
    );
  });

  const getNextStatuses = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      pending_payment: ["paid", "cancelled"],
      paid: ["processing", "refunded"],
      processing: ["shipped", "refunded"],
      shipped: ["delivered"],
    };
    return transitions[currentStatus] || [];
  };

  return (
    <AdminLayout title="Gestion des commandes">
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input
              placeholder="Rechercher par numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Commande</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Format</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Pages</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Total</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Date</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {productLabels[order.productType] || order.productType}
                      </td>
                      <td className="px-4 py-3 text-sm">{order.pageCount}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {(order.totalAmount / 100).toFixed(2)}$
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500">
                        {new Date(order.createdAt).toLocaleDateString("fr-CA")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                              <Eye size={14} className="mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {getNextStatuses(order.status).map((status) => (
                              <DropdownMenuItem 
                                key={status}
                                onClick={() => updateStatusMutation.mutate({ orderId: order.id, status })}
                              >
                                Marquer comme {statusLabels[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                      Aucune commande trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone-500">Numéro:</span>
                  <p className="font-mono font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <span className="text-stone-500">ID:</span>
                  <p className="font-mono text-xs">{selectedOrder.id}</p>
                </div>
                <div>
                  <span className="text-stone-500">Format:</span>
                  <p>{productLabels[selectedOrder.productType]}</p>
                </div>
                <div>
                  <span className="text-stone-500">Pages:</span>
                  <p>{selectedOrder.pageCount}</p>
                </div>
                <div>
                  <span className="text-stone-500">Total:</span>
                  <p className="font-medium">{(selectedOrder.totalAmount / 100).toFixed(2)}$ CAD</p>
                </div>
                <div>
                  <span className="text-stone-500">Statut:</span>
                  <p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                      {statusLabels[selectedOrder.status]}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">Date:</span>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString("fr-CA")}</p>
                </div>
                <div>
                  <span className="text-stone-500">ID Livre:</span>
                  <p className="font-mono text-xs">{selectedOrder.bookId}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
