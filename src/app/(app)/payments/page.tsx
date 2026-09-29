import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";

const METHOD: Record<string, string> = { transfer: "Bank transfer", cheque: "Cheque", cash: "Cash", other: "Other" };

export default async function Payments() {
  const { supabase } = await requireUser();
  const [{ data: payments }, { data: certs }] = await Promise.all([
    supabase.from("payments").select("id, paid_on, amount, method, reference, documents(id, number, customer_snapshot)").order("paid_on", { ascending: false }).limit(300),
    supabase.from("wht_certificates").select("id, issued_on, certificate_no, income_amount, wht_amount, documents(id, number)").order("issued_on", { ascending: false }).limit(300),
  ]);
  const whtByYear = new Map<string, number>();
  for (const c of certs ?? []) whtByYear.set(c.issued_on.slice(0, 4), (whtByYear.get(c.issued_on.slice(0, 4)) ?? 0) + c.wht_amount);

  return (
    <>
      <PageHeader eyebrow="การรับชำระ" title="Payments" subtitle="Money received and withholding certificates. Record them from each document's page." />
      {!payments?.length && !certs?.length ? (
        <EmptyState title="Nothing recorded yet">Open an issued invoice or tax invoice and record the payment there.</EmptyState>
      ) : (
        <div className="grid gap-6">
          <Card className="py-2">
            <CardHeader className="pt-3"><CardTitle>Received · รับชำระแล้ว</CardTitle></CardHeader>
            <CardContent className="px-2 sm:px-3">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden sm:table-cell">Method</TableHead>
                    <TableHead className="text-right">Amount ฿</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payments ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">{p.paid_on}</TableCell>
                      <TableCell>
                        {p.documents && <Link href={`/documents/${p.documents.id}`} className="hover:underline"><SerialNumber value={p.documents.number ?? "—"} className="text-[12px]" /></Link>}
                        <div className="text-[12px] text-muted-foreground">{(p.documents?.customer_snapshot as { name_th?: string } | null)?.name_th}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{METHOD[p.method] ?? p.method}{p.reference && ` · ${p.reference}`}</TableCell>
                      <TableCell className="num text-right">{formatTHB(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardHeader className="pt-3">
              <CardTitle>Withholding certificates · 50 ทวิ</CardTitle>
              <CardDescription>
                Tax withheld by customers is a credit against your annual personal income tax (PND 90/91).{" "}
                {[...whtByYear].map(([y, v]) => `${y}: ฿${formatTHB(v)}`).join(" · ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-3">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden sm:table-cell">Certificate</TableHead>
                    <TableHead className="text-right">Income ฿</TableHead>
                    <TableHead className="text-right">Withheld ฿</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(certs ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap">{c.issued_on}</TableCell>
                      <TableCell>{c.documents ? <Link href={`/documents/${c.documents.id}`} className="hover:underline"><SerialNumber value={c.documents.number ?? "—"} className="text-[12px]" /></Link> : "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.certificate_no ?? "—"}</TableCell>
                      <TableCell className="num text-right">{formatTHB(c.income_amount)}</TableCell>
                      <TableCell className="num text-right">{formatTHB(c.wht_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
