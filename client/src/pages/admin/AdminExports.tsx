import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, Download, Clock, CheckCircle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "./AdminLayout";
import { toast } from "sonner";

interface PdfExport {
  id: string;
  bookId: string;
  orderId: string | null;
  status: string;
  s3Key: string;
  filename: string;
  fileSize: number | null;
  pageCount: number | null;
  createdAt: string;
  generatedAt: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  generating: { label: "Génération...", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  completed: { label: "Prêt", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  downloaded: { label: "En cours", color: "bg-purple-100 text-purple-700", icon: Download },
  sent: { label: "Terminé", color: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { label: "Échec", color: "bg-red-100 text-red-700", icon: XCircle },
};

const statusOptions = [
  { value: "pending", label: "En attente" },
  { value: "generating", label: "Génération..." },
  { value: "completed", label: "Prêt" },
  { value: "downloaded", label: "En cours" },
  { value: "sent", label: "Terminé" },
  { value: "failed", label: "Échec" },
];

export default function AdminExports() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  
  const { data: exports, isLoading } = useQuery<PdfExport[]>({
    queryKey: ["/api/admin/pdf-exports"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pdf-exports", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Erreur chargement exports");
      }
      return res.json();
    },
  });

  const handleDownload = async (exportId: string, filename: string) => {
    try {
      setDownloading(exportId);
      const res = await fetch(`/api/admin/pdf-exports/${exportId}/download`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erreur inconnue" }));
        if (res.status === 404) {
          toast.error("Le fichier PDF n'existe plus. Une nouvelle génération est peut-être nécessaire.");
        } else if (res.status === 503) {
          toast.error("Service de stockage non disponible. Réessayez plus tard.");
        } else {
          toast.error(errorData.message || "Erreur lors du téléchargement");
        }
        return;
      }
      
      const data = await res.json();
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Téléchargement démarré");
      // Refresh to update status
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdf-exports"] });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur réseau lors du téléchargement");
    } finally {
      setDownloading(null);
    }
  };

  const handleSendEmail = async (exportId: string) => {
    try {
      setSendingEmail(exportId);
      const res = await fetch(`/api/admin/pdf-exports/${exportId}/send-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.message || "Erreur lors de l'envoi de l'email");
        return;
      }
      
      toast.success("Email envoyé au client avec le lien de téléchargement");
      // Refresh to update status
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdf-exports"] });
    } catch (error) {
      console.error("Send email error:", error);
      toast.error("Erreur réseau lors de l'envoi de l'email");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleStatusChange = async (exportId: string, newStatus: string) => {
    try {
      setUpdatingStatus(exportId);
      const res = await fetch(`/api/admin/pdf-exports/${exportId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Erreur lors de la mise à jour du statut");
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdf-exports"] });
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Erreur réseau lors de la mise à jour");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter exports by status
  const filteredExports = exports?.filter(exp => 
    statusFilter === "all" || exp.status === statusFilter
  ) || [];

  const exportToCSV = () => {
    const dataToExport = filteredExports;
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = ["ID", "Client", "Email", "Livre ID", "Commande ID", "Statut", "Taille", "Créé"];
    const rows = dataToExport.map(exp => [
      exp.id.slice(0, 8),
      exp.customerName || "-",
      exp.customerEmail || "-",
      exp.bookId.slice(0, 8),
      exp.orderId?.slice(0, 8) || "-",
      statusConfig[exp.status]?.label || exp.status,
      formatFileSize(exp.fileSize),
      new Date(exp.createdAt).toLocaleString("fr-CA")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `exports_pdf_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    toast.success("Export CSV téléchargé");
  };

  return (
    <AdminLayout title="Exports PDF">
      <div className="space-y-4">
        {/* Status Filter */}
        <div className="flex items-center gap-4 flex-wrap bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-sm font-medium text-stone-600">Filtrer par statut :</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusFilter !== "all" && (
            <span className="text-sm text-stone-500">
              {filteredExports.length} résultat{filteredExports.length > 1 ? "s" : ""}
            </span>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={exportToCSV} data-testid="button-export-pdf-csv">
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredExports && filteredExports.length > 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Client</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Livre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Commande</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Taille</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Créé</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredExports.map((exp) => {
                  const config = statusConfig[exp.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{exp.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-stone-800">{exp.customerName || "-"}</span>
                          {exp.customerEmail && (
                            <span className="text-xs text-stone-500">{exp.customerEmail}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{exp.bookId.slice(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        {exp.orderId ? (
                          <span className="font-mono text-xs">{exp.orderId.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={exp.status}
                          onValueChange={(value) => handleStatusChange(exp.id, value)}
                          disabled={updatingStatus === exp.id}
                        >
                          <SelectTrigger className={`w-32 h-8 text-xs ${config.color} border-0`}>
                            <SelectValue>
                              <span className="flex items-center gap-1.5">
                                <StatusIcon size={12} className={exp.status === "generating" ? "animate-spin" : ""} />
                                {config.label}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatFileSize(exp.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">
                        {new Date(exp.createdAt).toLocaleString("fr-CA")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {["completed", "downloaded", "sent"].includes(exp.status) && exp.s3Key && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownload(exp.id, exp.filename)}
                                disabled={downloading === exp.id}
                                title="Télécharger le PDF"
                              >
                                {downloading === exp.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Download size={14} />
                                )}
                              </Button>
                              {exp.status !== "sent" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleSendEmail(exp.id)}
                                  disabled={sendingEmail === exp.id}
                                  title="Envoyer par email au client"
                                >
                                  {sendingEmail === exp.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Mail size={14} />
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                          {exp.errorMessage && (
                            <span className="text-xs text-red-600" title={exp.errorMessage}>
                              Erreur
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              {statusFilter !== "all" ? "Aucun résultat pour ce filtre" : "Aucun export PDF"}
            </h3>
            <p className="text-stone-500">
              {statusFilter !== "all" 
                ? "Essayez de modifier votre filtre ou sélectionnez 'Tous les statuts'."
                : "Les exports PDF apparaîtront ici lorsque des commandes seront traitées."}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
