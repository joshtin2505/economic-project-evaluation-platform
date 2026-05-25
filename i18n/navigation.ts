import { routing } from "./routing"
import { getLocale } from "next-intl/server"

export function getPathname(href: string, locale: string) {
  return `/${locale}${href}`
}

export async function getLocaleFromServer() {
  return await getLocale()
}
