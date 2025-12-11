import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Mail, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EmailCampaign {
  id: string;
  subject: string;
  bodyHtml: string;
  audienceFilter: string;
  status: string;
  recipientCount: number;
  sentCount: number | null;
  failedCount: number | null;
  sentAt: string | null;
  createdAt: string;
}

export default function AdminEmails() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");

  const { data: campaigns = [], isLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/admin/emails"],
    queryFn: async () => {
      const res = await fetch("/api/admin/emails", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
  });

  const { data: previewCount } = useQuery({
    queryKey: ["/api/admin/emails/preview-count", audienceFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/emails/preview-count?filter=${audienceFilter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, bodyHtml, audienceFilter }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Succès", description: data.message });
      setSubject("");
      setBodyHtml("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/emails"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case "all": return "Tous les utilisateurs";
      case "premium": return "Premium";
      case "platine": return "Platine";
      default: return filter;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 size={12} className="mr-1" /> Envoyé</Badge>;
      case "sending":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock size={12} className="mr-1" /> En cours</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700"><XCircle size={12} className="mr-1" /> Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Courriels">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send size={20} />
              Nouvelle campagne
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audience">Destinataires</Label>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger data-testid="select-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="premium">Abonnés Premium</SelectItem>
                  <SelectItem value="platine">Abonnés Platine</SelectItem>
                </SelectContent>
              </Select>
              {previewCount && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users size={14} /> {previewCount.count} destinataire{previewCount.count > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                data-testid="input-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet du courriel..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Contenu (HTML)</Label>
              <Textarea
                id="body"
                data-testid="input-body"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="<p>Votre message ici...</p>"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Le contenu sera intégré dans le template Memoria avec l'en-tête et le pied de page.
              </p>
            </div>

            <Button
              data-testid="button-send-campaign"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || !subject || !bodyHtml}
              className="w-full"
            >
              {sendMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Envoi en cours...</>
              ) : (
                <><Send size={16} className="mr-2" /> Envoyer la campagne</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={20} />
              Historique des campagnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune campagne envoyée
              </p>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    data-testid={`campaign-${campaign.id}`}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getFilterLabel(campaign.audienceFilter)} • {campaign.recipientCount} destinataire{campaign.recipientCount > 1 ? "s" : ""}
                        </p>
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {campaign.sentAt && (
                        <span>Envoyé le {format(new Date(campaign.sentAt), "d MMM yyyy HH:mm", { locale: fr })}</span>
                      )}
                      {campaign.sentCount !== null && (
                        <span className="text-green-600">{campaign.sentCount} succès</span>
                      )}
                      {campaign.failedCount !== null && campaign.failedCount > 0 && (
                        <span className="text-red-600">{campaign.failedCount} échec{campaign.failedCount > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
