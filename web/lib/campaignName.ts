/** A campaign title that says "book" collides with account = book. */

export function campaignTitleLooksLikeBook(title: string): boolean {
  return /\bbooks?\b/i.test(title.trim());
}
