import { format } from "date-fns";
import { de } from "date-fns/locale";
import { districtConfig } from "@/lib/district-config";

interface AktionInfo {
  titel: string;
  datum: Date;
  startzeit: string;
  endzeit: string;
  adresse: string;
  ansprechpersonName: string;
  ansprechpersonEmail: string;
  ansprechpersonTelefon: string;
}

const baseUrl = process.env.NEXTAUTH_URL ?? "https://aktionen.gruene-mitte.de";

function baseLayout(content: string, accentBar?: string): string {
  const accent = accentBar ?? "#005538";
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #FFFFFF; color: #000000; }
    .container { max-width: 600px; width: 100%; background: #FFFFFF; border: 3px solid #000000; }
    .header { background-color: #005538; padding: 24px 32px; border-bottom: 3px solid #000000; }
    .header h1 { color: #FFFFFF; font-size: 20px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; line-height: 1.2; }
    .header .subtitle { color: #FFF17A; font-size: 16px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700; }
    .content { padding: 32px; text-align: left; }
    .content p { font-size: 16px; line-height: 1.6; margin: 0 0 12px 0; text-align: left; }
    .content h2 { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 20px 0; border-bottom: 3px solid #000000; padding-bottom: 8px; }
    .content h3 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 24px 0 8px 0; }
    .content ul { margin: 0 0 16px 0; padding-left: 20px; }
    .content li { font-size: 15px; line-height: 1.6; margin-bottom: 4px; }
    .content a { color: #005538; font-weight: 700; text-decoration: underline; }
    .aktion-card { background: #FFFFFF; border: 2px solid #000000; padding: 20px; margin-bottom: 16px; box-shadow: 4px 4px 0 #000000; }
    .aktion-card-title { font-size: 17px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 12px 0; color: #000000; border-bottom: 2px solid #000000; padding-bottom: 8px; }
    .aktion-card p { margin: 5px 0; font-size: 15px; color: #000000; line-height: 1.5; text-align: left; }
    .aktion-card a { color: #005538; font-weight: 700; }
    .aktion-card .cancel-link { display: inline-block; margin-top: 12px; font-size: 15px; color: #e63946; text-decoration: underline; font-weight: 700; }
    .change-row { border: 2px solid #000000; padding: 12px 16px; margin-bottom: 8px; background: #FFFFFF; }
    .change-row strong { font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.08em; display: block; margin-bottom: 4px; }
    .change-old { background: #262626; color: #FFFFFF; padding: 2px 6px; font-size: 14px; font-weight: 700; border: 1px solid #000000;display: inline-block; }
    .change-arrow { font-size: 18px; font-weight: 700; margin: 0 6px; }
    .change-new { background: #FFF17A; color: #000000; padding: 2px 6px; font-size: 14px; font-weight: 700; border: 1px solid #000000; display: inline-block; }
    .cta-button { display: inline-block; background-color: #005538; color: #FFFFFF; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; font-size: 14px; padding: 12px 24px; text-decoration: none; border: 2px solid #000000; box-shadow: 3px 3px 0 #000000; margin-top: 8px; }
    .greeting { font-size: 24px; font-weight: 700; margin: 0 0 16px 0; text-align: left; }
    .section-divider { border: none; border-top: 3px solid #000000; margin: 24px 0; }
    .badge-geaendert { background: #FFF17A; color: #000000; border: 1px solid #000000; padding: 2px 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: inline-block; }
    .badge-absage { background: #E6007E; color: #FFFFFF; border: 1px solid #000000; padding: 2px 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: inline-block; }
    .count-badge { background: #005538; color: #FFFFFF; border: 1px solid #000000; padding: 2px 8px; font-size: 12px; font-weight: 700; display: inline-block; }
    .footer { background-color: #000000; padding: 20px 32px; font-size: 12px; color: #FFFFFF; }
    .footer p { margin: 4px 0; line-height: 1.5; }
    .footer a { color: #FFF17A; text-decoration: none; font-weight: 700; }
    .footer-links { margin-top: 8px; }
    .footer-separator { color: #555555; margin: 0 8px; }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td align="center" style="padding: 24px 16px; background-color: #ffffff;">
  <div class="container">
      <div class="header">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="64" valign="middle" style="padding-right: 16px;">
              <img src="${baseUrl}/logo_white.png" alt="Sonnenblume" width="48" height="48" style="display:block; border:0;" />
            </td>
            <td valign="middle">
              <p class="subtitle" style="color: #FFF17A; font-size: 16px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">${districtConfig.orgSubtitle}</p>
              <h1 style="color: #FFFFFF; font-size: 20px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; line-height: 1.2;">${districtConfig.orgShortName}</h1>
            </td>
          </tr>
        </table>
      </div>
      <div class="content" style="text-align: left;">
        ${content}
      </div>
      <div class="footer">
        <p>${districtConfig.orgFullName}</p>
        <p>Diese E-Mail wurde automatisch versendet. Bitte antworte nicht auf diese E-Mail.</p>
        <div class="footer-links">
          <a href="${baseUrl}/datenschutz">Datenschutzerklärung</a><span class="footer-separator">·</span><a href="${districtConfig.impressumUrl}">Impressum</a>
        </div>
      </div>
    </div>
  </td></tr>
  </table>
</body>
</html>`;
}

function formatAktionCard(aktion: AktionInfo, cancelLink?: string): string {
  const datumStr = format(aktion.datum, "EEEE, d. MMMM yyyy", { locale: de });
  return `<div class="aktion-card">
    <div class="aktion-card-title">${aktion.titel}</div>
    <p>📅 ${datumStr}</p>
    <p>🕐 ${aktion.startzeit} – ${aktion.endzeit} Uhr</p>
    <p>📍 ${aktion.adresse}</p>
    <p>👋 Ansprechpartner*in: ${aktion.ansprechpersonName} · <a href="mailto:${aktion.ansprechpersonEmail}">${aktion.ansprechpersonEmail}</a> · ${aktion.ansprechpersonTelefon}</p>
    ${cancelLink ? `<p><a href="${cancelLink}" class="cancel-link">❌ Von dieser Aktion abmelden →</a></p>` : ""}
  </div>`;
}

export function anmeldebestaetigungEmail(
  vorname: string,
  email: string,
  aktionen: AktionInfo[],
  cancelTokens?: string[]
): { subject: string; html: string } {
  const subject = `Deine Anmeldung bei ${districtConfig.orgShortName} – ${aktionen.length} Aktion${aktionen.length > 1 ? "en" : ""}`;

  const content = `
    <p class="greeting">Hallo ${vorname},</p>
    <p>vielen Dank für Deine Anmeldung und Deine Unterstützung im Wahlkampf.</p>
    <p>Wenn sich Deine Pläne ändern, kannst Du Dich jederzeit über den Link in der jeweiligen Aktion von der Teilnahme abmelden.</p>
    <p>Wir freuen uns auf Dich! 💚</p>
    <p>Viele Grüße<br>
    <strong>${districtConfig.orgTeamNames}</strong><br>
    ${districtConfig.orgResponsible}</p>
    <hr class="section-divider" />
    <p>Du kannst Dir jederzeit eine Übersicht aller Aktionen, für die Du angemeldet bist, per E-Mail zusenden lassen: <a href="${baseUrl}/meine-aktionen-bestaetigen?email=${encodeURIComponent(email)}">Meine Anmeldungen per E-Mail anfordern →</a></p>
    <p>Du hast Dich für ${aktionen.length > 1 ? "folgende Aktionen" : "folgende Aktion"} angemeldet:</p>
    ${aktionen.map((a, i) => {
    const cancelLink = cancelTokens?.[i]
      ? `${baseUrl}/api/anmeldungen/abmelden?token=${cancelTokens[i]}`
      : undefined;
    return formatAktionCard(a, cancelLink);
  }).join("")}
  `;

  return { subject, html: baseLayout(content) };
}

export function aenderungsEmail(
  aktion: AktionInfo,
  changes: { field: string; oldValue: string; newValue: string }[],
  cancelToken?: string
): { subject: string; html: string } {
  const subject = `Änderung an Wahlkampfaktion: ${aktion.titel}`;
  const cancelLink = cancelToken
    ? `${baseUrl}/api/anmeldungen/abmelden?token=${cancelToken}`
    : undefined;

  const changesList = changes
    .map(
      (c) =>
        `<div class="change-row">
          <strong>${c.field}</strong>
          <span class="change-old">${c.oldValue}</span>
          <span class="change-arrow">→</span>
          <span class="change-new">${c.newValue}</span>
        </div>`
    )
    .join("");

  const content = `
    <span class="badge-geaendert">Geändert</span>
    <h2 style="margin-top: 12px;">Änderung an deiner Aktion</h2>
    <p>Eine Aktion, für die Du Dich angemeldet hast, wurde geändert:</p>
    ${changesList}
    <hr class="section-divider" />
    <h3>Aktualisierte Details</h3>
    ${formatAktionCard(aktion, cancelLink)}
    <p>Bei Fragen wende Dich bitte an die Ansprechperson der Aktion.</p>
  `;

  return { subject, html: baseLayout(content, "#FFF17A") };
}

export function absageEmail(aktion: AktionInfo): { subject: string; html: string } {
  const datumStr = format(aktion.datum, "d. MMMM yyyy", { locale: de });
  const subject = `Absage: ${aktion.titel} am ${datumStr}`;

  const content = `
    <span class="badge-absage">Abgesagt</span>
    <h2 style="margin-top: 12px;">Aktion abgesagt</h2>
    <p>Leider wurde die folgende Aktion abgesagt:</p>
    ${formatAktionCard(aktion)}
    <hr class="section-divider" />
    <p>Wir bedauern die Unannehmlichkeiten. Schau gerne auf <a href="${baseUrl}">unserer Seite</a> nach weiteren Aktionen, bei denen Du mitmachen kannst!</p>
  `;

  return { subject, html: baseLayout(content, "#E6007E") };
}

interface AktionInfoWithToken extends AktionInfo {
  cancelToken?: string;
}

export function meineAktionenEmail(
  aktionen: AktionInfoWithToken[]
): { subject: string; html: string } {
  const subject = `Deine Anmeldungen bei ${districtConfig.orgShortName}`;

  const aktionenHtml = aktionen.length > 0
    ? `
      <p>Du bist aktuell für folgende ${aktionen.length > 1 ? "Aktionen" : "Aktion"} angemeldet:</p>
      ${aktionen.map((a) => {
      const cancelLink = a.cancelToken
        ? `${baseUrl}/api/anmeldungen/abmelden?token=${a.cancelToken}`
        : undefined;
      return formatAktionCard(a, cancelLink);
    }).join("")}
    `
    : `<p>Du hast aktuell keine offenen Anmeldungen.</p>`;

  const content = `
    <h2>Deine Anmeldungen</h2>
    <p>Du hast eine Übersicht Deiner Anmeldungen angefordert.</p>
    ${aktionenHtml}
    <hr class="section-divider" />
    <p>Bei Fragen wende Dich gerne an uns.</p>
  `;

  return { subject, html: baseLayout(content) };
}

export function erinnerungsEmail(
  vorname: string,
  aktionen: (AktionInfo & { cancelToken?: string | null })[],
): { subject: string; html: string } {
  const subject = `Erinnerung: Deine Aktionen morgen – ${districtConfig.orgShortName}`;

  const content = `
    <p class="greeting">Hallo ${vorname},</p>
    <p>morgen ist es soweit! Morgen ${aktionen.length > 1 ? "finden folgenden Aktionen" : "findet folgende Aktion"} statt:</p>
    ${aktionen.map((a) => {
    const cancelLink = a.cancelToken
      ? `${baseUrl}/api/anmeldungen/abmelden?token=${a.cancelToken}`
      : undefined;
    return formatAktionCard(a, cancelLink);
  }).join("")}
    <hr class="section-divider" />
    <p>Falls Du doch nicht kommen kannst, melde Dich bitte rechtzeitig über den Abmelde-Link in der jeweiligen Aktion ab und schreibe der Ansprechpartner*in eine kurze Nachricht.</p>
    <p>Viele Grüße<br>
    <strong>${districtConfig.orgTeamNames}</strong><br>
    ${districtConfig.orgResponsible}</p>
  `;

  return { subject, html: baseLayout(content) };
}

interface TagesAnmeldung {
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string | null;
  signalName?: string | null;
}

interface TagesAktion {
  titel: string;
  datum: Date;
  startzeit: string;
  anmeldungen: TagesAnmeldung[];
}

interface MorgenAktion {
  titel: string;
  datum: Date;
  startzeit: string;
  endzeit: string;
  adresse: string;
  anmeldungen: TagesAnmeldung[];
}

interface TagesAbmeldung {
  vorname: string;
  nachname: string;
  aktionTitel: string;
  aktionDatum: Date;
}

export function tagesUebersichtEmail(
  expertName: string,
  datum: Date,
  aktionen: TagesAktion[],
  aktionenMorgen: MorgenAktion[] = [],
  abmeldungen: TagesAbmeldung[] = []
): { subject: string; html: string } {
  const datumStr = format(datum, "d. MMMM yyyy", { locale: de });
  const subject = `Neue Anmeldungen – Tagesübersicht ${datumStr}`;

  const morgenHtml = aktionenMorgen.length > 0
    ? `
      <h2>Morgen findet statt</h2>
      ${aktionenMorgen.map((a) => {
      const aktionDatum = format(a.datum, "EEEE, d. MMMM", { locale: de });
      const anmeldungenList = a.anmeldungen.length > 0
        ? `<ul>${a.anmeldungen.map((an) => {
          const kontakt = an.signalName
            ? `Signal: ${an.signalName}`
            : an.telefon || "";
          return `<li>${an.vorname} ${an.nachname} · ${an.email}${kontakt ? ` · ${kontakt}` : ""}</li>`;
        }).join("")}</ul>`
        : `<p><em>Noch keine Anmeldungen.</em></p>`;
      return `
          <div class="aktion-card">
            <div class="aktion-card-title">${a.titel}</div>
            <p>📅 ${aktionDatum}, ${a.startzeit}–${a.endzeit} Uhr</p>
            <p>📍 ${a.adresse}</p>
            <p><span class="count-badge">${a.anmeldungen.length} Anmeldung${a.anmeldungen.length !== 1 ? "en" : ""}</span></p>
            ${anmeldungenList}
          </div>
        `;
    }).join("")}
    `
    : "";

  const neueAnmeldungenHtml = aktionen.length > 0
    ? `
      <h2>Neue Anmeldungen heute</h2>
      ${aktionen.map((a) => {
      const anmeldungenList = a.anmeldungen
        .map((an) => {
          const kontakt = an.signalName
            ? `Signal: ${an.signalName}`
            : an.telefon || "";
          return `<li>${an.vorname} ${an.nachname} · ${an.email}${kontakt ? ` · ${kontakt}` : ""}</li>`;
        })
        .join("");
      const aktionDatum = format(a.datum, "d. MMMM", { locale: de });
      return `
          <div class="aktion-card">
            <div class="aktion-card-title">${a.titel}</div>
            <p>📅 ${aktionDatum}, ${a.startzeit} Uhr</p>
            <p><span class="count-badge">${a.anmeldungen.length} neu</span></p>
            <ul>${anmeldungenList}</ul>
          </div>
        `;
    }).join("")}
    `
    : "";

  const abmeldungenHtml = abmeldungen.length > 0
    ? `
      <h2>Abmeldungen heute</h2>
      <ul>
        ${abmeldungen.map((a) => {
      const aktionDatum = format(a.aktionDatum, "d. MMMM", { locale: de });
      return `<li>${a.vorname} ${a.nachname} — ${a.aktionTitel} (${aktionDatum})</li>`;
    }).join("")}
      </ul>
    `
    : "";

  const content = `
    <p class="greeting">Hallo ${expertName}!</p>
    <p>Tagesübersicht für <strong>${datumStr}</strong>.</p>
    ${morgenHtml}
    ${morgenHtml && (neueAnmeldungenHtml || abmeldungenHtml) ? '<hr class="section-divider" />' : ""}
    ${neueAnmeldungenHtml}
    ${neueAnmeldungenHtml && abmeldungenHtml ? '<hr class="section-divider" />' : ""}
    ${abmeldungenHtml}
    <hr class="section-divider" />
    <p><a href="${baseUrl}/dashboard" class="cta-button" style="display:inline-block;background-color:#005538;color:#FFFFFF;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;font-size:14px;padding:12px 24px;text-decoration:none;border:2px solid #000000;box-shadow:3px 3px 0 #000000;margin-top:8px;">Zum Dashboard →</a></p>
  `;

  return { subject, html: baseLayout(content) };
}
