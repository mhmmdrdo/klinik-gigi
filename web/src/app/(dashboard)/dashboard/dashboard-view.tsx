"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarCheck,
  CreditCard,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "cn";
import { ButtonLink } from "@/components/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/stat-card";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/states";
import { PageHeader, VisitStatusBadge } from "@/components/page-parts";
import { StatusBadge } from "@/components/badge-tone";
import {
  getDashboard,
  REVENUE_RANGE_LABEL,
  type RevenueRange,
} from "@/lib/queries/dashboard";
import {
  formatLongDate,
  formatNumber,
  formatRupiah,
  formatRupiahShort,
  formatTime,
  greeting,
} from "@/lib/format";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import type { AppointmentStatus } from "@/types";

const CHART_COLORS = [
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-5)",
];

export function DashboardView() {
  const { user, can } = useAuth();
  const [range, setRange] = useState<RevenueRange>("7d");

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", range],
    queryFn: () => getDashboard(range),
  });

  const data = dashboardQuery.data;
  const today = new Date();

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={`${greeting(today)}, ${user?.fullName ?? "Admin"}`}
        description={formatLongDate(today)}
        actions={
          <>
            {/* FIX: dokter tidak punya izin patient:create / visit:create */}
            {can("patient:create") ? (
              <ButtonLink href="/patients/new" variant="outline">
                <UserPlus />
                Tambah Pasien
              </ButtonLink>
            ) : null}
            {can("visit:create") ? (
              <ButtonLink href="/visits/new">
                <Stethoscope />
                Kunjungan Baru
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {dashboardQuery.isPending ? (
        <CardSkeletonGrid />
      ) : dashboardQuery.isError ? (
        <ErrorState onRetry={() => dashboardQuery.refetch()} />
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Pasien"
              value={formatNumber(data.stats.totalPatients)}
              hint={`${formatNumber(data.stats.activePatients)} aktif`}
              icon={Users}
            />
            <StatCard
              label="Kunjungan Hari Ini"
              value={formatNumber(data.stats.todayVisits)}
              hint={`${data.stats.todayAppointments} reservasi hari ini`}
              icon={Stethoscope}
            />
            <StatCard
              label="Pendapatan Hari Ini"
              value={formatRupiah(data.stats.todayRevenue)}
              hint={`${data.stats.todayTransactions} transaksi`}
              icon={TrendingUp}
              tone="positive"
            />
            <StatCard
              label="Belum Lunas"
              value={formatRupiah(data.stats.outstandingAmount)}
              hint={`${data.stats.outstandingCount} transaksi`}
              icon={Wallet}
              tone="warning"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel
              title="Kunjungan Hari Ini"
              icon={Stethoscope}
              className="xl:col-span-2"
              bodyClassName="p-0"
              action={
                <ButtonLink href="/visits" variant="ghost" size="xs">
                  Lihat semua
                </ButtonLink>
              }
            >
              {data.todayVisits.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="Belum ada kunjungan hari ini."
                  description="Kunjungan yang dicatat akan muncul di sini."
                  action={
                    can("visit:create") ? (
                      <ButtonLink href="/visits/new" size="sm">
                        <Stethoscope />
                        Catat Kunjungan
                      </ButtonLink>
                    ) : null
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Jam</TableHead>
                      <TableHead>Pasien</TableHead>
                      <TableHead className="hidden md:table-cell">Dokter</TableHead>
                      {/* FIX: di xl kolom hanya 2/3 lebar, jadi kolom ini baru muncul di 2xl */}
                      <TableHead className="hidden lg:table-cell xl:hidden 2xl:table-cell">
                        Perawatan
                      </TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="pr-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.todayVisits.map((row) => (
                      <TableRow key={row.visitId}>
                        <TableCell className="pl-4 tabular-nums">{row.time}</TableCell>
                        <TableCell>
                          <Link
                            href={`/visits/${row.visitId}`}
                            className="block max-w-40 truncate font-medium hover:underline sm:max-w-56"
                          >
                            {row.patientName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{row.patientMrn}</p>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {row.doctorName}
                        </TableCell>
                        <TableCell className="hidden max-w-56 truncate text-muted-foreground lg:table-cell xl:hidden 2xl:table-cell">
                          {row.treatments.length > 0 ? row.treatments.join(", ") : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatRupiah(row.total)}
                        </TableCell>
                        <TableCell className="pr-4">
                          <VisitStatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Panel>

            <div className="min-w-0 space-y-4">
              <Panel title="Reservasi Mendatang" icon={CalendarCheck}>
                {data.upcomingAppointments.length === 0 ? (
                  <EmptyState
                    icon={CalendarCheck}
                    title="Belum ada reservasi."
                    className="py-8"
                  />
                ) : (
                  <ul className="space-y-3">
                    {data.upcomingAppointments.map((appointment) => (
                      <li
                        key={appointment.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {appointment.patientName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatTime(appointment.time)} &middot; {appointment.doctorName}
                          </p>
                        </div>
                        <StatusBadge
                          tone={appointment.status === "confirmed" ? "info" : "warning"}
                          label={
                            APPOINTMENT_STATUS_LABEL[appointment.status as AppointmentStatus]
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel
                title="Piutang Tertinggi"
                icon={CreditCard}
                bodyClassName="p-0"
                action={
                  <ButtonLink href="/payments" variant="ghost" size="xs">
                    Lihat
                  </ButtonLink>
                }
              >
                {data.outstandingList.length === 0 ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="Semua tagihan lunas."
                    className="py-8"
                  />
                ) : (
                  <Table>
                    <TableBody>
                      {data.outstandingList.map((row) => (
                        <TableRow key={row.visitId}>
                          <TableCell className="max-w-0 pl-4">
                            <Link
                              href={`/patients/${row.patientId}`}
                              className="block truncate font-medium hover:underline"
                            >
                              {row.patientName}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.visitNumber}
                            </p>
                          </TableCell>
                          <TableCell className="pr-4 text-right font-medium tabular-nums text-destructive">
                            {formatRupiah(row.outstanding)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Panel>
            </div>
          </div>

          <Panel
            title={`Pendapatan · ${REVENUE_RANGE_LABEL[range]}`}
            icon={TrendingUp}
            action={
              <Select
                value={range}
                onValueChange={(value) => setRange(value as RevenueRange)}
                items={(Object.keys(REVENUE_RANGE_LABEL) as RevenueRange[]).map((key) => ({
                  value: key,
                  label: REVENUE_RANGE_LABEL[key],
                }))}
              >
                <SelectTrigger size="sm" className="w-auto" aria-label="Filter periode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {(Object.keys(REVENUE_RANGE_LABEL) as RevenueRange[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {REVENUE_RANGE_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {data.revenueSeries.length === 0 ? (
              <EmptyState title="Belum ada data pendapatan." className="py-10" />
            ) : (
              <div className="h-56 w-full min-w-0 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.revenueSeries}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      interval="preserveStartEnd"
                      minTickGap={16} // FIX: cegah label bertumpuk di layar kecil
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickFormatter={(value: number) => formatRupiahShort(value)}
                    />
                    <ChartTooltip
                      cursor={{ fill: "var(--muted)", radius: 6 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                            <p className="font-medium">{label}</p>
                            <p className="tabular-nums text-muted-foreground">
                              {formatRupiah(Number(payload[0].value ?? 0))}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {data.revenueSeries.map((point, index) => (
                        <Cell
                          key={point.key}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon?: typeof Users;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    // FIX: min-w-0 + overflow-hidden agar item grid bisa menyusut dan tabel scroll di dalam card
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        {action}
      </header>
      <div className={cn("min-w-0 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}