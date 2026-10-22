import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Props = { title: string; children?: ReactNode; className?: string };

/** The editor's amber warning note (T-009-notices-share-amber-style): a bold title and optional detail. */
export function Notice({ title, children, className = "" }: Props) {
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 ${className}`}>
      <TriangleAlert size={18} strokeWidth={2.2} aria-hidden="true" className="mt-px shrink-0 text-[#92400E]" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[#78350F]">{title}</span>
        {children}
      </div>
    </div>
  );
}
