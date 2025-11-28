import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsVerifying(false);
        setIsValidToken(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();
        setIsValidToken(data.valid);
      } catch (error) {
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }

      setIsSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-stone-600">Vérification du lien...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Link href="/">
              <span className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full text-white font-sans text-xl font-bold mb-4 cursor-pointer">M</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-stone-100">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
                Lien invalide
              </h2>
              <p className="text-stone-600 mb-6">
                Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
              </p>

              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full" data-testid="button-request-new">
                    Demander un nouveau lien
                  </Button>
                </Link>
                <Link href="/login">
                  <span className="text-sm text-stone-500 hover:text-stone-900 flex items-center justify-center gap-1 cursor-pointer">
                    <ArrowLeft size={14} />
                    Retour à la connexion
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Link href="/">
              <span className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full text-white font-sans text-xl font-bold mb-4 cursor-pointer">M</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-stone-100">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
                Mot de passe modifié
              </h2>
              <p className="text-stone-600 mb-6">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>

              <Link href="/login">
                <Button className="w-full" data-testid="button-go-to-login">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <span className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full text-white font-sans text-xl font-bold mb-4 cursor-pointer">M</span>
          </Link>
          <h2 className="text-3xl font-serif font-bold text-stone-900">
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Créez un nouveau mot de passe pour votre compte
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-stone-100">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Choisissez un mot de passe fort avec au moins 8 caractères.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="••••••••" 
                          type={showPassword ? "text" : "password"} 
                          {...field} 
                          data-testid="input-password" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="••••••••" 
                          type={showConfirmPassword ? "text" : "password"} 
                          {...field} 
                          data-testid="input-confirm-password" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-6 rounded-lg text-lg"
                disabled={isLoading}
                data-testid="button-submit-reset"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  "Réinitialiser le mot de passe"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <span className="text-sm text-stone-500 hover:text-stone-900 flex items-center justify-center gap-1 cursor-pointer">
                <ArrowLeft size={14} />
                Retour à la connexion
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
