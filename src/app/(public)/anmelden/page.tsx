"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnmeldeFormular from "@/components/AnmeldeFormular";

interface Aktion {
  id: string;
  titel: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
  wahlkreis: { nummer: number; name: string };
  ansprechpersonName: string;
  maxTeilnehmer: number | null;
  status: string;
  _count: { anmeldungen: number };
}

function AnmeldenPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [aktionen, setAktionen] = useState<Aktion[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [bereitsAngemeldet, setBereitsAngemeldet] = useState<string[]>([]);

  const initialIds = useMemo(() => {
    const param = searchParams.get("aktionen");
    return param ? param.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  useEffect(() => {
    fetch("/api/aktionen?public=true")
      .then((r) => r.json())
      .then((data: Aktion[]) => {
        setAktionen(data);
        setLoading(false);
      });
  }, []);

  const aktionTitles = useMemo(
    () => new Map(aktionen.map((a) => [a.id, a.titel])),
    [aktionen]
  );

  function removeAktion(id: string) {
    const next = selectedIds.filter((sid) => sid !== id);
    if (next.length === 0) {
      router.push("/");
    } else {
      setSelectedIds(next);
    }
  }

  function handleSuccess(ids?: string[]) {
    setBereitsAngemeldet(ids ?? []);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0_#005538]">
          <p className="font-headline font-bold text-tanne text-2xl uppercase mb-2">
            Anmeldung erfolgreich!
          </p>
          <p className="text-black mt-2">
            Du erhältst in Kürze eine Bestätigungs-E-Mail.
          </p>
          {bereitsAngemeldet.length > 0 && (
            <div className="mt-4 bg-white border-2 border-yellow-500 p-4 text-left shadow-[3px_3px_0_#ca8a04]">
              <p className="font-bold text-sm text-black mb-2">
                Hinweis: Für folgende Aktionen warst Du bereits angemeldet:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {bereitsAngemeldet.map((id) => (
                  <li key={id} className="text-sm text-black">
                    {aktionTitles.get(id) || id}
                  </li>
                ))}
              </ul>
              <p className="font-bold text-sm text-black mb-2">
                Du erhältst für diese Aktionen keine Bestätigungs-E-Mail.
              </p>
            </div>
          )}
          <Link
            href="/"
            className="mt-6 inline-block text-tanne hover:underline font-bold"
          >
            ← Zurück zur Aktionsübersicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-tanne hover:underline font-medium mb-6"
      >
        ← Zurück zur Aktionsübersicht
      </Link>

      <h1 className="font-headline text-2xl md:text-3xl font-bold text-tanne uppercase mb-6">
        Anmeldung
      </h1>

      {/* Selected actions summary */}
      <div className="border-2 border-black p-4 mb-6 shadow-[4px_4px_0_#000]">
        <p className="text-sm font-bold uppercase tracking-wide text-black mb-3">
          {selectedIds.length === 1
            ? "Du hast 1 Aktion ausgewählt:"
            : `Du hast ${selectedIds.length} Aktionen ausgewählt:`}
        </p>
        {loading ? (
          <p className="text-sm text-gray-400">Lade Aktionen...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 text-xs bg-tanne text-white px-2.5 py-1 border border-black font-bold uppercase tracking-wide"
              >
                {aktionTitles.get(id) || id}
                <button
                  type="button"
                  onClick={() => removeAktion(id)}
                  className="ml-0.5 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black"
                  aria-label={`${aktionTitles.get(id) || id} entfernen`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Registration form */}
      <AnmeldeFormular
        selectedIds={selectedIds}
        aktionTitles={aktionTitles}
        onSuccess={handleSuccess}
        onClear={() => router.push("/")}
      />
    </div>
  );
}

export default function AnmeldenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-gray-400">
          Lade...
        </div>
      }
    >
      <AnmeldenPageContent />
    </Suspense>
  );
}
