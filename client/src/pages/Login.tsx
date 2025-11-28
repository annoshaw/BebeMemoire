import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Facebook } from "lucide-react";
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
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Email ou mot de passe incorrect");
      }

      localStorage.setItem("userName", data.user.fullName || "");
      localStorage.setItem("userEmail", data.user.email || "");

      setLocation("/app");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <span className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full text-white font-sans text-xl font-bold mb-4 cursor-pointer">M</span>
          </Link>
          <h2 className="text-3xl font-serif font-bold text-stone-900">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Retrouvez vos souvenirs précieux
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-stone-100">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2" 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-google-login"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <div className="relative">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 opacity-50 cursor-not-allowed" 
                disabled
                data-testid="button-facebook-login"
              >
                <Facebook className="w-5 h-5 text-blue-600 fill-current" />
                Facebook
              </Button>
              <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                Bientôt
              </span>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-stone-500">Ou connectez-vous avec</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse courriel</FormLabel>
                    <FormControl>
                      <Input placeholder="jean@exemple.com" type="email" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-6 rounded-lg text-lg"
                disabled={isLoading}
                data-testid="button-submit-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-stone-600">
              Vous n'avez pas de compte?{" "}
              <Link href="/register">
                <a className="text-primary font-medium hover:underline" data-testid="link-register">
                  Créer un compte
                </a>
              </Link>
            </p>
            <Link href="/">
              <a className="text-sm text-stone-500 hover:text-stone-900 flex items-center justify-center gap-1">
                <ArrowLeft size={14} />
                Retour à l'accueil
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
