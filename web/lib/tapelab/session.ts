import { apiUrl, sessionCookieHeader } from "@/lib/api";

export async function tapeSessionOk(cookie: string): Promise<boolean> {
  if (!cookie.includes("ft_session=")) return false;
  try {
    const res = await fetch(apiUrl("/api/auth/me"), {
      headers: { cookie },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function requestHasTapeSession(): Promise<boolean> {
  try {
    return await tapeSessionOk(await sessionCookieHeader());
  } catch {
    return false;
  }
}
