"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { useAuth } from "@/providers/auth-provider";
import { loginSchema, type LoginInput } from "@/lib/validators/schemas";
import { APP_NAME, DEFAULT_CLINIC_NAME } from "@/lib/constants";
import { ApiError, DEMO_ACCOUNTS } from "@/lib/services";

const FEATURES = [
  "Data pasien & riwayat perawatan",
  "Kalkulasi biaya otomatis",
  "Status pembayaran & piutang",
  "Laporan pendapatan siap ekspor",
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [values, setValues] = useState<LoginInput>({
    email: "admin@klinik.id",
    password: "password123",
    remember: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(nextPath);
  }, [isLoading, isAuthenticated, router, nextPath]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Partial<
        Record<keyof LoginInput, string>
      >;
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(parsed.data);
      toast.success("Berhasil masuk");
      router.replace(nextPath);
    } catch (error) {
      // PRD section 62: never surface raw database errors to the user.
      setFormError(
        error instanceof ApiError ? error.message : "Gagal masuk. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Stethoscope className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{DEFAULT_CLINIC_NAME}</p>
            <p className="text-sm text-primary-foreground/70">Sistem Manajemen Klinik Gigi</p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            Digitalisasi buku besar klinik jadi satu sistem rapi.
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/80">
            Catat pasien, kunjungan, perawatan, biaya, dan pembayaran dalam satu alur yang
            mudah dari pasien datang sampai laporan bulanan siap baca.
          </p>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary-foreground/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          {APP_NAME} &middot; Versi 1.0
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 lg:hidden">
            <p className="text-sm font-medium text-muted-foreground">{DEFAULT_CLINIC_NAME}</p>
            <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
          </div>

          <div className="hidden space-y-1 lg:block">
            <h2 className="text-2xl font-semibold tracking-tight">Selamat Datang</h2>
            <p className="text-sm text-muted-foreground">
              Masuk untuk melanjutkan pencatatan klinik.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </div>
            ) : null}

            <FormField label="Email" htmlFor="email" error={errors.email} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@klinik.id"
                value={values.email}
                onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                aria-invalid={Boolean(errors.email) || undefined}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" error={errors.password} required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="password123"
                value={values.password}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, password: event.target.value }))
                }
                aria-invalid={Boolean(errors.password) || undefined}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  id="remember"
                  checked={values.remember}
                  onCheckedChange={(checked) =>
                    setValues((prev) => ({ ...prev, remember: Boolean(checked) }))
                  }
                />
                Ingat saya
              </label>
              <button
                type="button"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() =>
                  toast.info("Fitur lupa password akan hadir setelah backend siap.")
                }
              >
                Lupa password?
              </button>
            </div>

            <Button type="submit" className="h-9 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sedang masuk...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="space-y-2 rounded-xl bg-muted/60 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Akun demo (password: <span className="font-mono">password123</span>)
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setValues((prev) => ({
                      ...prev,
                      email: account.email,
                      password: account.password,
                    }));
                    setFormError(null);
                  }}
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}