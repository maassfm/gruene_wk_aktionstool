import ExcelJS from "exceljs";

export function formatSignalInfo(
  datumMitTag: string,
  startzeit: string,
  endzeit: string,
  titel: string,
  adresse: string,
  ansprechpersonName: string
): string {
  return `📆 ${datumMitTag}: ${startzeit}-${endzeit} Uhr 📢 ${titel} 📍${adresse} 👋 mit ${ansprechpersonName}`;
}

interface ExcelRow {
  titel: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  adresse: string;
  wahlkreis: number;
  ansprechpersonName: string;
  ansprechpersonEmail: string;
  ansprechpersonTelefon: string;
  maxTeilnehmer?: number | null;
}

const COLUMN_MAP: Record<string, keyof ExcelRow> = {
  "Titel": "titel",
  "Datum": "datum",
  "Startzeit": "startzeit",
  "Endzeit": "endzeit",
  "Adresse": "adresse",
  "Wahlkreis": "wahlkreis",
  "Ansprechperson Name": "ansprechpersonName",
  "Ansprechperson E-Mail": "ansprechpersonEmail",
  "Ansprechperson Telefon": "ansprechpersonTelefon",
  "Max. Teilnehmer": "maxTeilnehmer",
};

function formatDate(value: ExcelJS.CellValue): string {
  if (value instanceof Date) {
    const d = String(value.getDate()).padStart(2, "0");
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const y = value.getFullYear();
    return `${d}.${m}.${y}`;
  }
  return String(value ?? "").trim();
}

function formatTime(value: ExcelJS.CellValue): string {
  if (value instanceof Date) {
    const h = String(value.getUTCHours()).padStart(2, "0");
    const min = String(value.getUTCMinutes()).padStart(2, "0");
    return `${h}:${min}`;
  }
  return String(value ?? "").trim();
}

export function convertDatumToISO(datum: string): string {
  // TT.MM.JJJJ → YYYY-MM-DD
  const match = datum.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return datum; // already ISO or unknown format
}

export async function parseExcelFile(buffer: ArrayBuffer): Promise<ExcelRow[]> {
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(Buffer.from(buffer) as any);
  const sheet = workbook.worksheets[0];

  const headers: string[] = [];
  sheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
    headers.push(String(cell.value ?? "").trim());
  });

  const rows: ExcelRow[] = [];
  sheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
    if (rowNumber === 1) return;
    const partial: Partial<ExcelRow> = {};

    row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => {
      const header = headers[colNumber - 1];
      const key = COLUMN_MAP[header];
      if (!key) return;

      const value = cell.value;
      if (key === "datum") {
        partial.datum = formatDate(value);
      } else if (key === "startzeit" || key === "endzeit") {
        partial[key] = formatTime(value);
      } else if (key === "wahlkreis") {
        partial.wahlkreis = parseInt(String(value ?? ""), 10);
      } else if (key === "maxTeilnehmer") {
        const num = parseInt(String(value ?? ""), 10);
        partial.maxTeilnehmer = isNaN(num) ? null : num;
      } else {
        let strVal: string;
        if (
          value !== null &&
          typeof value === "object" &&
          "text" in value &&
          "hyperlink" in value
        ) {
          // ExcelJS CellHyperlinkValue: Excel erstellt mailto-Links für E-Mail-Adressen
          const hyperlink = String((value as { hyperlink: string }).hyperlink);
          strVal = hyperlink.startsWith("mailto:")
            ? hyperlink.slice("mailto:".length)
            : String((value as { text: string }).text);
        } else {
          strVal = String(value ?? "");
        }
        (partial as Record<string, unknown>)[key] = strVal.trim();
      }
    });

    rows.push(partial as ExcelRow);
  });

  return rows;
}

interface AnmeldungExport {
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string | null;
  signalName?: string | null;
  aktionTitel: string;
  aktionDatum: string;
  aktionOrt: string;
  aktionDatumMitTag: string;
  aktionStartzeit: string;
  aktionEndzeit: string;
  aktionAnsprechpersonName: string;
}

export async function createAnmeldungenExcel(anmeldungen: AnmeldungExport[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Anmeldungen");

  sheet.columns = [
    { header: "Vorname", key: "vorname", width: 15 },
    { header: "Nachname", key: "nachname", width: 15 },
    { header: "E-Mail", key: "email", width: 30 },
    { header: "Telefon", key: "telefon", width: 20 },
    { header: "Signal", key: "signal", width: 20 },
    { header: "Aktion", key: "aktion", width: 30 },
    { header: "Datum", key: "datum", width: 12 },
    { header: "Ort", key: "ort", width: 40 },
    { header: "Signal-Info", key: "signalInfo", width: 70 },
  ];

  for (const a of anmeldungen) {
    sheet.addRow({
      vorname: a.vorname,
      nachname: a.nachname,
      email: a.email,
      telefon: a.telefon || "",
      signal: a.signalName || "",
      aktion: a.aktionTitel,
      datum: a.aktionDatum,
      ort: a.aktionOrt,
      signalInfo: formatSignalInfo(a.aktionDatumMitTag, a.aktionStartzeit, a.aktionEndzeit, a.aktionTitel, a.aktionOrt, a.aktionAnsprechpersonName),
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function createAnmeldungenTxt(anmeldungen: AnmeldungExport[]): string {
  return anmeldungen
    .map((a) => {
      const kontakt = a.signalName
        ? `Signal: ${a.signalName}`
        : a.telefon
        ? `Tel: ${a.telefon}`
        : "";
      return `${a.vorname} ${a.nachname}${kontakt ? ` – ${kontakt}` : ""}`;
    })
    .join("\n");
}

export interface AktionExport {
  titel: string;
  datum: string;
  datumMitTag: string;
  startzeit: string;
  endzeit: string;
  adresse: string;
  wahlkreis: string;
  team: string;
  status: string;
  anmeldungen: number;
  maxTeilnehmer?: number | null;
  ansprechpersonName: string;
}

export async function createAktionenExcel(aktionen: AktionExport[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Aktionen");

  sheet.columns = [
    { header: "Titel", key: "titel", width: 30 },
    { header: "Datum", key: "datum", width: 12 },
    { header: "Startzeit", key: "startzeit", width: 10 },
    { header: "Endzeit", key: "endzeit", width: 10 },
    { header: "Adresse", key: "adresse", width: 40 },
    { header: "Wahlkreis", key: "wahlkreis", width: 10 },
    { header: "Team", key: "team", width: 20 },
    { header: "Status", key: "status", width: 12 },
    { header: "Anmeldungen", key: "anmeldungen", width: 14 },
    { header: "Max. Teilnehmer", key: "maxTeilnehmer", width: 15 },
  ];

  for (const a of aktionen) {
    sheet.addRow({
      titel: a.titel,
      datum: a.datum,
      startzeit: a.startzeit,
      endzeit: a.endzeit,
      adresse: a.adresse,
      wahlkreis: a.wahlkreis,
      team: a.team,
      status: a.status,
      anmeldungen: a.anmeldungen,
      maxTeilnehmer: a.maxTeilnehmer ?? "",
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function createAktionenTxt(aktionen: AktionExport[]): string {
  return aktionen
    .map((a) => formatSignalInfo(a.datumMitTag, a.startzeit, a.endzeit, a.titel, a.adresse, a.ansprechpersonName))
    .join("\n");
}

export interface AuswertungData {
  totalAktionen: number;
  totalAnmeldungenGesamt: number;
  upcomingAktionen: number;
  pastAktionen: number;
  abgesagteAktionen: number;
  anmeldungenByWahlkreis: { wahlkreis: string; nummer: number; count: number }[];
  staendeByTeam: { team: string; count: number }[];
  anmeldungenByTeam: { team: string; count: number }[];
  byKalenderwoche: { kw: number; year: number; staende: number; anmeldungen: number }[];
}

export async function createAuswertungExcel(data: AuswertungData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Zusammenfassung
  const summary = workbook.addWorksheet("Zusammenfassung");
  summary.columns = [
    { header: "Kennzahl", key: "kennzahl", width: 30 },
    { header: "Wert", key: "wert", width: 12 },
  ];
  summary.addRows([
    { kennzahl: "Aktionen gesamt", wert: data.totalAktionen },
    { kennzahl: "Anmeldungen gesamt", wert: data.totalAnmeldungenGesamt },
    { kennzahl: "Bevorstehende Veranstaltungen", wert: data.upcomingAktionen },
    { kennzahl: "Vergangene Veranstaltungen", wert: data.pastAktionen },
    { kennzahl: "Abgesagte Veranstaltungen", wert: data.abgesagteAktionen },
  ]);

  // Sheet 2: Anmeldungen nach Wahlkreis
  const wkSheet = workbook.addWorksheet("Anmeldungen nach Wahlkreis");
  wkSheet.columns = [
    { header: "Nr.", key: "nummer", width: 6 },
    { header: "Wahlkreis", key: "wahlkreis", width: 30 },
    { header: "Anmeldungen", key: "anmeldungen", width: 14 },
  ];
  for (const wk of data.anmeldungenByWahlkreis) {
    wkSheet.addRow({ nummer: wk.nummer, wahlkreis: wk.wahlkreis, anmeldungen: wk.count });
  }

  // Sheet 3: Nach Team
  const teamSheet = workbook.addWorksheet("Nach Team");
  teamSheet.columns = [
    { header: "Team", key: "team", width: 30 },
    { header: "Stände", key: "staende", width: 10 },
    { header: "Anmeldungen", key: "anmeldungen", width: 14 },
  ];
  const anmeldungenTeamMap = new Map(data.anmeldungenByTeam.map((t) => [t.team, t.count]));
  for (const t of data.staendeByTeam) {
    teamSheet.addRow({
      team: t.team,
      staende: t.count,
      anmeldungen: anmeldungenTeamMap.get(t.team) ?? 0,
    });
  }

  // Sheet 4: Nach Kalenderwoche
  const kwSheet = workbook.addWorksheet("Nach Kalenderwoche");
  kwSheet.columns = [
    { header: "KW", key: "kw", width: 6 },
    { header: "Jahr", key: "year", width: 8 },
    { header: "Stände", key: "staende", width: 10 },
    { header: "Anmeldungen", key: "anmeldungen", width: 14 },
  ];
  for (const kw of data.byKalenderwoche) {
    kwSheet.addRow({ kw: kw.kw, year: kw.year, staende: kw.staende, anmeldungen: kw.anmeldungen });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function createVorlageExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Aktionen");

  sheet.columns = [
    { header: "Titel", key: "titel", width: 30 },
    { header: "Datum", key: "datum", width: 12 },
    { header: "Startzeit", key: "startzeit", width: 10 },
    { header: "Endzeit", key: "endzeit", width: 10 },
    { header: "Adresse", key: "adresse", width: 40 },
    { header: "Wahlkreis", key: "wahlkreis", width: 10 },
    { header: "Ansprechperson Name", key: "ansprechpersonName", width: 20 },
    { header: "Ansprechperson E-Mail", key: "ansprechpersonEmail", width: 25 },
    { header: "Ansprechperson Telefon", key: "ansprechpersonTelefon", width: 20 },
    { header: "Max. Teilnehmer", key: "maxTeilnehmer", width: 15 },
  ];

  sheet.getColumn("datum").style = { numFmt: "DD.MM.YYYY" };
  sheet.getColumn("startzeit").style = { numFmt: "HH:MM" };
  sheet.getColumn("endzeit").style = { numFmt: "HH:MM" };

  sheet.addRow({
    titel: "Infostand Alexanderplatz",
    datum: new Date(2026, 3, 15),
    startzeit: new Date(Date.UTC(1899, 11, 30, 10, 0)),
    endzeit: new Date(Date.UTC(1899, 11, 30, 13, 0)),
    adresse: "Alexanderplatz 1, 10178 Berlin",
    wahlkreis: 1,
    ansprechpersonName: "Max Mustermann",
    ansprechpersonEmail: "max@example.com",
    ansprechpersonTelefon: "030 1234567",
    maxTeilnehmer: "",
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
