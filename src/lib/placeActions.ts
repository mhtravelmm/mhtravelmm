/** Opens a map search for a place name, without needing coordinates. */
export function mapSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Strips spacing so `09 777 123 456` becomes a dialable `tel:` value. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
