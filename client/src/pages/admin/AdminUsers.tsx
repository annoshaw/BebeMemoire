import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  Search,
  Shield,
  User,
  MoreHorizontal,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";

interface UserData {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; user: UserData | null }>({ open: false, user: null });
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement utilisateurs");
      return res.json();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur mise à jour");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Rôle mis à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur réinitialisation");
      }
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordDialog({ open: false, user: null });
      setNewPassword("");
      toast({ title: "Mot de passe réinitialisé", description: "L'utilisateur peut maintenant se connecter avec le nouveau mot de passe." });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.fullName?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );
  });

  const getDisplayName = (user: UserData) => {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.email || "Utilisateur";
  };

  return (
    <AdminLayout title="Gestion des utilisateurs">
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Rôle</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Onboarding</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-stone-600">Inscription</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.role === "admin" ? (
                              <Shield size={14} className="text-primary" />
                            ) : (
                              <User size={14} className="text-stone-500" />
                            )}
                          </div>
                          <span className="font-medium">{getDisplayName(user)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">{user.email || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin" 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-stone-100 text-stone-600"
                        }`}>
                          {user.role === "admin" ? "Admin" : "Utilisateur"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.onboardingCompleted 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {user.onboardingCompleted ? "Complété" : "En cours"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500">
                        {new Date(user.createdAt).toLocaleDateString("fr-CA")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.role === "admin" ? (
                              <DropdownMenuItem 
                                onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "user" })}
                              >
                                Retirer admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "admin" })}
                              >
                                Promouvoir admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => {
                                setNewPassword("");
                                setResetPasswordDialog({ open: true, user });
                              }}
                              data-testid={`reset-password-${user.id}`}
                            >
                              <KeyRound size={14} className="mr-2" />
                              Réinitialiser mot de passe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ open, user: open ? resetPasswordDialog.user : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
              <DialogDescription>
                Définissez un nouveau mot de passe pour {resetPasswordDialog.user?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  data-testid="input-new-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPasswordDialog({ open: false, user: null })}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (resetPasswordDialog.user) {
                    resetPasswordMutation.mutate({ userId: resetPasswordDialog.user.id, newPassword });
                  }
                }}
                disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                data-testid="button-confirm-reset"
              >
                {resetPasswordMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Réinitialiser
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
