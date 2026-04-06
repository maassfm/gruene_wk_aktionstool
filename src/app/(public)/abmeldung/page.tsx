export default async function AbmeldungPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  const { fehler } = await searchParams;
  const isError = fehler === "1";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0_#005538]">
        {isError ? (
          <>
            <p className="font-headline font-bold text-signal text-2xl uppercase mb-2">
              Abmeldung nicht möglich
            </p>
            <p className="text-black mt-2">
              Der Abmelde-Link ist ungültig oder wurde bereits verwendet.
              Falls du dich von einer Aktion abmelden möchtest, wende dich
              bitte direkt an die Ansprechperson.
            </p>
          </>
        ) : (
          <>
            <p className="font-headline font-bold text-tanne text-2xl uppercase mb-2">
              Erfolgreich abgemeldet
            </p>
            <p className="text-black mt-2">
              Du wurdest erfolgreich von der Aktion abgemeldet.
              Vielen Dank für dein Interesse!
            </p>
          </>
        )}
        <a
          href="/"
          className="mt-6 inline-block text-tanne hover:underline font-bold"
        >
          ← Zurück zur Aktionsübersicht
        </a>
      </div>
    </div>
  );
}
