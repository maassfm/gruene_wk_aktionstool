"use client";

import { useState } from "react";

interface FilterState {
  datum: string;
  datumBis: string;
  tageszeit: string[];
  wahlkreise: number[];
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  wahlkreise: { nummer: number; name: string }[];
}

const TAGESZEITEN = [
  { value: "", label: "Alle" },
  { value: "vormittags", label: "Vormittags" },
  { value: "tagsueber", label: "Tagsüber" },
  { value: "abends", label: "Abends" },
];

export default function FilterBar({ filters, onFilterChange, wahlkreise }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  function toggleWahlkreis(nummer: number) {
    const current = filters.wahlkreise;
    const next = current.includes(nummer)
      ? current.filter((n) => n !== nummer)
      : [...current, nummer];
    onFilterChange({ ...filters, wahlkreise: next });
  }

  function toggleTageszeit(value: string) {
    const current = filters.tageszeit;
    const next = current.includes(value)
      ? current.filter((t) => t !== value)
      : [...current, value];
    onFilterChange({ ...filters, tageszeit: next });
  }

  const activeFilterCount =
    (filters.datum ? 1 : 0) +
    (filters.tageszeit.length > 0 ? 1 : 0) +
    (filters.wahlkreise.length > 0 ? 1 : 0);

  return (
    <div className="bg-white border-b-2 border-black sticky top-[52px] z-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Toggle button: visible on mobile and tablet (< lg) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="lg:hidden w-full py-3 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-black focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black"
        >
          <span>
            Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </span>
          <span className="text-xs">{expanded ? "▲" : "▼"}</span>
        </button>

        {/* Filter content */}
        <div
          className={`${
            expanded ? "block" : "hidden"
          } lg:block py-3`}
        >
          {/* Row 1: Datum + Tageszeit + Clear (lg: inline) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:flex-nowrap">
            {/* Datum */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-black shrink-0">Datum:</label>
              <input
                type="date"
                value={filters.datum}
                onChange={(e) => onFilterChange({ ...filters, datum: e.target.value })}
                className="text-sm border-2 border-black bg-white px-2 py-1 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black"
              />
              <span className="text-black font-bold">–</span>
              <input
                type="date"
                value={filters.datumBis}
                onChange={(e) => onFilterChange({ ...filters, datumBis: e.target.value })}
                className="text-sm border-2 border-black bg-white px-2 py-1 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black"
              />
            </div>

            {/* Tageszeit */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-bold uppercase tracking-wide text-black shrink-0">Tageszeit:</label>
              <div className="flex gap-1 flex-wrap">
                {TAGESZEITEN.map((tz) => (
                  <button
                    key={tz.value}
                    onClick={() =>
                      tz.value === ""
                        ? onFilterChange({ ...filters, tageszeit: [] })
                        : toggleTageszeit(tz.value)
                    }
                    className={`text-xs px-2 py-1 font-bold uppercase tracking-wide border-2 transition-colors focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black ${
                      (tz.value === "" && filters.tageszeit.length === 0) ||
                      (tz.value !== "" && filters.tageszeit.includes(tz.value))
                        ? "bg-tanne text-white border-black"
                        : "bg-white text-black border-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {tz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear (shown inline on lg+, only when row 1 has active filters) */}
            {activeFilterCount > 0 && (filters.datum || filters.tageszeit.length > 0) && (
              <button
                onClick={() =>
                  onFilterChange({
                    datum: "",
                    datumBis: "",
                    tageszeit: [],
                    wahlkreise: [],
                  })
                }
                className="text-xs font-bold uppercase tracking-wide text-black underline lg:ml-auto hover:text-tanne focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black hidden lg:block"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>

          {/* Row 2: Wahlkreise */}
          <div className="flex items-center gap-2 mt-3">
            <label className="text-xs font-bold uppercase tracking-wide text-black shrink-0">WK:</label>
            <div className="flex gap-1 flex-wrap">
              {wahlkreise.map((wk) => (
                <button
                  key={wk.nummer}
                  onClick={() => toggleWahlkreis(wk.nummer)}
                  title={wk.name}
                  className={`w-7 h-7 text-xs font-bold border-2 transition-colors focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black ${
                    filters.wahlkreise.includes(wk.nummer)
                      ? "bg-tanne text-white border-black"
                      : "bg-white text-black border-black hover:bg-black hover:text-white"
                  }`}
                >
                  {wk.nummer}
                </button>
              ))}
            </div>

            {/* Clear button (mobile/tablet: after WK row) */}
            {activeFilterCount > 0 && (
              <button
                onClick={() =>
                  onFilterChange({
                    datum: "",
                    datumBis: "",
                    tageszeit: [],
                    wahlkreise: [],
                  })
                }
                className="text-xs font-bold uppercase tracking-wide text-black underline ml-auto hover:text-tanne focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black lg:hidden"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { FilterState };
