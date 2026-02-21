"use client";

import { useLanguage } from "@/lib/language-context";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";

  const goToDay = (offset: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + offset);
    onChange(d.toISOString().split("T")[0]);
  };

  const isToday = value === new Date().toISOString().split("T")[0];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => goToDay(-1)}
        className="p-2 rounded-xl hover:bg-white/[0.06] text-[#666] hover:text-white transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-xs text-[#666] border-none focus:outline-none cursor-pointer w-[18px] overflow-hidden"
        />
        <span className="text-sm font-medium text-white capitalize">
          {formatDate(value)}
        </span>
      </div>

      <button
        onClick={() => goToDay(1)}
        disabled={isToday}
        className="p-2 rounded-xl hover:bg-white/[0.06] text-[#666] hover:text-white transition-all disabled:opacity-20 disabled:hover:bg-transparent"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!isToday && (
        <button
          onClick={() => onChange(new Date().toISOString().split("T")[0])}
          className="px-2.5 py-1 rounded-lg text-xs text-[#666] hover:text-white bg-white/[0.03] hover:bg-white/[0.06] transition-all"
        >
          {t("common.today")}
        </button>
      )}
    </div>
  );
}
