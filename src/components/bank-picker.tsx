"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { type Bank, searchBanks } from "@/lib/thai/banks";
import { cn } from "@/lib/utils";

/**
 * Searchable list of Thai banks (combobox pattern: type to filter, arrows to move, Enter to pick, Esc to close).
 * Matches Thai name, English name, short name (e.g. KBANK) and the 3-digit bank code.
 */
export function BankPicker({ selected, onSelect }: { selected?: Bank; onSelect: (bank: Bank) => void }) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchBanks(query), [query]);

  const pick = (bank: Bank) => {
    onSelect(bank);
    setQuery("");
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault(); // don't submit the profile form
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${results[active].code}` : undefined}
          aria-label="Search bank"
          autoComplete="off"
          placeholder={selected ? `${selected.th} · ${selected.en}` : "Search bank · ค้นหาธนาคาร (name, KBANK, 004…)"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-9 w-full rounded-md border border-input bg-card pr-9 pl-9 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 md:text-sm"
        />
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Banks"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-lg"
        >
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No bank matches “{query}”. Type the names below instead.</li>}
          {results.map((b, i) => {
            const isSelected = selected?.code === b.code;
            return (
              <li
                key={b.code}
                id={`${listId}-${b.code}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus so blur doesn't close before the click lands
                  pick(b);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex cursor-pointer items-center gap-3 px-3 py-2 text-sm", i === active && "bg-accent")}
              >
                <span className="num w-14 shrink-0 rounded-sm border px-1.5 py-0.5 text-center text-[11px]">{b.short}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{b.th}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{b.en}</span>
                </span>
                <span className="num text-[11px] text-muted-foreground">{b.code}</span>
                {isSelected && <Check aria-label="Selected" className="size-4 text-cobalt" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
