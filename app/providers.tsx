"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, locales } from "@/i18n/request";

function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: (typeof locales)[number];
  messages: Record<string, any>;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TooltipProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </TooltipProvider>
    </NextIntlClientProvider>
  );
}

export default Providers;
