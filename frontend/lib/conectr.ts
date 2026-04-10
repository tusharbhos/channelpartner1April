export const CONECTR_API =
  process.env.NEXT_PUBLIC_CONECTR_API ?? "https://conectr.biz/api";
export const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ?? "https://conectr.biz/storage";

export type NamedOption = { id?: number; name: string; value?: string };

export type ApiUnit = {
  unit_type?: string | null;
  area_min?: number | null;
  area_max?: number | null;
  price_min?: string | number | null;
  price_max?: string | number | null;
  available_units?: number | null;
};

export type ApiEntity = {
  id?: number;
  name?: string | null;
};

export type ApiProject = {
  id: number;
  title?: string | null;
  developer?: string | null;
  location?: string | null;
  subtitle?: string | null;
  background_image_mobile?: string | null;
  background_image_desktop?: string | null;
  main_logo?: string | null;
  development_status?: string | null;
  best_suited?: string | null;
  possession_date?: string | null;
  available_units?: number | null;
  categories?: ApiEntity[];
  tags?: ApiEntity[];
  amenities?: ApiEntity[];
  units?: ApiUnit[];
};

export type MetaFilter = {
  key: string;
  label?: string;
  type?: string;
  options?: NamedOption[];
  min?: number | string;
  max?: number | string;
};

export type MetaResponse = {
  filters?: MetaFilter[];
};

export type PaginatedProjectsResponse = {
  data?: ApiProject[];
  next_page_url?: string | null;
  total?: number;
};

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const cleaned =
    typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalize(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function mediaUrl(path: string | null | undefined): string | null {
  const cleaned = normalize(path);
  if (!cleaned) return null;
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }
  return `${STORAGE_URL}/${cleaned}`;
}

export function toCardPrice(project: ApiProject): string {
  const units = project.units ?? [];
  const mins = units
    .map((unit) => toNumber(unit.price_min))
    .filter((value) => value > 0);
  const maxs = units
    .map((unit) => toNumber(unit.price_max))
    .filter((value) => value > 0);

  if (!mins.length && !maxs.length) return "Price on request";
  const min = mins.length ? Math.min(...mins) : Math.min(...maxs);
  const max = maxs.length ? Math.max(...maxs) : min;

  const format = (value: number) => {
    if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)} L`;
    return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
  };

  return min === max ? format(min) : `${format(min)} - ${format(max)}`;
}

export function toStatusLabel(status: string): string {
  const lowered = status.toLowerCase();
  if (lowered === "under_construction") return "Under Construction";
  if (lowered === "ready") return "Ready";
  return status || "Unknown";
}

export async function fetchAllProjects(): Promise<{
  projects: ApiProject[];
  total: number;
}> {
  let url: string | null = `${CONECTR_API}/presentations/search`;
  let expectedTotal = 0;
  const seen = new Set<number>();
  const all: ApiProject[] = [];

  while (url) {
    const response = await fetch(url);
    const data = (await response.json()) as PaginatedProjectsResponse;
    if (!expectedTotal) expectedTotal = toNumber(data.total);

    const list = data.data ?? [];
    list.forEach((item) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      all.push(item);
    });

    url = data.next_page_url ?? null;
  }

  return { projects: all, total: expectedTotal || all.length };
}

export async function fetchMeta(): Promise<MetaResponse> {
  const response = await fetch(`${CONECTR_API}/meta`);
  return (await response.json()) as MetaResponse;
}
