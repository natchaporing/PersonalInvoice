import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOC_TYPE_LABEL, DOC_TYPES, type DocStatus, type DocType, isOverdue, todayBangkok } from "@/lib/domain/documents";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN } from "@/lib/thai/thai-date";
import { cn } from "@/lib/utils";

const STATUSES: DocStatus[] = ["draft", "issued", "paid", "void"];

export default async function Documents({ searchParams }: PageProps<"/documents">) {
  const { supabase } = await requireUser();
  const sp = await searchParams;
  const type = DOC_TYPES.includes(sp.type as DocType) ? (sp.type as DocType) : undefined;
  const status = STATUSES.includes(sp.status as DocStatus) ? (sp.status as DocStatus) : undefined;

  let q = supabase
    .from("documents")
    .select("id, number, doc_type, status, issue_date, due_date, total, net_receivable, customer_snapshot, customers(name_th)")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (type) q = q.eq("doc_type", type);
  if (status) q = q.eq("status", status);
  const { data: docs } = await q;
  const today = todayBangkok();

  const href = (t?: string, s?: string) => {
    const p = new URLSearchParams();
    if (t) p.set("type", t);
    if (s) p.set("status", s);
    const qs = p.toString();
    return `/documents${qs ? `?${qs}` : ""}`;
  };
  const chip = (active: boolean) =>
    cn("inline-flex h-8 items-center rounded-full border px-3 text-[13px]", active ? "border-cobalt bg-accent font-medium text-cobalt" : "bg-card hover:bg-secondary");

  return (
    <>
      <PageHeader
        eyebrow="เอกสารทั้งหมด"
        title="Documents"
        subtitle="Quotations, invoices, tax invoices, receipts and notes."
        actions={<Button asChild><Link href="/documents/new"><Plus /> New document</Link></Button>}
      />
      <nav aria-label="Filter by type" className="mb-2 flex flex-wrap gap-2">
        <Link href={href(undefined, status)} className={chip(!type)} aria-current={!type ? "true" : undefined}>All types</Link>
        {DOC_TYPES.map((t) => (
          <Link key={t} href={href(t, status)} className={chip(type === t)} aria-current={type === t ? "true" : undefined}>{DOC_TYPE_LABEL[t].en}</Link>
        ))}
      </nav>
      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        <Link href={href(type)} className={chip(!status)} aria-current={!status ? "true" : undefined}>Any status</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={href(type, s)} className={cn(chip(status === s), "capitalize")} aria-current={status === s ? "true" : undefined}>{s}</Link>
        ))}
      </nav>

      {!docs?.length ? (
        <EmptyState title={type || status ? "Nothing matches these filters" : "No documents yet"} action={<Button asChild><Link href="/documents/new"><Plus /> New document</Link></Button>}>
          {type || status ? "Try another type or status." : "Create a quotation, invoice or tax invoice. It starts as a draft you can edit."}
        </EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total ฿</TableHead>
                  <TableHead className="text-right">Net receivable ฿</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => {
                  const name = (d.customer_snapshot as { name_th?: string } | null)?.name_th ?? d.customers?.name_th ?? "—";
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link href={`/documents/${d.id}`} className="hover:underline">
                          {d.number ? <SerialNumber value={d.number} className="text-[12px]" /> : <span className="text-muted-foreground">Draft</span>}
                        </Link>
                      </TableCell>
                      <TableCell>{DOC_TYPE_LABEL[d.doc_type].en}<div className="text-[12px] text-muted-foreground">{DOC_TYPE_LABEL[d.doc_type].th}</div></TableCell>
                      <TableCell><Link href={`/documents/${d.id}`} className="hover:underline">{name}</Link></TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateEN(d.issue_date)}</TableCell>
                      <TableCell><StatusBadge status={d.status} overdue={isOverdue(d, today)} /></TableCell>
                      <TableCell className="num text-right">{formatTHB(d.total)}</TableCell>
                      <TableCell className="num text-right">{formatTHB(d.net_receivable)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
