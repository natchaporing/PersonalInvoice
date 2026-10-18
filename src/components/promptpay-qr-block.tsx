import { Qr } from "@/components/qr";
import type { Lang } from "@/lib/document-view";
import { formatTHB } from "@/lib/thai/money";
import { formatPromptPay, isPromptPayId, promptPayPayload } from "@/lib/thai/promptpay";

const pair = (th: string, en: string, lang: Lang) => (lang === "th" ? th : lang === "en" ? en : `${th} · ${en}`);

/** The seller's PromptPay as a printed QR. With an amount, the payer's banking app fills it in. */
export function PromptPayQrBlock({ id, amount, lang, color = "#16202e", muted = "#6b7482" }: { id: string; amount?: number; lang: Lang; color?: string; muted?: string }) {
  if (!isPromptPayId(id)) return null;
  const sub = lang === "bilingual" ? "th" : lang;
  return (
    <div className="flex items-center gap-3">
      <Qr value={promptPayPayload(id, amount)} size={92} color={color} label={`PromptPay ${formatPromptPay(id)}${amount ? ` ฿${formatTHB(amount)}` : ""}`} />
      <div className="text-[10.5px] leading-snug">
        <div className="font-semibold" style={{ color }}>{pair("พร้อมเพย์", "PromptPay", lang)}</div>
        <div className="tabular-nums">{formatPromptPay(id)}</div>
        {amount ? <div className="mt-0.5 text-[12.5px] font-semibold tabular-nums" style={{ color }}>฿{formatTHB(amount)}</div> : null}
        <div className="mt-0.5" style={{ color: muted }}>{amount ? pair("สแกนจ่ายด้วยแอปธนาคาร", "Scan to pay in any Thai banking app", sub) : pair("สแกนแล้วระบุยอดที่ชำระ", "Scan, then enter the amount", sub)}</div>
      </div>
    </div>
  );
}
