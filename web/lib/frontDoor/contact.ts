/** Navigator orders collect a phone number and a mailing address. */

export type Contact = {
  phone: string;
  street: string;
  city: string;
  region: string;
  postal: string;
  country: string;
};

export function isNavigatorProduct(id: string): boolean {
  return id.length > 0 && id !== "observer";
}

export function contactProblem(contact: Contact): string {
  const digits = contact.phone.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a phone number with at least 10 digits.";
  if (!contact.street.trim()) return "Enter the street address.";
  if (!contact.city.trim()) return "Enter the city.";
  if (!contact.region.trim()) return "Enter the state.";
  if (!contact.postal.trim()) return "Enter the ZIP code.";
  if (!contact.country.trim()) return "Enter the country.";
  return "";
}
