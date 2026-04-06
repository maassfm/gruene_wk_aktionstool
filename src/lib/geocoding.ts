interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      q: `${address}, Berlin, Germany`,
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": `${process.env.ORG_SHORT_NAME?.replace(/[^a-zA-Z0-9]/g, "") || "GrueneAktionen"}-Wahlkampf-App/1.0`,
        },
      }
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (results.length === 0) return null;

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}

export async function geocodeAddresses(
  addresses: string[]
): Promise<(GeocodingResult | null)[]> {
  const results: (GeocodingResult | null)[] = [];

  for (const address of addresses) {
    const result = await geocodeAddress(address);
    results.push(result);
    // Rate limit: max 1 request per second
    await delay(1100);
  }

  return results;
}
