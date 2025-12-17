import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  Search,
  Eye,
  MoreHorizontal,
  FileText,
  Mail,
  LayoutGrid,
  List,
  Download,
  GripVertical
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

interface OrderItem {
  productType: string;
  quantity: number;
  bookId: string;
  bookName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  bookId: string;
  productType: string;
  quantity: number;
  status: string;
  totalAmount: number;
  pageCount: number;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  orderItems?: OrderItem[];
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
  pending_payment: "bg-yellow-100 text-yellow-700 border-yellow-300",
  paid: "bg-green-100 text-green-700 border-green-300",
  processing: "bg-blue-100 text-blue-700 border-blue-300",
  shipped: "bg-purple-100 text-purple-700 border-purple-300",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-300",
  cancelled: "bg-stone-100 text-stone-600 border-stone-300",
  refunded: "bg-red-100 text-red-700 border-red-300",
};

const kanbanColumns = [
  { id: "pending_payment", title: "En attente", color: "border-t-yellow-500" },
  { id: "paid", title: "Payé", color: "border-t-green-500" },
  { id: "processing", title: "En traitement", color: "border-t-blue-500" },
  { id: "shipped", title: "Expédié", color: "border-t-purple-500" },
  { id: "delivered", title: "Livré", color: "border-t-emerald-500" },
];

const productLabels: Record<string, string> = {
  softcover: "Couverture souple",
  hardcover: "Couverture rigide",
  ebook: "E-Book",
};

type ViewMode = "table" | "kanban";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
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

  const generatePdfMutation = useMutation({
    mutationFn: async ({ orderId, sendEmail }: { orderId: string; sendEmail: boolean }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sendEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur génération PDF");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdf-exports"] });
      if (data.emailSent) {
        toast({ title: "PDF généré et envoyé par email au client" });
      } else {
        toast({ title: "PDF généré avec succès" });
      }
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
      order.id.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query)
    );
  });

  const getNextStatuses = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      pending_payment: ["paid", "cancelled"],
      paid: ["processing", "refunded"],
      processing: ["shipped", "refunded"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
      refunded: [],
    };
    return transitions[currentStatus] || [];
  };

  const exportToCSV = () => {
    if (!orders || orders.length === 0) {
      toast({ title: "Aucune donnée à exporter", variant: "destructive" });
      return;
    }

    const headers = ["Numéro", "Client", "Email", "Format", "Pages", "Total (CAD)", "Statut", "Date"];
    const rows = orders.map(order => [
      order.orderNumber,
      order.customerName || "-",
      order.customerEmail || "-",
      productLabels[order.productType] || order.productType,
      order.pageCount.toString(),
      (order.totalAmount / 100).toFixed(2),
      statusLabels[order.status] || order.status,
      new Date(order.createdAt).toLocaleDateString("fr-CA")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `commandes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    toast({ title: "Export CSV téléchargé" });
  };

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedOrder && draggedOrder.status !== targetStatus) {
      const allowedTransitions = getNextStatuses(draggedOrder.status);
      if (allowedTransitions.includes(targetStatus)) {
        updateStatusMutation.mutate({ orderId: draggedOrder.id, status: targetStatus });
      } else {
        toast({ 
          title: "Transition non autorisée", 
          description: `Impossible de passer de "${statusLabels[draggedOrder.status]}" à "${statusLabels[targetStatus]}"`,
          variant: "destructive" 
        });
      }
    }
    setDraggedOrder(null);
  };

  const getOrdersByStatus = (status: string) => {
    return filteredOrders?.filter(order => order.status === status) || [];
  };

  return (
    <AdminLayout title="Gestion des commandes">
      <div className="space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input
              placeholder="Rechercher par numéro, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-orders"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              data-testid="button-view-table"
            >
              <List size={16} />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              data-testid="button-view-kanban"
            >
              <LayoutGrid size={16} />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={exportToCSV} data-testid="button-export-csv">
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : viewMode === "kanban" ? (
          <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
            {kanbanColumns.map((column) => (
              <div
                key={column.id}
                className={`bg-stone-50 rounded-xl border border-stone-200 border-t-4 ${column.color} min-h-[400px] flex flex-col`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                data-testid={`kanban-column-${column.id}`}
              >
                <div className="p-3 border-b border-stone-200 flex items-center justify-between">
                  <h3 className="font-medium text-sm text-stone-700">{column.title}</h3>
                  <span className="bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded-full">
                    {getOrdersByStatus(column.id).length}
                  </span>
                </div>
                <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                  {getOrdersByStatus(column.id).map((order) => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order)}
                      className="bg-white rounded-lg border border-stone-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      data-testid={`kanban-card-${order.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-medium text-stone-900 truncate">
                            {order.orderNumber}
                          </p>
                          {order.customerName && (
                            <p className="text-xs text-stone-500 truncate mt-1">
                              {order.customerName}
                            </p>
                          )}
                        </div>
                        <GripVertical size={14} className="text-stone-400 flex-shrink-0" />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-stone-500">
                          {productLabels[order.productType]?.split(" ")[0] || order.productType}
                        </span>
                        <span className="font-medium text-stone-700">
                          {(order.totalAmount / 100).toFixed(2)}$
                        </span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                              <Eye size={14} className="mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => generatePdfMutation.mutate({ orderId: order.id, sendEmail: false })}
                              disabled={generatePdfMutation.isPending}
                            >
                              <FileText size={14} className="mr-2" />
                              Générer PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {getOrdersByStatus(column.id).length === 0 && (
                    <p className="text-center text-stone-400 text-xs py-8">
                      Aucune commande
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Commande</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Client</th>
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
                      <tr key={order.id} className="hover:bg-stone-50" data-testid={`row-order-${order.id}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="font-medium text-stone-900">{order.customerName || "-"}</p>
                            <p className="text-stone-500 text-xs">{order.customerEmail || "-"}</p>
                          </div>
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
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${order.id}`}>
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                <Eye size={14} className="mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              {order.productType === "ebook" && order.status === "paid" && (
                                <DropdownMenuItem 
                                  onClick={() => generatePdfMutation.mutate({ orderId: order.id, sendEmail: true })}
                                  disabled={generatePdfMutation.isPending}
                                >
                                  <Mail size={14} className="mr-2" />
                                  Générer PDF et envoyer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => generatePdfMutation.mutate({ orderId: order.id, sendEmail: false })}
                                disabled={generatePdfMutation.isPending}
                              >
                                <FileText size={14} className="mr-2" />
                                Générer PDF (sans email)
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
                      <td colSpan={8} className="px-4 py-8 text-center text-stone-500">
                        Aucune commande trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  <span className="text-stone-500">Client:</span>
                  <p>{selectedOrder.customerName || "-"}</p>
                </div>
                <div>
                  <span className="text-stone-500">Email:</span>
                  <p className="text-xs">{selectedOrder.customerEmail || "-"}</p>
                </div>
                <div>
                  <span className="text-stone-500">Format:</span>
                  <p>{productLabels[selectedOrder.productType]} × {selectedOrder.quantity || 1}</p>
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
              
              {/* Order Items Detail */}
              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div className="pt-4 border-t border-stone-200">
                  <h4 className="text-sm font-medium text-stone-700 mb-2">Articles commandés</h4>
                  <div className="space-y-2">
                    {(selectedOrder.orderItems as OrderItem[]).map((item, index) => (
                      <div key={index} className="bg-stone-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{productLabels[item.productType] || item.productType}</p>
                          <p className="text-xs text-stone-500">{item.bookName}</p>
                        </div>
                        <span className="font-bold text-primary">× {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
