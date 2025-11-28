import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
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
});

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }

      setIsSubmitted(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
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
                Vérifiez votre boîte mail
              </h2>
              <p className="text-stone-600 mb-6">
                Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.
              </p>

              {resetUrl && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-2 font-medium">Mode développement - Lien de réinitialisation:</p>
                  <Link href={resetUrl.replace(/^https?:\/\/[^/]+/, '')}>
                    <Button variant="outline" className="w-full text-xs break-all" data-testid="link-reset-dev">
                      Cliquez ici pour réinitialiser
                    </Button>
                  </Link>
                </div>
              )}

              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full" data-testid="button-back-to-login">
                    Retour à la connexion
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setResetUrl(null);
                    form.reset();
                  }}
                  className="text-sm text-stone-500 hover:text-stone-900"
                  data-testid="button-try-another"
                >
                  Essayer avec une autre adresse
                </button>
              </div>
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
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-stone-100">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Nous vous enverrons un email avec un lien sécurisé pour créer un nouveau mot de passe.
            </p>
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-6 rounded-lg text-lg"
                disabled={isLoading}
                data-testid="button-submit-forgot"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien"
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
