// Single API access point. Base URL comes from env — never hardcoded in components.

const base = process.env.NEXT_PUBLIC_LABS_API_URL;

export function apiUrl(path: string): string {
  if (!base) {
    throw new Error("NEXT_PUBLIC_LABS_API_URL is not set");
  }
  return `${base}${path}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}
