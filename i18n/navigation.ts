import { getLocale } from "next-intl/server"

export function getPathname(href: string, locale: string) {
  return href
}

export async function getLocaleFromServer() {
  return await getLocale()
}
