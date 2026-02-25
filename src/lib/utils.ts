export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU").format(price) + " \u20B8";
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 1) return "+7";

  const rest = digits.slice(1);
  let formatted = "+7";
  if (rest.length > 0) formatted += " (" + rest.slice(0, 3);
  if (rest.length >= 3) formatted += ") ";
  if (rest.length > 3) formatted += rest.slice(3, 6);
  if (rest.length >= 6) formatted += "-";
  if (rest.length > 6) formatted += rest.slice(6, 8);
  if (rest.length >= 8) formatted += "-";
  if (rest.length > 8) formatted += rest.slice(8, 10);

  return formatted;
}

export function unformatPhone(formatted: string): string {
  return "+" + formatted.replace(/\D/g, "");
}
