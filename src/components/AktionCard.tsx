"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import Badge from "@/components/ui/Badge";

interface AktionCardProps {
  aktion: {
    id: string;
    titel: string;
    datum: string;
    startzeit: string;
    endzeit: string;
    adresse: string;
    wahlkreis: { nummer: number; name: string };
    ansprechpersonName: string;
    maxTeilnehmer: number | null;
    status: string;
    _count: { anmeldungen: number };
  };
  selected: boolean;
  onToggle: (id: string) => void;
}

export default function AktionCard({ aktion, selected, onToggle }: AktionCardProps) {
  const datum = new Date(aktion.datum);
  const isFull =
    aktion.maxTeilnehmer !== null &&
    aktion._count.anmeldungen >= aktion.maxTeilnehmer;

  return (
    <div
      className={`bg-white border-2 transition-all cursor-pointer ${
        selected
          ? "border-tanne shadow-[4px_4px_0_#005538]"
          : "border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
      } ${isFull ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={() => !isFull && onToggle(aktion.id)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-headline font-bold text-tanne text-xl leading-tight uppercase tracking-wide">
            {aktion.titel}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {aktion.status === "GEAENDERT" && (
              <Badge variant="warning">Geändert</Badge>
            )}
            {aktion.status === "ABGESAGT" && (
              <Badge variant="danger">Abgesagt</Badge>
            )}
            {/* Square brutalist checkbox */}
            <div
              className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected
                  ? "bg-tanne border-tanne"
                  : "bg-white border-black"
              } ${isFull ? "opacity-50" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                !isFull && onToggle(aktion.id);
              }}
              role="checkbox"
              aria-checked={selected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  !isFull && onToggle(aktion.id);
                }
              }}
            >
              {selected && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1 text-base text-black">
          <p>
            📅{" "}
            <span className="font-bold">
              {format(datum, "EEEE, d. MMMM", { locale: de })}
            </span>{" "}
            · {aktion.startzeit} – {aktion.endzeit} Uhr
          </p>
          <p>📍 {aktion.adresse}</p>
          <div className="flex items-center justify-between mt-3 mb-1">
            <span className="text-base font-medium">
              👋 {aktion.ansprechpersonName}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wide bg-black text-white px-2 py-0.5 inline-block">
              WK {aktion.wahlkreis.nummer}: {aktion.wahlkreis.name}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-600 font-medium">
              {aktion._count.anmeldungen} Anmeldung{aktion._count.anmeldungen !== 1 ? "en" : ""}
              {aktion.maxTeilnehmer ? ` / ${aktion.maxTeilnehmer} Plätze` : ""}
            </span>
            {isFull && (
              <Badge variant="danger">Ausgebucht</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
