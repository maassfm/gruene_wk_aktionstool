"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function BestaetigenContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSend() {
    setStatus("sending");
    try {
      const res = await fetch(
        `/api/anmeldungen/meine-aktionen?email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0_#005538]">
        {!isValidEmail ? (
          <>
            <p className="font-headline font-bold text-signal text-2xl uppercase mb-2">
              Ungültige Anfrage
            </p>
            <p className="text-black mt-2">
              Der Link ist ungültig. Bitte verwende den Link aus deiner
              Bestätigungs-E-Mail.
            </p>
          </>
        ) : status === "sent" ? (
          <>
            <p className="font-headline font-bold text-tanne text-2xl uppercase mb-2">
              E-Mail wird gesendet
            </p>
            <p className="text-black mt-2">
              Deine Aktionsübersicht wurde an <strong>{email}</strong> gesendet.
            </p>
          </>
        ) : status === "error" ? (
          <>
            <p className="font-headline font-bold text-signal text-2xl uppercase mb-2">
              Fehler beim Senden
            </p>
            <p className="text-black mt-2">
              Leider konnte die E-Mail nicht gesendet werden. Bitte versuche es
              später erneut.
            </p>
          </>
        ) : (
          <>
            <p className="font-headline font-bold text-tanne text-2xl uppercase mb-2">
              Übersicht anfordern
            </p>
            <p className="text-black mt-2 mb-6">
              Soll eine Übersicht aller deiner Anmeldungen an{" "}
              <strong>{email}</strong> gesendet werden?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleSend}
                disabled={status === "sending"}
                className="bg-tanne text-white font-bold px-6 py-3 border-2 border-black shadow-[4px_4px_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "sending" ? "Wird gesendet …" : "E-Mail senden"}
              </button>
              <a
                href="/"
                className="bg-white text-black font-bold px-6 py-3 border-2 border-black shadow-[4px_4px_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all inline-block"
              >
                Abbrechen
              </a>
            </div>
          </>
        )}
        {(status === "sent" || status === "error" || !isValidEmail) && (
          <a
            href="/"
            className="mt-6 inline-block text-tanne hover:underline font-bold"
          >
            ← Zurück zur Aktionsübersicht
          </a>
        )}
      </div>
    </div>
  );
}

export default function MeineAktioneBestaetigenPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-12 text-center">Lade…</div>}>
      <BestaetigenContent />
    </Suspense>
  );
}
