/**
 * Zentrale Konfiguration für kreisverbandsspezifische Werte.
 * Alle Werte können über Umgebungsvariablen überschrieben werden.
 * Defaults: BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte.
 */

interface WahlkreisConfig {
  nummer: number;
  name: string;
}

function parseWahlkreise(): WahlkreisConfig[] {
  const json = process.env.WAHLKREISE_JSON;
  if (json) {
    try {
      return JSON.parse(json) as WahlkreisConfig[];
    } catch {
      console.error("WAHLKREISE_JSON ist kein gültiges JSON, verwende Defaults");
    }
  }
  return [
    { nummer: 1, name: "Charité, Oranienburger Tor, Zionskirchplatz" },
    { nummer: 2, name: "Alexanderplatz, Engelbecken, Leipziger Platz" },
    { nummer: 3, name: "Südliches Moabit, Hansaviertel, Großer Tiergarten" },
    { nummer: 4, name: "Nördliches Moabit, Westhafen" },
    { nummer: 5, name: "Schillerpark, Rehberge" },
    { nummer: 6, name: "Soldiner Straße, an der Panke entlang" },
    { nummer: 7, name: "Humboldthain, Nettelbeckplatz" },
  ];
}

export const districtConfig = {
  // Organisation
  orgShortName: process.env.NEXT_PUBLIC_ORG_SHORT_NAME || "B90/GRÜNE Berlin-Mitte",
  orgFullName: process.env.ORG_FULL_NAME || "BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte",
  orgLegalName: process.env.ORG_LEGAL_NAME || "BÜNDNIS 90/DIE GRÜNEN Kreisverband Berlin-Mitte",
  orgResponsible: process.env.ORG_RESPONSIBLE || "Kreisvorstand BÜNDNIS 90/DIE GRÜNEN Berlin-Mitte",
  orgSubtitle: process.env.ORG_SUBTITLE || "Kreisvorstand",
  orgTeamNames: process.env.ORG_TEAM_NAMES || "Annalena, Florian, Lara, Linus, Madlen und Timur",

  // Kontakt
  contactEmail: process.env.CONTACT_EMAIL || "info@gruene-mitte.de",
  websiteUrl: process.env.WEBSITE_URL || "www.gruene-mitte.de",
  impressumUrl: process.env.IMPRESSUM_URL || "https://gruene-mitte.de/impressum",

  // Adresse
  addressStreet: process.env.ADDRESS_STREET || "Tegeler Straße 31",
  addressPostalCode: process.env.ADDRESS_POSTAL_CODE || "13353",
  addressCity: process.env.ADDRESS_CITY || "Berlin",

  // Datenschutzbeauftragte*r
  dsbName: process.env.DSB_NAME || "SCO-CON:SULT",
  dsbStreet: process.env.DSB_STREET || "Hauptstraße 27",
  dsbPostalCode: process.env.DSB_POSTAL_CODE || "53604",
  dsbCity: process.env.DSB_CITY || "Bad Honnef",
  dsbEmail: process.env.DSB_EMAIL || "datenschutz@gruene-berlin.de",
  dsbPhone: process.env.DSB_PHONE || "02224/988290",

  // Aufsichtsbehörde
  aufsichtName: process.env.AUFSICHT_NAME || "Berliner Beauftragte für Datenschutz und Informationsfreiheit",
  aufsichtStreet: process.env.AUFSICHT_STREET || "Alt-Moabit 59–61",
  aufsichtPostalCode: process.env.AUFSICHT_POSTAL_CODE || "10555",
  aufsichtCity: process.env.AUFSICHT_CITY || "Berlin",
  aufsichtPhone: process.env.AUFSICHT_PHONE || "030 / 138 89-0",
  aufsichtEmail: process.env.AUFSICHT_EMAIL || "mailbox@datenschutz-berlin.de",
  aufsichtUrl: process.env.AUFSICHT_URL || "https://www.datenschutz-berlin.de",

  // Auftragsverarbeiter
  hostingProvider: process.env.HOSTING_PROVIDER || "Hetzner Online GmbH",
  hostingAddress: process.env.HOSTING_ADDRESS || "Industriestr. 25, 91710 Gunzenhausen",
  hostingLocation: process.env.HOSTING_LOCATION || "Deutschland",
  hostingPrivacyUrl: process.env.HOSTING_PRIVACY_URL || "https://www.hetzner.com/de/legal/privacy-policy",
  emailProvider: process.env.EMAIL_PROVIDER || "Verdigado eG",
  emailProviderPrivacyUrl: process.env.EMAIL_PROVIDER_PRIVACY_URL || "https://www.verdigado.com/datenschutz",

  // Sonstiges
  datenschutzStand: process.env.DATENSCHUTZ_STAND || "März 2026",
  accountDeletionDate: process.env.ACCOUNT_DELETION_DATE || "31. Oktober 2026",

  // Wahlkreise
  wahlkreise: parseWahlkreise(),
};

export function getWahlkreisCount(): number {
  return districtConfig.wahlkreise.length;
}
