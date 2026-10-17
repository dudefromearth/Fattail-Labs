/** Same shape as server/front_door/email_address.py. Deliverability stays on the server. */

const LOCAL = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?$/;
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD = /^[a-z]{2,24}$/;

export const EMAIL_FORMAT = "Enter a complete email address, like name@domain.com.";
export const EMAIL_REQUIRED = "Enter the email address for this order.";

export function emailAddressProblem(value: string): string {
  const email = value.trim().toLowerCase();
  if (!email) return EMAIL_REQUIRED;
  if (!isProperEmail(email)) return EMAIL_FORMAT;
  return "";
}

export function isProperEmail(email: string): boolean {
  if (email.length > 320 || (email.match(/@/g) || []).length !== 1) return false;
  const [local, domain] = email.split("@");
  return localOk(local) && domainOk(domain);
}

function localOk(local: string): boolean {
  return local.length > 0 && local.length <= 64 && !local.includes("..") && LOCAL.test(local);
}

function domainOk(domain: string): boolean {
  if (!domain || domain.length > 253 || domain.includes("..")) return false;
  const labels = domain.split(".");
  if (labels.length < 2 || !TLD.test(labels[labels.length - 1])) return false;
  return labels.every((label) => LABEL.test(label));
}
