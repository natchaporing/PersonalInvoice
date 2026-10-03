import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";

export default async function Customers() {
  const { supabase } = await requireUser();
  const { data: customers } = await supabase.from("customers").select("*").order("name_th");
  const t = (await getMessages()).customers;
  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={<Button asChild><Link href="/customers/new"><Plus /> {t.newButton}</Link></Button>}
      />
      {!customers?.length ? (
        <EmptyState title={t.emptyTitle} action={<Button asChild><Link href="/customers/new"><Plus /> {t.emptyAction}</Link></Button>}>
          {t.emptyBody}
        </EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t.colName}</TableHead>
                  <TableHead>{t.colTaxId}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.colType}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.colEmail}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/customers/${c.id}`} className="font-medium text-cobalt hover:underline">{c.name_th}</Link>
                      {c.name_en && <div className="text-[12px] text-muted-foreground">{c.name_en}</div>}
                    </TableCell>
                    <TableCell className="num text-[13px]">{c.tax_id ?? <span className="text-muted-foreground">—</span>}{c.tax_id && c.branch_code !== "00000" && ` · ${c.branch_code}`}</TableCell>
                    <TableCell className="hidden sm:table-cell">{c.is_juristic ? t.company : t.individual}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{c.email ?? "—"}</TableCell>
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
