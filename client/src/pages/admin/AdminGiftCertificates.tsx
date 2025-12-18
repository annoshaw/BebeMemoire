import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  Search,
  Gift,
  Mail,
  MoreHorizontal,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";

interface GiftCertificate {
  id: string;
  code: string;
  purchaserEmail: string;
  purchaserName: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  productType: string;
  includesSubscription: boolean | null;
  subscriptionType: string | null;
  amount: number;
  status: string;
  emailSentAt: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface GiftCertificateStats {
  total: number;
  pending: number;
  paid: number;
  redeemed: number;
  totalRevenue: number;
}

interface GiftCertificatesData {
  certificates: GiftCertificate[];
  stats: GiftCertificateStats;
}

export default function AdminGiftCertificates() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<GiftCertificatesData>({
    queryKey: ["/api/admin/gift-certificates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/gift-certificates", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement certificats-cadeaux");
      return res.json();
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/gift-certificates/${id}/resend-email`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur envoi email");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-certificates"] });
      toast({ title: "Email envoyé", description: "Le certificat-cadeau a été renvoyé par email." });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copié", description: "Le code a été copié dans le presse-papiers." });
  };

  const certificates = data?.certificates || [];
  const stats = data?.stats;

  const filteredCertificates = certificates.filter((cert) => {
    const query = searchQuery.toLowerCase();
    return (
      cert.code.toLowerCase().includes(query) ||
      cert.purchaserEmail.toLowerCase().includes(query) ||
      cert.recipientEmail?.toLowerCase().includes(query) ||
      cert.purchaserName?.toLowerCase().includes(query) ||
      cert.recipientName?.toLowerCase().includes(query)
    );
  });

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    paid: "Payé",
    sent: "Envoyé",
    redeemed: "Utilisé",
    expired: "Expiré",
    refunded: "Remboursé",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    sent: "bg-blue-100 text-blue-700",
    redeemed: "bg-purple-100 text-purple-700",
    expired: "bg-stone-100 text-stone-600",
    refunded: "bg-red-100 text-red-700",
  };

  const productLabels: Record<string, string> = {
    softcover: "Couverture Souple",
    hardcover: "Couverture Rigide",
    ebook: "E-Book",
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString("fr-CA", {
      style: "currency",
      currency: "CAD",
    });
  };

  return (
    <AdminLayout title="Certificats-cadeaux">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  En attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Utilisés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">{stats?.redeemed || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Revenus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(stats?.totalRevenue || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-semibold text-stone-800">Liste des certificats-cadeaux</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-certificates"
                />
              </div>
            </div>

            {filteredCertificates.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                <Gift className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p>Aucun certificat-cadeau trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Code</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Acheteur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Destinataire</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Produit</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Montant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCertificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-stone-50" data-testid={`row-certificate-${cert.id}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-stone-100 px-2 py-1 rounded">
                              {cert.code}
                            </code>
                            <button
                              onClick={() => copyCode(cert.code)}
                              className="text-stone-400 hover:text-stone-600"
                              title="Copier le code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{cert.purchaserName || "-"}</p>
                            <p className="text-xs text-stone-500">{cert.purchaserEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{cert.recipientName || "-"}</p>
                            <p className="text-xs text-stone-500">{cert.recipientEmail || cert.purchaserEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-stone-800">
                              {productLabels[cert.productType] || cert.productType}
                            </p>
                            {cert.includesSubscription && (
                              <p className="text-xs text-blue-600">
                                + {cert.subscriptionType === "platine" ? "Platine" : "Premium"}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-stone-800">
                            {formatAmount(cert.amount)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[cert.status] || "bg-stone-100 text-stone-600"}`}>
                            {statusLabels[cert.status] || cert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-stone-600">{formatDate(cert.createdAt)}</p>
                          {cert.redeemedAt && (
                            <p className="text-xs text-purple-600">
                              Utilisé: {formatDate(cert.redeemedAt)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${cert.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => resendEmailMutation.mutate(cert.id)}
                                disabled={!["paid", "sent"].includes(cert.status)}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Renvoyer l'email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyCode(cert.code)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copier le code
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
