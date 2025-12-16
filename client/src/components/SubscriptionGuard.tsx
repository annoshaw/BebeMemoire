import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600" />
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const typedUser = user as {
    requiresSubscription?: boolean;
    trialExpired?: boolean;
    trialDaysLeft?: number;
    role?: string;
  };

  if (typedUser.requiresSubscription) {
    navigate("/subscription");
    return null;
  }

  return <>{children}</>;
}
