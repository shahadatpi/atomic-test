"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

import { authClient }   from "@/lib/auth-client"
import { Input }        from "@/components/ui/input"
import AuthPanel        from "@/components/auth/AuthPanel"
import SocialButtons    from "@/components/auth/SocialButtons"
import { cn }           from "@/lib/utils"

/* ── Email validation ──────────────────────────────────────────────────── */
function validateEmail(email: string): { valid: boolean; reason?: string } {
  if (!email) return { valid: false }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, reason: "Invalid email format" }
  if ((email.split(".").pop() ?? "").length < 2)   return { valid: false, reason: "Invalid domain" }
  if (email.includes(".."))                         return { valid: false, reason: "Invalid email format" }
  const blocked = ["mailinator.com","guerrillamail.com","tempmail.com","throwaway.email",
    "yopmail.com","sharklasers.com","spam4.me","trashmail.com","fakeinbox.com"]
  if (blocked.includes(email.split("@")[1]?.toLowerCase())) return { valid: false, reason: "Disposable emails not allowed" }
  return { valid: true }
}

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const [name,            setName]            = useState("")
  const [email,           setEmail]           = useState("")
  const [emailTouched,    setEmailTouched]    = useState(false)
  const [password,        setPassword]        = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading,         setLoading]         = useState(false)
  const [showPass,        setShowPass]        = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)

  const router = useRouter()

  const emailStatus = emailTouched ? validateEmail(email) : null

  const strength = password.length === 0 ? 0 : password.length < 4 ? 1 : password.length < 8 ? 2 : 3
  const strengthLabels = ["", "Weak", "Fair", "Strong"]
  const strengthColors = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"]
  const strengthTextColors = ["", "text-red-400", "text-amber-400", "text-emerald-400"]

  const canSubmit = !loading && name.trim() && validateEmail(email).valid
    && password.length >= 4 && password === confirmPassword

  const handleSignup = async () => {
    const ev = validateEmail(email)
    if (!ev.valid)                   { toast.error(ev.reason || "Please enter a valid email"); return }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return }
    if (password.length < 4)          { toast.error("Password must be at least 4 characters."); return }

    setLoading(true)
    const { error } = await authClient.signUp.email({ name, email, password })
    setLoading(false)

    if (error) { toast.error(error.message || "Something went wrong!"); return }

    toast.success("Account created successfully!")
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">

          {/* ── Left panel — form ── */}
          <div className="bg-zinc-900 px-8 py-10 flex flex-col justify-center space-y-6">

            {/* Heading */}
            <div className="fade-up d1 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center mb-1">
                <span className="text-zinc-950 font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-semibold text-white">Create your account</h1>
              <p className="text-zinc-500 text-sm">Start practicing maths & physics today</p>
            </div>

            {/* Social */}
            <div className="fade-up d2"><SocialButtons /></div>

            {/* Divider */}
            <div className="fade-up d3 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">or with email</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Fields */}
            <div className="fade-up d3 space-y-4">

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-zinc-400">Full Name</label>
                <Input id="name" type="text" placeholder="Your full name"
                  value={name} onChange={e => setName(e.target.value)}
                  className="field-input bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl h-11" />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-400">Email Address</label>
                <div className="relative">
                  <Input id="email" type="email" placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailTouched(true) }}
                    onBlur={() => setEmailTouched(true)}
                    className={`field-input bg-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 pr-10 border ${
                      !emailTouched || !email ? "border-zinc-700"
                      : emailStatus?.valid ? "border-emerald-500"
                      : "border-red-500/70"
                    }`} />
                  {emailTouched && email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {emailStatus?.valid
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                    </div>
                  )}
                </div>
                {emailTouched && email && !emailStatus?.valid && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3 shrink-0" />
                    {emailStatus?.reason ?? "Invalid email address"}
                  </p>
                )}
                {emailTouched && emailStatus?.valid && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Looks good
                  </p>
                )}
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-medium text-zinc-400">Password</label>
                  <div className="relative">
                    <Input id="password" type={showPass ? "text" : "password"}
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="field-input bg-zinc-800 border-zinc-700 text-white rounded-xl h-11 pr-10" />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-xs font-medium text-zinc-400">Confirm</label>
                  <div className="relative">
                    <Input id="confirm" type={showConfirm ? "text" : "password"}
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`field-input bg-zinc-800 text-white rounded-xl h-11 pr-10 border ${
                        confirmPassword && password
                          ? confirmPassword === password ? "border-emerald-500" : "border-red-500/70"
                          : "border-zinc-700"
                      }`} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Strength + match */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(level => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= level ? strengthColors[strength] : "bg-zinc-800"}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${strengthTextColors[strength]}`}>{strengthLabels[strength]} password</p>
                    {confirmPassword && (
                      <p className={`text-xs ${confirmPassword === password ? "text-emerald-400" : "text-red-400"}`}>
                        {confirmPassword === password ? "✓ Passwords match" : "✗ Don't match"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="fade-up d4 space-y-3">
              <button type="button" onClick={handleSignup} disabled={!canSubmit}
                className="submit-btn w-full bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create Account →"}
              </button>
              <p className="text-center text-xs text-zinc-600">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">Sign in</Link>
              </p>
            </div>

            <p className="fade-up d5 text-center text-xs text-zinc-700 leading-relaxed">
              By signing up, you agree to our{" "}
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
