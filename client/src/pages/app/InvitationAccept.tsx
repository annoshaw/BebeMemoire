import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Clock, Users, Edit2, Loader2, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface AuthUser {
  id?: string;
  email?: string;
  fullName?: string;
}

export default function InvitationAccept() {
  const [, params] = useRoute("/app/invitation/:token");
  const [, setLocation] = useLocation();
  const { user: rawUser, isLoading: authLoading } = useAuth();
  const user = rawUser as AuthUser | null;
  
  const token = params?.token;
  
  const [invitation, setInvitation] = useState<{
    id: string;
    email: string;
    role: string;
    bookName: string;
    inviterName: string;
    expiresAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptedBookId, setAcceptedBookId] = useState<string | null>(null);
  
  // Fetch invitation details
  useEffect(() => {
    if (!token) return;
    
    const fetchInvitation = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();
        
        if (res.ok) {
          setInvitation(data);
        } else {
          setError(data.message || "Invitation invalide");
        }
      } catch (err) {
        setError("Erreur de connexion. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvitation();
  }, [token]);
  
  const handleAccept = async () => {
    if (!token || !user) return;
    
    setIsAccepting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAccepted(true);
        setAcceptedBookId(data.bookId);
      } else {
        setError(data.message || "Erreur lors de l'acceptation");
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsAccepting(false);
    }
  };
  
  // Show loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-stone-500">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">Invitation invalide</h1>
          <p className="text-stone-500 mb-6">{error}</p>
          <Link href="/">
            <Button className="w-full">Retour à l'accueil</Button>
          </Link>
        </motion.div>
      </div>
    );
  }
  
  // Show accepted state
  if (accepted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">Invitation acceptée!</h1>
          <p className="text-stone-500 mb-6">
            Vous avez maintenant accès au livre "{invitation?.bookName}". 
            Vous pouvez le retrouver dans votre liste de livres partagés.
          </p>
          <Button 
            className="w-full"
            onClick={() => setLocation("/app")}
            data-testid="button-go-to-app"
          >
            <BookOpen size={16} className="mr-2" />
            Accéder à l'application
          </Button>
        </motion.div>
      </div>
    );
  }
  
  // Check if user needs to log in
  if (!user && invitation) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-2">Invitation au livre</h1>
            <p className="text-stone-500">
              <span className="font-medium text-stone-700">{invitation.inviterName}</span> vous invite à rejoindre le livre "{invitation.bookName}"
            </p>
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Connexion requise</p>
                <p className="text-xs text-amber-700">
                  Connectez-vous avec l'adresse <span className="font-medium">{invitation.email}</span> pour accepter cette invitation.
                </p>
              </div>
            </div>
          </div>
          
          <Link href="/login">
            <Button className="w-full" data-testid="button-login-to-accept">
              Se connecter
            </Button>
          </Link>
          
          <p className="text-center text-xs text-stone-400 mt-4">
            Pas encore de compte ? L'inscription est gratuite.
          </p>
        </motion.div>
      </div>
    );
  }
  
  // Show invitation details
  if (invitation && user) {
    const isEmailMatch = user.email?.toLowerCase() === invitation.email.toLowerCase();
    
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {invitation.role === "collaborator" ? (
                <Edit2 size={32} className="text-primary" />
              ) : (
                <Users size={32} className="text-primary" />
              )}
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-2">Invitation au livre</h1>
            <p className="text-stone-500">
              <span className="font-medium text-stone-700">{invitation.inviterName}</span> vous invite à accéder au livre
            </p>
          </div>
          
          {/* Book Info */}
          <div className="p-4 bg-stone-50 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-stone-800">{invitation.bookName}</p>
                <p className="text-xs text-stone-500">
                  Rôle: {invitation.role === "collaborator" ? "Collaborateur" : "Observateur"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Role Description */}
          <div className="p-4 bg-primary/5 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              {invitation.role === "collaborator" ? (
                <>
                  <Edit2 size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-stone-800">Collaborateur</p>
                    <p className="text-xs text-stone-600">
                      Vous pourrez modifier le livre, ajouter des photos et des souvenirs, et passer des commandes.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Users size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-stone-800">Observateur</p>
                    <p className="text-xs text-stone-600">
                      Vous pourrez consulter le livre et voir les souvenirs, mais pas le modifier.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Email mismatch warning */}
          {!isEmailMatch && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Email différent</p>
                  <p className="text-xs text-amber-700">
                    Cette invitation a été envoyée à <span className="font-medium">{invitation.email}</span>. 
                    Vous êtes connecté avec <span className="font-medium">{user.email}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <Button 
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting || !isEmailMatch}
            data-testid="button-accept-invitation"
          >
            {isAccepting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Acceptation...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                Accepter l'invitation
              </>
            )}
          </Button>
          
          <Link href="/">
            <Button variant="ghost" className="w-full mt-2">
              Annuler
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }
  
  return null;
}
