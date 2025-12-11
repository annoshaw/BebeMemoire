import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "./AdminLayout";

interface PdfExport {
  id: string;
  bookId: string;
  orderId: string | null;
  status: string;
  s3Key: string | null;
  fileSize: number | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "En cours", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  completed: { label: "Terminé", color: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { label: "Échec", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminExports() {
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AdminLayout title="Exports PDF">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : exports && exports.length > 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Livre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Commande</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Statut</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Taille</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Créé</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {exports.map((exp) => {
                  const config = statusConfig[exp.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{exp.id.slice(0, 8)}...</span>
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
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon size={12} className={exp.status === "processing" ? "animate-spin" : ""} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatFileSize(exp.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">
                        {new Date(exp.createdAt).toLocaleString("fr-CA")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {exp.status === "completed" && exp.s3Key && (
                          <Button variant="ghost" size="sm">
                            <Download size={14} className="mr-1" />
                            Télécharger
                          </Button>
                        )}
                        {exp.error && (
                          <span className="text-xs text-red-600" title={exp.error}>
                            Erreur
                          </span>
                        )}
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
            <h3 className="text-lg font-medium text-stone-800 mb-2">Aucun export PDF</h3>
            <p className="text-stone-500">
              Les exports PDF apparaîtront ici lorsque des commandes seront traitées.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
