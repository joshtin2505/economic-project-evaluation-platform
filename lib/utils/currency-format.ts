/**
 * Formato compacto para ejes de gráficos (evita strings rotos tipo "$1500000k").
 */
export function formatCompactCurrency(
  value: number,
  options?: { locale?: string; currency?: string },
): string {
  const locale = options?.locale ?? "en-US";
  const currency = options?.currency ?? "USD";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}${formatMoney(abs / 1_000_000_000, locale, currency)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${formatMoney(abs / 1_000_000, locale, currency)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${formatMoney(abs / 1_000, locale, currency)}K`;
  }

  return formatMoney(abs, locale, currency, { maximumFractionDigits: 0 });
}

function formatMoney(
  amount: number,
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    ...options,
  }).format(amount);
}
