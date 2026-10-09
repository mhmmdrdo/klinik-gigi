"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Pencil, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormField } from "@/components/form-field";
import { ActiveBadge, PageHeader } from "@/components/page-parts";
import { SimpleSelect } from "@/components/simple-select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { ApiError, userService } from "@/lib/services";
import { userSchema } from "@/lib/validators/schemas";
import { ROLE_LABEL } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import type { Profile, Role } from "@/types";

const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as Role[]).map((value) => ({
  value,
  label: ROLE_LABEL[value],
}));

export function UsersView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Profile | null>(null);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const query = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.list(),
  });

  async function confirmToggle() {
    if (!user || !toggleTarget) return;
    setIsToggling(true);
    try {
      await userService.setActive(toggleTarget.id, !toggleTarget.isActive, user);
      toast.success(toggleTarget.isActive ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setToggleTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal mengubah status pengguna.",
      );
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengguna"
        description="Kelola akun admin/perawat dan dokter."
        icon={ShieldCheck}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            Tambah Pengguna
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {query.isPending ? (
          <TableSkeleton rows={4} columns={5} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.data && query.data.length === 0 ? (
          <EmptyState title="Belum ada pengguna" />
        ) : query.data ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="pl-4 font-medium">{profile.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                  <TableCell>{ROLE_LABEL[profile.role]}</TableCell>
                  <TableCell>
                    <ActiveBadge isActive={profile.isActive} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setEditing(profile);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil />
                        Edit
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setResetTarget(profile)}>
                        <KeyRound />
                        Reset Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={profile.isActive ? "text-destructive" : undefined}
                        onClick={() => setToggleTarget(profile)}
                      >
                        {profile.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={editing}
        onSaved={() => {
          setDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["doctors"] });
        }}
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null);
        }}
        title={toggleTarget?.isActive ? "Nonaktifkan pengguna ini?" : "Aktifkan pengguna ini?"}
        description={
          <>
            {toggleTarget?.isActive
              ? "Pengguna tidak akan bisa login sampai diaktifkan kembali."
              : "Pengguna akan bisa login kembali."}{" "}
            (<strong>{toggleTarget?.fullName}</strong>)
          </>
        }
        confirmLabel={toggleTarget?.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        destructive={Boolean(toggleTarget?.isActive)}
        loading={isToggling}
        onConfirm={confirmToggle}
      />

      <ConfirmDialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
        title="Reset password pengguna ini?"
        description={
          <>
            Link reset password akan dikirim ke <strong>{resetTarget?.email}</strong> setelah
            backend siap. Pada mode demo, semua akun tetap memakai password{" "}
            <span className="font-mono">password123</span>.
          </>
        }
        confirmLabel="Ya, Reset"
        onConfirm={() => {
          toast.info("Fitur reset password aktif setelah backend siap.");
          setResetTarget(null);
        }}
      />
    </div>
  );
}

function UserDialog({
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("doctor");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(profile?.fullName ?? "");
      setEmail(profile?.email ?? "");
      setRole(profile?.role ?? "doctor");
      setPhone(profile?.phone ?? "");
      setIsActive(profile?.isActive ?? true);
      setErrors({});
    }
  }, [open, profile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setErrors({});

    const parsed = userSchema.safeParse({
      fullName,
      email,
      role,
      phone: phone.trim(),
      isActive,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;
      setErrors(
        Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (profile) {
        await userService.update(profile.id, parsed.data, user);
      } else {
        await userService.create(parsed.data, user);
      }
      toast.success(profile ? "Pengguna diperbarui" : "Pengguna berhasil ditambahkan");
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menyimpan pengguna. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{profile ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
            <DialogDescription>
              Pada mode demo, semua akun masuk dengan password{" "}
              <span className="font-mono">password123</span>.
            </DialogDescription>
          </DialogHeader>

          <FormField label="Nama Lengkap" htmlFor="usr-name" error={errors.fullName} required>
            <Input id="usr-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </FormField>
          <FormField label="Email" htmlFor="usr-email" error={errors.email} required>
            <Input
              id="usr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Role" required>
              <SimpleSelect
                value={role}
                onChange={(value) => setRole(value as Role)}
                options={ROLE_OPTIONS}
                className="w-full"
                ariaLabel="Role"
              />
            </FormField>
            <FormField label="No. HP" htmlFor="usr-phone">
              <Input id="usr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </FormField>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <label htmlFor="usr-active" className="text-sm font-medium">
              Status Aktif
            </label>
            <Switch
              id="usr-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengguna"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}