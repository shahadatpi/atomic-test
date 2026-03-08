'use client';
import * as React from "react";
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function SignupForm({
                             className,
                             ...props
                           }: React.ComponentProps<"div">) {
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      const justLoggedIn = searchParams.get("loggedIn");
      if (justLoggedIn === "true") {
        console.log(session?.user);
        toast.success(`Welcome, ${session.user.name || session.user.email}!`);
      }
    }
  }, [session, searchParams]);

  const handleSignup = async () => {
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (password.length < 4)          { toast.error("Password must be at least 4 characters."); return; }

    setLoading(true);
    const { data, error } = await authClient.signUp.email({ name, email, password });
    console.log(data);
    setLoading(false);

    if (error) { toast.error(error.message || 'Something went wrong!'); return; }

    console.log("Signed up user:", data);
    toast.success("Account created successfully!");
    router.push("/api/dashboard");
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    await signIn.social({ provider: "google", callbackURL: "/api/dashboard" });
  };

  /* password strength */
  const strength = password.length === 0 ? 0 : password.length < 4 ? 1 : password.length < 8 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"];

  return (
      <div className={cn("w-full", className)} {...props}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .signup-root { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .d1 { animation-delay: 0.05s; opacity: 0; }
        .d2 { animation-delay: 0.1s;  opacity: 0; }
        .d3 { animation-delay: 0.15s; opacity: 0; }
        .d4 { animation-delay: 0.2s;  opacity: 0; }
        .d5 { animation-delay: 0.25s; opacity: 0; }
        .d6 { animation-delay: 0.3s;  opacity: 0; }
        .social-btn { transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease; }
        .social-btn:hover { transform: translateY(-1px); }
        .field-input:focus { border-color: #34d399; box-shadow: 0 0 0 3px rgba(52,211,153,0.12); }
        .field-input { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .submit-btn { transition: background 0.15s ease, transform 0.15s ease, opacity 0.15s ease; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); background: #6ee7b7; }
      `}</style>

        <div className="signup-root min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">

            {/* ── Left panel — form ── */}
            <div className="bg-zinc-900 px-8 py-10 flex flex-col justify-center space-y-6">

              {/* Logo + heading */}
              <div className="fade-up d1 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center mb-1">
                  <span className="text-zinc-950 font-bold text-lg">A</span>
                </div>
                <h1 className="text-2xl font-semibold text-white">Create your account</h1>
                <p className="text-zinc-500 text-sm">Start practicing maths & physics today</p>
              </div>

              {/* Social buttons */}
              <div className="fade-up d2 grid grid-cols-3 gap-3">
                {/* Apple */}
                <button
                    type="button"
                    className="social-btn flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:text-white text-sm"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor"/>
                  </svg>
                  <span className="sr-only">Apple</span>
                  Apple
                </button>

                {/* Google */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="social-btn flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:text-white text-sm"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
                  </svg>
                  Google
                </button>

                {/* Meta */}
                <button
                    type="button"
                    className="social-btn flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:text-white text-sm"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" fill="currentColor"/>
                  </svg>
                  Meta
                </button>
              </div>

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
                  <label className="text-xs font-medium text-zinc-400">Full Name</label>
                  <Input
                      id="name"
                      type="text"
                      placeholder="Mofiz Uddin"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="field-input bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl h-11"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Email Address</label>
                  <Input
                      id="email"
                      type="email"
                      placeholder="faltu@taltu.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="field-input bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl h-11"
                  />
                </div>

                {/* Passwords side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Password</label>
                    <div className="relative">
                      <Input
                          id="password"
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="field-input bg-zinc-800 border-zinc-700 text-white rounded-xl h-11 pr-10"
                      />
                      <button
                          type="button"
                          onClick={() => setShowPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Confirm</label>
                    <div className="relative">
                      <Input
                          id="confirm-password"
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="field-input bg-zinc-800 border-zinc-700 text-white rounded-xl h-11 pr-10"
                      />
                      <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password strength */}
                {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                            <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                    strength >= level ? strengthColor[strength] : "bg-zinc-800"
                                }`}
                            />
                        ))}
                      </div>
                      <p className={`text-xs ${strengthColor[strength].replace("bg-", "text-")}`}>
                        {strengthLabel[strength]} password
                      </p>
                    </div>
                )}
              </div>

              {/* Submit */}
              <div className="fade-up d4 space-y-3">
                <button
                    type="button"
                    onClick={handleSignup}
                    disabled={loading}
                    className="submit-btn w-full bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm h-11 rounded-xl flex items-center justify-center gap-2"
                >
                  {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                      : "Create Account →"
                  }
                </button>

                <p className="text-center text-xs text-zinc-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Footer */}
              <p className="fade-up d5 text-center text-xs text-zinc-700 leading-relaxed">
                By signing up, you agree to our{" "}
                <a href="#" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">Terms</a>
                {" "}and{" "}
                <a href="#" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">Privacy Policy</a>
              </p>
            </div>

            {/* ── Right panel — visual ── */}
            <div className="relative hidden md:flex flex-col items-center justify-center bg-zinc-950 border-l border-zinc-800 overflow-hidden p-10 gap-8">
              {/* Grid bg */}
              <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                  linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)
                `,
                    backgroundSize: "40px 40px",
                  }}
              />
              {/* Glow */}
              <div
                  className="absolute pointer-events-none"
                  style={{
                    width: 400, height: 400, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)",
                    top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  }}
              />

              {/* Logo */}
              <div className="relative z-10">
                <Link href="/">
                  <Image
                      src="/atomic-test-logo.png"
                      width={120}
                      height={120}
                      alt="AtomicTest"
                      className="object-contain drop-shadow-lg"
                  />
                </Link>
              </div>

              {/* Copy */}
              <div className="relative z-10 text-center space-y-3">
                <h2 className="text-2xl font-semibold text-white leading-snug">
                  Master Maths &<br />Physics with AI
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                  500+ MCQ problems with LaTeX rendering, instant explanations, and progress tracking.
                </p>
              </div>

              {/* Feature pills */}
              <div className="relative z-10 flex flex-wrap justify-center gap-2">
                {["LaTeX rendering", "Instant feedback", "Progress tracking", "Free & Pro plans"].map((f) => (
                    <span
                        key={f}
                        className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full"
                    >
                  ✦ {f}
                </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
  );
}
