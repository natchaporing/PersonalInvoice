import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";


export default async function Payments() {
  const { supabase } = await requireUser();
  const [{ data: payments }, { data: certs }] = await Promise.all([
    supabase.from("payments").select("id, paid_on, amount, method, reference, documents(id, number, customer_snapshot)").order("paid_on", { ascending: false }).limit(300),
    supabase.from("wht_certificates").select("id, issued_on, certificate_no, income_amount, wht_amount, documents(id, number)").order("issued_on", { ascending: false }).limit(300),
  ]);
  const t = (await getMessages()).payments;
  const whtByYear = new Map<string, number>();
  for (const c of certs ?? []) whtByYear.set(c.issued_on.slice(0, 4), (whtByYear.get(c.issued_on.slice(0, 4)) ?? 0) + c.wht_amount);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {!payments?.length && !certs?.length ? (
        <EmptyState title={t.emptyTitle}>{t.emptyBody}</EmptyState>
      ) : (
        <div className="grid gap-6">
          <Card className="py-2">
            <CardHeader className="pt-3"><CardTitle>{t.received}</CardTitle></CardHeader>
            <CardContent className="px-2 sm:px-3">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t.colDate}</TableHead>
                    <TableHead>{t.colDocument}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.colMethod}</TableHead>
                    <TableHead className="text-right">{t.colAmount}</TableHead>
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
                      <TableCell className="hidden sm:table-cell">{t.method[p.method] ?? p.method}{p.reference && ` · ${p.reference}`}</TableCell>
                      <TableCell className="num text-right">{formatTHB(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardHeader className="pt-3">
              <CardTitle>{t.certificates}</CardTitle>
              <CardDescription>
                {t.certificatesNote}{" "}
                {[...whtByYear].map(([y, v]) => `${y}: ฿${formatTHB(v)}`).join(" · ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-3">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t.colDate}</TableHead>
                    <TableHead>{t.colDocument}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.colCertificate}</TableHead>
                    <TableHead className="text-right">{t.colIncome}</TableHead>
                    <TableHead className="text-right">{t.colWithheld}</TableHead>
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
