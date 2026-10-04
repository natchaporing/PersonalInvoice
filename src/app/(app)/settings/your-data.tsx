import { Download, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Messages } from "@/lib/i18n/messages";

/** PDPA rights in practice: a copy of your data now, and a deletion or correction request to the operator. */
export function YourData({ m, contactEmail, accountEmail }: { m: Messages; contactEmail: string | null; accountEmail: string }) {
  const t = m.settings.data;
  const mail = contactEmail
    ? `mailto:${contactEmail}?${new URLSearchParams({ subject: t.deleteSubject, body: t.deleteBody(accountEmail) }).toString().replace(/\+/g, "%20")}`
    : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.note}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <a href="/settings/data-export" className={buttonVariants({ variant: "outline" })} download><Download aria-hidden /> {t.export}</a>
          {mail && <a href={mail} className={buttonVariants({ variant: "outline" })}><Mail aria-hidden /> {t.delete}</a>}
        </div>
        <p className="text-muted-foreground">{t.retention}</p>
        {contactEmail && <p className="text-muted-foreground">{t.contact(contactEmail)}</p>}
      </CardContent>
    </Card>
  );
}
