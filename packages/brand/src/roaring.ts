import type { CompanyEnrichment } from "./types";

const ROARING_API_URL =
  process.env.ROARING_API_URL ?? "https://api.roaring.io";

function useMock(): boolean {
  return (
    process.env.ROARING_MOCK === "true" || !process.env.ROARING_API_KEY?.length
  );
}

// --- Real Roaring.io client ---

async function roaringFetch(path: string): Promise<unknown> {
  const apiKey = process.env.ROARING_API_KEY;
  if (!apiKey) throw new Error("ROARING_API_KEY is not set");

  const res = await fetch(`${ROARING_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Roaring API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function enrichFromRoaring(
  domain: string,
): Promise<CompanyEnrichment | null> {
  // Search by domain
  const searchResult = (await roaringFetch(
    `/se/company/search?domain=${encodeURIComponent(domain)}`,
  )) as { companies?: Array<{ orgNumber?: string }> } | null;

  const orgNumber = searchResult?.companies?.[0]?.orgNumber;
  if (!orgNumber) return null;

  // Fetch full company details
  const company = (await roaringFetch(
    `/se/company/${orgNumber}`,
  )) as Record<string, unknown> | null;

  if (!company) return null;

  const address = company.address as
    | { street?: string; city?: string; zip?: string; country?: string }
    | undefined;

  const boardMembers = (
    (company.boardMembers as Array<{ name?: string }>) ?? []
  )
    .map((m) => m.name)
    .filter((n): n is string => !!n);

  return {
    name: (company.name as string) ?? domain,
    orgNumber,
    industry: company.industryDescription as string | undefined,
    industryCodes: (company.sniCodes as string[]) ?? undefined,
    employeeCount: company.employees as number | undefined,
    revenue: company.revenue as string | undefined,
    location: address?.city ?? undefined,
    address: address
      ? {
          street: address.street,
          city: address.city,
          zip: address.zip,
          country: address.country ?? "SE",
        }
      : undefined,
    ceo: company.ceo as string | undefined,
    boardMembers: boardMembers.length > 0 ? boardMembers : undefined,
    creditRating: company.creditRating as string | undefined,
  };
}

// --- Mock for development ---

const MOCK_COMPANIES: Record<string, CompanyEnrichment> = {
  "planacy.com": {
    name: "Planacy AB",
    orgNumber: "559264-1234",
    industry: "Dataprogrammering",
    industryCodes: ["62010"],
    employeeCount: 45,
    revenue: "32 MSEK",
    location: "Stockholm",
    address: {
      street: "Sveavägen 21",
      city: "Stockholm",
      zip: "111 57",
      country: "SE",
    },
    ceo: "Johan Andersson",
    boardMembers: ["Johan Andersson", "Maria Eriksson", "Lars Svensson"],
    creditRating: "AAA",
  },
  "klarna.com": {
    name: "Klarna Bank AB",
    orgNumber: "556737-0431",
    industry: "Finansförmedling",
    industryCodes: ["64190"],
    employeeCount: 5000,
    revenue: "19 200 MSEK",
    location: "Stockholm",
    address: {
      street: "Sveavägen 46",
      city: "Stockholm",
      zip: "111 34",
      country: "SE",
    },
    ceo: "Sebastian Siemiatkowski",
    boardMembers: [
      "Sebastian Siemiatkowski",
      "Michael Moritz",
      "Sarah McPhee",
    ],
    creditRating: "A",
  },
  "spotify.com": {
    name: "Spotify AB",
    orgNumber: "556703-7485",
    industry: "Dataprogrammering",
    industryCodes: ["62010", "59200"],
    employeeCount: 9800,
    revenue: "131 000 MSEK",
    location: "Stockholm",
    address: {
      street: "Regeringsgatan 19",
      city: "Stockholm",
      zip: "111 53",
      country: "SE",
    },
    ceo: "Daniel Ek",
    boardMembers: ["Daniel Ek", "Martin Lorentzon", "Shishir Mehrotra"],
    creditRating: "AA",
  },
};

function enrichFromMock(domain: string): CompanyEnrichment | null {
  const normalized = domain.replace(/^www\./, "").toLowerCase();

  if (MOCK_COMPANIES[normalized]) {
    return MOCK_COMPANIES[normalized];
  }

  // Unknown domain — return minimal data, let AI determine industry from website content
  const name = normalized.split(".")[0]!;
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name: `${capitalized} AB`,
    orgNumber: `5592${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`,
    // industry intentionally omitted — AI will infer from website content
    employeeCount: Math.floor(10 + Math.random() * 200),
    revenue: `${Math.floor(5 + Math.random() * 100)} MSEK`,
    location: "Stockholm",
  };
}

// --- Public API ---

export async function enrichCompany(
  domain: string,
): Promise<CompanyEnrichment | null> {
  const normalized = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]!
    .toLowerCase();

  if (useMock()) {
    return enrichFromMock(normalized);
  }

  try {
    return await enrichFromRoaring(normalized);
  } catch (error) {
    console.error(
      `Roaring enrichment failed for ${normalized}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
