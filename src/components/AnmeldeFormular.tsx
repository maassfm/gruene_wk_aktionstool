"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

interface AnmeldeFormularProps {
  selectedIds: string[];
  aktionTitles: Map<string, string>;
  onSuccess: (bereitsAngemeldetIds?: string[]) => void;
  onClear: () => void;
}

export default function AnmeldeFormular({
  selectedIds,
  aktionTitles,
  onSuccess,
  onClear,
}: AnmeldeFormularProps) {
  const [form, setForm] = useState({
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    signalName: "",
    datenschutz: false,
    honeypot: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vornameError, setVornameError] = useState("");
  const [nachnameError, setNachnameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [contactError, setContactError] = useState("");
  const [signalError, setSignalError] = useState("");
  const [datenschutzError, setDatenschutzError] = useState("");

  const TELEFON_REGEX = /^[\d\s+\-()\/]{6,20}$/;

  function updateForm(field: string, value: string | boolean) {
    setForm({ ...form, [field]: value });
    if (field === "vorname") setVornameError("");
    if (field === "nachname") setNachnameError("");
    if (field === "email") setEmailError("");
    if (field === "datenschutz") setDatenschutzError("");
    if (field === "telefon" || field === "signalName") {
      setContactError("");
    }
    if (field === "signalName") {
      setSignalError("");
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVornameError("");
    setNachnameError("");
    setEmailError("");
    setContactError("");
    setSignalError("");
    setDatenschutzError("");

    let hasError = false;

    if (!form.vorname || form.vorname.trim().length < 2) {
      setVornameError("Vorname muss mindestens 2 Zeichen lang sein");
      hasError = true;
    }
    if (!form.nachname || form.nachname.trim().length < 2) {
      setNachnameError("Nachname muss mindestens 2 Zeichen lang sein");
      hasError = true;
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailError("Bitte gib eine gültige E-Mail-Adresse ein");
      hasError = true;
    }
    if (!form.telefon && !form.signalName) {
      setContactError("Bitte gib eine Telefonnummer oder einen Signal-Nutzernamen an");
      hasError = true;
    } else if (form.telefon && !TELEFON_REGEX.test(form.telefon)) {
      setContactError("Bitte gib eine gültige Telefonnummer ein");
      hasError = true;
    } else if (form.signalName && !/^[a-zA-Z0-9_]{2,32}\.\d+$/.test(form.signalName)) {
      setSignalError("Bitte gib deinen Signal-Nutzernamen ein (Format: name.123)");
      hasError = true;
    }
    if (!form.datenschutz) {
      setDatenschutzError("Du musst der Datenschutzerklärung zustimmen");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const res = await fetch("/api/anmeldungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aktionIds: selectedIds,
          vorname: form.vorname,
          nachname: form.nachname,
          email: form.email,
          telefon: form.telefon || null,
          signalName: form.signalName || null,
          datenschutz: form.datenschutz,
          honeypot: form.honeypot,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const bereitsAngemeldetIds = (data.results ?? [])
          .filter((r: { error?: string }) => r.error === "Bereits angemeldet")
          .map((r: { aktionId: string }) => r.aktionId);
        onSuccess(bereitsAngemeldetIds.length > 0 ? bereitsAngemeldetIds : undefined);
      } else {
        const data = await res.json();
        setError(data.error || "Fehler bei der Anmeldung");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot - hidden from humans */}
        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            name="website"
            value={form.honeypot}
            onChange={(e) => updateForm("honeypot", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Vorname"
              hint="Pflichtfeld"
              value={form.vorname}
              onChange={(e) => updateForm("vorname", e.target.value)}
              error={vornameError}
            />
          </div>
          <div>
            <Input
              label="Nachname"
              hint="Pflichtfeld"
              value={form.nachname}
              onChange={(e) => updateForm("nachname", e.target.value)}
              error={nachnameError}
            />
          </div>
        </div>

        <div>
          <Input
            label="E-Mail"
            hint="Pflichtfeld"
            type="email"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
            error={emailError}
          />
        </div>

        {!contactError && (
          <p className="text-sm font-bold text-himmel mt-1">
            Bitte gib mindestens eine Telefonnummer <span className="uppercase font-black">ODER</span> einen Signal-Nutzernamen an.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Telefonnummer"
              hint="Alternativ Signal-Nutzername"
              type="tel"
              value={form.telefon}
              onChange={(e) => updateForm("telefon", e.target.value)}
              error={contactError}
            />
          </div>
          <div>
            <Input
              label="Signal-Nutzername"
              hint="Alternativ Telefonnummer"
              value={form.signalName}
              onChange={(e) => updateForm("signalName", e.target.value)}
              placeholder="z.B. name.123"
              error={signalError}
            />
          </div>
        </div>


        <div className="flex items-start gap-3">
          {/* Square brutalist checkbox */}
          <div className="relative mt-1 shrink-0">
            <input
              type="checkbox"
              id="datenschutz-page"
              checked={form.datenschutz}
              onChange={(e) => updateForm("datenschutz", e.target.checked)}
              className="sr-only"
            />
            <label
              htmlFor="datenschutz-page"
              className={`w-5 h-5 border-2 border-black flex items-center justify-center cursor-pointer transition-colors ${
                form.datenschutz ? "bg-tanne" : "bg-white"
              }`}
            >
              {form.datenschutz && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </label>
          </div>
          <div>
            <label htmlFor="datenschutz-page" className="text-sm text-gray-700 cursor-pointer">
              Ich stimme der Verarbeitung meiner Daten zum Zweck der Koordination
              von Wahlkampfaktionen zu.{" "}
              <Link
                href="/datenschutz"
                target="_blank"
                className="text-tanne font-bold hover:underline"
              >
                Datenschutzerklärung
              </Link>
            </label>
            <p className="text-xs text-gray-400 mt-0.5">Pflichtfeld</p>
            {datenschutzError && <p className="mt-1 text-sm font-bold text-signal">{datenschutzError}</p>}
          </div>
        </div>

        {error && (
          <div className="bg-white border-2 border-signal text-black p-3 text-sm font-bold">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto">
          Jetzt anmelden
        </Button>
      </form>
    </div>
  );
}
