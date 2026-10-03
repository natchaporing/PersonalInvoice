import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";

export default async function Payees() {
  const { supabase } = await requireUser();
  const [{ data: payees }, { data: commissions }] = await Promise.all([
    supabase.from("commission_payees").select("*").order("name"),
    supabase.from("commissions").select("payee_id, amount, wht, paid_on"),
  ]);
  const t = (await getMessages()).payees;
  const owed = (id: string) => (commissions ?? []).filter((c) => c.payee_id === id && !c.paid_on).reduce((s, c) => s + c.amount - c.wht, 0);
  const paid = (id: string) => (commissions ?? []).filter((c) => c.payee_id === id && c.paid_on).reduce((s, c) => s + c.amount - c.wht, 0);
  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={<Button asChild><Link href="/payees/new"><Plus /> {t.newButton}</Link></Button>}
      />
      {!payees?.length ? (
        <EmptyState title={t.emptyTitle} action={<Button asChild><Link href="/payees/new"><Plus /> {t.emptyAction}</Link></Button>}>
          {t.emptyBody}
        </EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t.colName}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.colBank}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.colDefault}</TableHead>
                  <TableHead className="text-right">{t.colToTransfer}</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">{t.colTransferred}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payees.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/payees/${p.id}`} className="font-medium text-cobalt hover:underline">{p.name}</Link>
                      <div className="text-[12px] text-muted-foreground">{p.is_juristic ? t.company : t.individual}{p.tax_id && ` · ${p.tax_id}`}</div>
                    </TableCell>
                    <TableCell className="hidden text-[13px] sm:table-cell">{p.bank_name ?? "—"}{p.bank_account_number && <div className="num text-muted-foreground">{p.bank_account_number}</div>}</TableCell>
                    <TableCell className="hidden text-[13px] md:table-cell">{p.default_rate_bps ? `${p.default_rate_bps / 100}%` : "—"}{p.default_wht_bps ? ` · ${t.wht(p.default_wht_bps / 100)}` : ""}</TableCell>
                    <TableCell className="num text-right">{formatTHB(owed(p.id))}</TableCell>
                    <TableCell className="num hidden text-right sm:table-cell">{formatTHB(paid(p.id))}</TableCell>
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
