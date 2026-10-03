import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";

export default async function Items() {
  const { supabase } = await requireUser();
  const { data: items } = await supabase.from("items").select("*").order("name_th");
  const t = (await getMessages()).items;
  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={<Button asChild><Link href="/items/new"><Plus /> {t.newButton}</Link></Button>}
      />
      {!items?.length ? (
        <EmptyState title={t.emptyTitle} action={<Button asChild><Link href="/items/new"><Plus /> {t.emptyAction}</Link></Button>}>
          {t.emptyBody}
        </EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t.colItem}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.colUnit}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.colWithholding}</TableHead>
                  <TableHead className="text-right">{t.colPrice}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Link href={`/items/${i.id}`} className="font-medium text-cobalt hover:underline">{i.name_th}</Link>
                      {i.name_en && <div className="text-[12px] text-muted-foreground">{i.name_en}</div>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{i.unit || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{i.default_wht_bps ? `${i.default_wht_bps / 100}%` : "—"}</TableCell>
                    <TableCell className="num text-right">{formatTHB(i.unit_price)}</TableCell>
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
