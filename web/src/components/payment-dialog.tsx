"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/currency-input";
import { DateInput } from "@/components/date-picker";
import { FormField } from "@/components/form-field";
import { SimpleSelect } from "@/components/simple-select";
import { ApiError, paymentService } from "@/lib/services";
import { paymentSchema } from "@/lib/validators/schemas";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { formatRupiah, toDateInputValue } from "@/lib/format";
import { dateToIsoWithNow } from "@/lib/datetime";
import { useAuth } from "@/providers/auth-provider";
import type { PaymentMethod } from "@/types";

export function PaymentDialog({
  open,
  onOpenChange,
  visitId,
  visitNumber,
  patientName,
  outstanding,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
  visitNumber: string;
  patientName: string;
  outstanding: number;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(outstanding);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(outstanding);
      setMethod("cash");
      setDate(toDateInputValue(new Date()));
      setNotes("");
      setStep("form");
      setError(null);
    }
  }, [open, outstanding]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("no session");
      return paymentService.create(
        {
          visitId,
          amount,
          paymentMethod: method,
          paymentDate: dateToIsoWithNow(date),
          notes: notes.trim() || null,
        },
        user,
      );
    },
    onSuccess: (payment) => {
      toast.success("Pembayaran tersimpan", {
        description: `${payment.paymentNumber} · ${formatRupiah(payment.amount)}`,
      });
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (err) => {
      setError(
        err instanceof ApiError ? err.message : "Gagal menyimpan pembayaran. Silakan coba lagi.",
      );
      setStep("form");
    },
  });

  function handleContinue() {
    setError(null);
    const parsed = paymentSchema.safeParse({
      visitId,
      amount,
      paymentMethod: method,
      paymentDate: dateToIsoWithNow(date),
      notes: notes.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data pembayaran tidak valid.");
      return;
    }
    if (amount > outstanding) {
      setError(`Jumlah bayar melebihi sisa tagihan (${formatRupiah(outstanding)}).`);
      return;
    }
    setStep("confirm");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Catat Pembayaran</DialogTitle>
              <DialogDescription>
                {patientName} · {visitNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Sisa tagihan</span>
                <span className="font-semibold tabular-nums">{formatRupiah(outstanding)}</span>
              </div>

              <FormField label="Jumlah Bayar" htmlFor="pay-amount" required>
                <CurrencyInput id="pay-amount" value={amount} onChange={setAmount} />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Metode" required>
                  <SimpleSelect
                    value={method}
                    onChange={(value) => setMethod(value as PaymentMethod)}
                    options={PAYMENT_METHOD_OPTIONS}
                    className="w-full"
                    ariaLabel="Metode pembayaran"
                  />
                </FormField>
                <FormField label="Tanggal Bayar" htmlFor="pay-date" required>
                  <DateInput id="pay-date" value={date} onChange={setDate} />
                </FormField>
              </div>

              <FormField label="Catatan" htmlFor="pay-notes">
                <Textarea
                  id="pay-notes"
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Opsional"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button onClick={handleContinue}>Lanjutkan</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Simpan pembayaran {formatRupiah(amount)}?</DialogTitle>
              <DialogDescription>
                Pembayaran akan dicatat untuk {patientName} ({visitNumber}). Pastikan jumlah dan
                metode sudah benar.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={mutation.isPending}
              >
                Batal
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? "Menyimpan..." : "Simpan Pembayaran"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}