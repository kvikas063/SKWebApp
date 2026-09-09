"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1", label: "USA / Canada", flag: "🇺🇸" },
  { code: "+44", label: "UK", flag: "🇬🇧" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
  { code: "+966", label: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+65", label: "Singapore", flag: "🇸🇬" },
  { code: "+60", label: "Malaysia", flag: "🇲🇾" },
  { code: "+49", label: "Germany", flag: "🇩🇪" },
  { code: "+33", label: "France", flag: "🇫🇷" },
  { code: "+81", label: "Japan", flag: "🇯🇵" },
  { code: "+86", label: "China", flag: "🇨🇳" },
];

export type PhoneInputValue = {
  countryCode: string;
  number: string;
};

function parsePhone(raw: string | null | undefined): PhoneInputValue {
  if (!raw) return { countryCode: "+91", number: "" };
  const trimmed = raw.trim();
  for (const c of COUNTRY_CODES) {
    if (trimmed.startsWith(c.code)) {
      return { countryCode: c.code, number: trimmed.slice(c.code.length).trim() };
    }
  }
  if (trimmed.startsWith("+")) {
    const match = trimmed.match(/^(\+\d{1,3})(.*)$/);
    if (match) return { countryCode: match[1], number: match[2].trim() };
  }
  return { countryCode: "+91", number: trimmed };
}

export function combinePhone(value: PhoneInputValue): string {
  if (!value.number) return "";
  return `${value.countryCode} ${value.number}`.trim();
}

export function PhoneInput({
  id = "phone",
  name = "phone",
  defaultValue,
  required,
  placeholder = "98765 43210",
  className,
  onChange,
}: {
  id?: string;
  name?: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
  onChange?: (value: PhoneInputValue) => void;
}) {
  const [value, setValue] = useState<PhoneInputValue>(() => parsePhone(defaultValue));

  function update(patch: Partial<PhoneInputValue>) {
    const next = { ...value, ...patch };
    setValue(next);
    onChange?.(next);
  }

  return (
    <div className={cn("flex w-full items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
      <div className="flex items-center border-r border-input bg-muted/40 pr-1">
        <select
          aria-label="Country code"
          value={value.countryCode}
          onChange={(e) => update({ countryCode: e.target.value })}
          className="h-10 appearance-none border-0 bg-transparent px-3 text-sm font-semibold text-foreground outline-none focus:ring-0"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex flex-1 items-center">
        <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          name={name}
          type="tel"
          required={required}
          inputMode="numeric"
          maxLength={10}
          placeholder={placeholder}
          value={value.number}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
            update({ number: digitsOnly });
          }}
          className="h-10 w-full flex-1 bg-background pl-8 pr-3 text-sm outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
        />
      </div>
      <input
        type="hidden"
        name={`${name}Country`}
        value={value.countryCode}
      />
    </div>
  );
}

export { parsePhone };
