"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { Input }      from "@/components/ui/input"
import AuthPanel      from "@/components/auth/AuthPanel"
import SocialButtons  from "@/components/auth/SocialButtons"
import { cn }         from "@/lib/utils"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    if (!email)    { toast.error("Please enter your email.");    return }
    if (!password) { toast.error("Please enter your password."); return }

    setLoading(true)
    const { error } = await authClient.signIn.email({ email, password })
    setLoading(false)

    if (error) { toast.error(error.message || "Invalid credentials."); return }

    toast.success("Welcome back!")
    router.push("/dashboard")
    router.refresh()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">

          {/* ── Left panel — form ── */}
          <div className="bg-zinc-900 px-8 py-10 flex flex-col justify-center space-y-6">

            {/* Logo + heading */}
            <div className="fade-up d1 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center mb-1">
                <span className="text-zinc-950 font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
              <p className="text-zinc-500 text-sm">Sign in to continue your practice</p>
            </div>

            {/* Social buttons */}
            <div className="fade-up d2">
              <SocialButtons />
            </div>

            {/* Divider */}
            <div className="fade-up d3 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">or with email</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Fields */}
            <div className="fade-up d3 space-y-4" onKeyDown={handleKeyDown}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-400">Email Address</label>
                <Input
                  id="email" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                  className="field-input bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-medium text-zinc-400">Password</label>
                  <Link href="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password" type={showPass ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    className="field-input bg-zinc-800 border-zinc-700 text-white rounded-xl h-11 pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    aria-label={showPass ? "Hide password" : "Show password"}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="fade-up d4 space-y-3">
              <button type="button" onClick={handleLogin} disabled={loading}
                className="submit-btn w-full bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In →"}
              </button>
              <p className="text-center text-xs text-zinc-600">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">Create one</Link>
              </p>
            </div>

            <p className="fade-up d5 text-center text-xs text-zinc-700 leading-relaxed">
              By signing in, you agree to our{" "}
              <a href="#" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">Terms</a>
              {" "}and{" "}
              <a href="#" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">Privacy Policy</a>
            </p>
          </div>

          {/* ── Right panel ── */}
          <AuthPanel />
        </div>
      </div>
    </div>
  )
}
