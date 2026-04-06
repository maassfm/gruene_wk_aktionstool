"use client";

import { useRouter } from "next/navigation";

interface SelectionBarProps {
  selectedIds: string[];
  aktionTitles: Map<string, string>;
}

export default function SelectionBar({ selectedIds, aktionTitles }: SelectionBarProps) {
  const router = useRouter();

  function handleAnmelden() {
    router.push(`/anmelden?aktionen=${selectedIds.join(",")}`);
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black shadow-[0_-4px_0_#000] z-50 transition-transform duration-300 ${
        selectedIds.length > 0 ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={selectedIds.length === 0}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Counter + chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-headline font-bold text-black uppercase text-xl leading-tight">
              {selectedIds.length} Aktion{selectedIds.length !== 1 ? "en" : ""} ausgewählt
            </span>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {selectedIds.map((id) => (
                <span
                  key={id}
                  className="text-xs bg-tanne text-white px-2 py-1 font-bold uppercase tracking-wide border border-black"
                >
                  {aktionTitles.get(id) || id}
                </span>
              ))}
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={handleAnmelden}
            className="w-full sm:w-auto shrink-0 bg-tanne text-white font-headline font-bold uppercase text-base px-6 py-3 border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black"
          >
            Jetzt anmelden →
          </button>
        </div>
      </div>
    </div>
  );
}
