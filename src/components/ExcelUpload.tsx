"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

interface Team {
  id: string;
  name: string;
}

interface ValidationResult {
  index: number;
  row: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

interface ExcelUploadProps {
  userTeams?: Team[];
  needsTeamSelect?: boolean;
}

export default function ExcelUpload({ userTeams = [], needsTeamSelect = false }: ExcelUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  async function handleFile(file: File) {
    setFileName(file.name);
    setSelectedFile(file);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResults(data.results || []);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (needsTeamSelect && userTeams.length > 0 && !selectedTeamId) {
      alert("Bitte wähle ein Team aus.");
      return;
    }

    setImporting(true);

    const formData = new FormData();
    const file = selectedFile ?? fileInputRef.current?.files?.[0];
    if (!file) {
      setImporting(false);
      return;
    }

    formData.append("file", file);
    formData.append("import", "true");
    if (selectedTeamId) {
      formData.append("teamId", selectedTeamId);
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      alert("Fehler beim Import");
    }
    setImporting(false);
  }

  const validCount = results.filter((r) => r.valid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excel-Import</CardTitle>
      </CardHeader>

      <div className="mb-4">
        <a
          href="/api/vorlage"
          className="text-tanne hover:underline text-sm font-medium"
        >
          📥 Vorlage herunterladen
        </a>
      </div>

      {needsTeamSelect && userTeams.length > 0 && (
        <div className="mb-4">
          <Select
            label="Team"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            options={userTeams.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Bitte Team wählen"
          />
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? "border-klee bg-klee/5" : "border-gray-300"
        }`}
      >
        <p className="text-gray-500 mb-3">
          Excel-Datei hierher ziehen oder
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
        >
          Datei wählen
        </Button>
        {fileName && (
          <p className="text-sm text-gray-600 mt-2">📄 {fileName}</p>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-gray-700 mb-3">
            Vorschau: {validCount} von {results.length} Zeilen gültig
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Titel</th>
                  <th className="text-left py-2 px-2">Datum</th>
                  <th className="text-left py-2 px-2">Adresse</th>
                  <th className="text-left py-2 px-2">WK</th>
                  <th className="text-left py-2 px-2">Fehler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r) => (
                  <tr
                    key={r.index}
                    className={r.valid ? "bg-green-50" : "bg-red-50"}
                  >
                    <td className="py-2 px-2">{r.index + 1}</td>
                    <td className="py-2 px-2">
                      <Badge variant={r.valid ? "success" : "danger"}>
                        {r.valid ? "OK" : "Fehler"}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">{String(r.row.titel || "")}</td>
                    <td className="py-2 px-2">{String(r.row.datum || "")}</td>
                    <td className="py-2 px-2">{String(r.row.adresse || "")}</td>
                    <td className="py-2 px-2">{String(r.row.wahlkreis || "")}</td>
                    <td className="py-2 px-2 text-red-600">
                      {r.errors.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleImport}
              disabled={validCount === 0}
              loading={importing}
            >
              {validCount} Aktion{validCount !== 1 ? "en" : ""} importieren
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
