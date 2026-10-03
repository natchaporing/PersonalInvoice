import type { Locale } from "../config";
import { en, type Messages } from "./en";
import { th } from "./th";

export type { Messages };
export const messages: Record<Locale, Messages> = { th, en };
