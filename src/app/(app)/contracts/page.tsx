import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomerSnapshot } from "@/lib/domain/documents";
import { formatDate } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  return { title: `${(await getMessages()).contracts.title} · Tra` };
}

export default async function Contracts() {
  const { supabase } = await requireUser();
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const t = m.contracts;
  const { data: rows } = await supabase
    .from("contracts")
    .select("id, number, status, contract_date, client_snapshot, facts, quotation_id")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {!rows?.length ? (
        <EmptyState title={t.title}>{t.empty}</EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t.colNumber}</TableHead>
                  <TableHead>{t.colClient}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.colQuotation}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.colDate}</TableHead>
                  <TableHead className="text-right">{t.colStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><Link href={`/contracts/${c.id}`} className="num font-medium text-cobalt hover:underline">{c.number}</Link></TableCell>
                    <TableCell>{(c.client_snapshot as unknown as CustomerSnapshot)?.name_th}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Link href={`/documents/${c.quotation_id}`} className="num hover:underline">{(c.facts as { quotationNumber?: string })?.quotationNumber}</Link></TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(c.contract_date, locale)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("text-[13px]", c.status === "signed" ? "text-ok" : c.status === "sent" ? "text-cobalt" : c.status === "void" ? "text-destructive" : "text-muted-foreground")}>{t.status[c.status]}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
