import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { districtConfig } from "../src/lib/district-config";

const prisma = new PrismaClient();

async function main() {
  // Wahlkreise (aus district-config)
  const wahlkreise = districtConfig.wahlkreise;

  const createdWahlkreise = [];
  for (const wk of wahlkreise) {
    const created = await prisma.wahlkreis.upsert({
      where: { nummer: wk.nummer },
      update: { name: wk.name },
      create: wk,
    });
    createdWahlkreise.push(created);
  }

  console.log(`${createdWahlkreise.length} Wahlkreise angelegt`);

  // Team
  const team = await prisma.team.upsert({
    where: { id: "seed-team-1" },
    update: {},
    create: {
      id: "seed-team-1",
      name: "Team Mitte",
      wahlkreisId: createdWahlkreise[0].id,
    },
  });

  const bezirksTeam = await prisma.team.upsert({
    where: { id: "seed-team-bezirk" },
    update: {},
    create: {
      id: "seed-team-bezirk",
      name: "Bezirksteam BVV",
      wahlkreisId: null,
    },
  });

  console.log(`Teams angelegt: ${team.name}, ${bezirksTeam.name}`);

  // Admin user
  const hashedPassword = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@gruene-mitte.de" },
    update: {},
    create: {
      email: "admin@gruene-mitte.de",
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Expert user
  const expertPassword = await bcrypt.hash("expert1234", 12);
  const expert = await prisma.user.upsert({
    where: { email: "expert@gruene-mitte.de" },
    update: {},
    create: {
      email: "expert@gruene-mitte.de",
      password: expertPassword,
      name: "Expert Testperson",
      role: "EXPERT",
    },
  });

  // Assign expert to team via UserTeam
  await prisma.userTeam.upsert({
    where: { userId_teamId: { userId: expert.id, teamId: team.id } },
    update: {},
    create: { userId: expert.id, teamId: team.id },
  });

  console.log(`User angelegt: ${admin.email} (Admin), ${expert.email} (Expert)`);

  // Test-Aktionen
  const aktionen = [
    {
      titel: "Infostand Alexanderplatz",
      datum: new Date("2026-04-15"),
      startzeit: "10:00",
      endzeit: "13:00",
      adresse: "Alexanderplatz 1, 10178 Berlin",
      latitude: 52.5219,
      longitude: 13.4132,
      wahlkreisId: createdWahlkreise[0].id,
      ansprechpersonName: "Max Mustermann",
      ansprechpersonEmail: "max@gruene-mitte.de",
      ansprechpersonTelefon: "030 1234567",
      maxTeilnehmer: 8,
      createdById: expert.id,
      teamId: team.id,
    },
    {
      titel: "Haustürwahlkampf Moabit",
      datum: new Date("2026-04-18"),
      startzeit: "15:00",
      endzeit: "18:00",
      adresse: "Turmstraße 75, 10551 Berlin",
      latitude: 52.5264,
      longitude: 13.3432,
      wahlkreisId: createdWahlkreise[1].id,
      ansprechpersonName: "Erika Musterfrau",
      ansprechpersonEmail: "erika@gruene-mitte.de",
      ansprechpersonTelefon: "030 7654321",
      maxTeilnehmer: null,
      createdById: expert.id,
      teamId: team.id,
    },
    {
      titel: "Plakate kleben Wedding",
      datum: new Date("2026-04-20"),
      startzeit: "09:00",
      endzeit: "12:00",
      adresse: "Müllerstraße 56, 13349 Berlin",
      latitude: 52.5497,
      longitude: 13.3594,
      wahlkreisId: createdWahlkreise[3].id,
      ansprechpersonName: "Max Mustermann",
      ansprechpersonEmail: "max@gruene-mitte.de",
      ansprechpersonTelefon: "030 1234567",
      maxTeilnehmer: 5,
      createdById: expert.id,
      teamId: team.id,
    },
  ];

  for (const aktion of aktionen) {
    await prisma.aktion.create({ data: aktion });
  }

  console.log(`${aktionen.length} Test-Aktionen angelegt`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
