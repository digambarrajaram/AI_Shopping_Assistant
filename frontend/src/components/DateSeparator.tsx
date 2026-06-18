import { useMemo } from "react";

interface DateSeparatorProps {
  date: Date;
}

const formatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function DateSeparator({ date }: DateSeparatorProps) {
  const label = useMemo(() => {
    const now = new Date();
    const d = new Date(date);
    // Compare date-only
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = today.getTime() - target.getTime();

    if (diff === 0) return "Today";
    if (diff === 86400000) return "Yesterday";
    return formatter.format(d);
  }, [date]);

  return (
    <div
      className="flex items-center gap-3 my-6 select-none"
      role="separator"
      aria-label={label}
    >
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}
