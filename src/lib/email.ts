import nodemailer from "nodemailer";
import { prisma } from "./db";
import type { EmailTyp } from "@prisma/client";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || "aktionen@gruene-mitte.de";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Kreisvorstand B90/GRÜNE Berlin-Mitte";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  typ: EmailTyp;
  aktionId?: string;
}

export async function sendEmail({ to, subject, html, typ, aktionId }: SendEmailParams) {
  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    await prisma.emailLog.create({
      data: {
        typ,
        empfaengerEmail: to,
        aktionId: aktionId || null,
        status: "GESENDET",
      },
    });

    return true;
  } catch (err) {
    await prisma.emailLog.create({
      data: {
        typ,
        empfaengerEmail: to,
        aktionId: aktionId || null,
        status: `FEHLER: ${err instanceof Error ? err.message : "Unbekannter Fehler"}`,
      },
    });
    return false;
  }
}
