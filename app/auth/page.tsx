"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import * as auth from "@/lib/supabase/auth"

export default function AuthPage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError } = await auth.signUp(email, password)
        if (signUpError) throw signUpError
        setMessage(t("signupSuccess"))
      } else {
        const { error: signInError } = await auth.signIn(email, password)
        if (signInError) throw signInError
        router.push("/dashboard")
        router.refresh()
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("genericError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl">{isSignUp ? t("createAccount") : t("login")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="******"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("processing") : isSignUp ? t("createAccount") : t("login")}
            </Button>
          </form>

          <Button
            type="button"
            variant="link"
            className="mt-3 w-full"
            onClick={() => {
              setIsSignUp((value) => !value)
              setError(null)
              setMessage(null)
            }}
          >
            {isSignUp ? t("haveAccount") : t("needAccount")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
