"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setError("Check your email to confirm your account, then return here to log in.");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* ===== LEFT: form ===== */}
      <div className="w-full lg:w-[46%] flex items-center justify-center p-6 sm:p-10 bg-cream-50">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <img
              src="/logo.png"
              alt="SATPeaK"
              className="w-9 h-9 object-contain rounded-lg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = "grid";
              }}
            />
            <div className="w-9 h-9 rounded-lg bg-coffee-800 text-cream-50 place-items-center font-display italic font-bold hidden">S</div>
            <span className="font-display font-semibold text-lg text-coffee-900 tracking-tight">SATPeaK</span>
          </Link>

          <h1 className="font-display text-[1.7rem] font-semibold text-coffee-900 mb-7 tracking-tight">
            Create your free account
          </h1>

          {/* Social buttons — visual parity with reference; wire up once OAuth is configured in Supabase */}
          <div className="space-y-2.5 mb-6">
            <SocialButton
              onClick={() => setError("Google sign-in isn't connected yet — use email below for now.")}
              icon={<GoogleIcon />}
              label="Sign up with Google"
            />
            <SocialButton
              onClick={() => setError("Microsoft sign-in isn't connected yet — use email below for now.")}
              icon={<MicrosoftIcon />}
              label="Sign up with Microsoft"
            />
            <SocialButton
              onClick={() => setError("Apple sign-in isn't connected yet — use email below for now.")}
              icon={<AppleIcon />}
              label="Sign up with Apple"
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-coffee-700/12" />
            <span className="text-xs text-coffee-500 font-medium">or</span>
            <div className="flex-1 h-px bg-coffee-700/12" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label>Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  style={{ paddingRight: "3.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-coffee-400 hover:text-coffee-700 transition"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-coffee-800 bg-cream-200 border border-coffee-700/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-900 hover:bg-coffee-800 disabled:opacity-60 text-cream-50 font-medium py-3.5 rounded-xl transition"
            >
              {loading ? "Creating account…" : "Continue with email"}
            </button>
          </form>

          <p className="text-center text-sm text-coffee-600 mt-7">
            Already have an account?{" "}
            <Link href="/login" className="text-coffee-900 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ===== RIGHT: illustrated scene ===== */}
      <div className="hidden lg:block lg:w-[54%] relative overflow-hidden">
        <SceneIllustration />
      </div>
    </div>
  );
}

function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 border border-coffee-700/15 rounded-xl py-3 text-sm font-medium text-coffee-800 hover:bg-cream-100 hover:border-coffee-700/25 transition"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.65 9c0-.59.1-1.17.3-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="0" y="0" width="7.5" height="7.5" fill="#F25022"/>
      <rect x="8.5" y="0" width="7.5" height="7.5" fill="#7FBA00"/>
      <rect x="0" y="8.5" width="7.5" height="7.5" fill="#00A4EF"/>
      <rect x="8.5" y="8.5" width="7.5" height="7.5" fill="#FFB900"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="#111">
      <path d="M13.1 9.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7C4.7 4.9 3.4 5.6 2.7 6.8 1.2 9.3 2.3 13 3.8 15c.7 1 1.5 2.1 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.6c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.4-.9-2.4-3.5-.1-2.2 1.8-3.2 1.8-3.2M11 3.2c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.6-1.2"/>
    </svg>
  );
}

// ---- Original illustration: mountain range at dusk, a trail marker
// showing "1600" (the SAT score ceiling — ties to "SATPeaK"), and two
// small companion blobs, drawn as a single SVG so no external assets
// are required. Palette pulled from the site's own coffee/cream tokens
// plus a deep dusk sky so it reads as night without going purple.
function SceneIllustration() {
  return (
    <svg viewBox="0 0 900 1000" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1410" />
          <stop offset="55%" stopColor="#2E2015" />
          <stop offset="100%" stopColor="#4A3420" />
        </linearGradient>
        <linearGradient id="peakBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6E5036" />
          <stop offset="100%" stopColor="#503826" />
        </linearGradient>
        <linearGradient id="peakFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B6B4A" />
          <stop offset="100%" stopColor="#6E5036" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7A9A5B" />
          <stop offset="100%" stopColor="#5E7A45" />
        </linearGradient>
      </defs>

      {/* sky */}
      <rect width="900" height="1000" fill="url(#sky)" />

      {/* stars */}
      {[...Array(40)].map((_, i) => {
        const x = (i * 137) % 900;
        const y = (i * 89) % 480;
        const r = (i % 3) * 0.5 + 0.6;
        return <circle key={i} cx={x} cy={y} r={r} fill="#F5EFE4" opacity={0.5 + (i % 4) * 0.12} />;
      })}

      {/* moon */}
      <circle cx="700" cy="130" r="46" fill="#F5EFE4" opacity="0.9" />
      <circle cx="716" cy="118" r="46" fill="url(#sky)" opacity="0.55" />

      {/* back mountain range */}
      <path d="M0,560 L120,400 L230,500 L360,320 L480,480 L620,360 L750,470 L900,380 L900,1000 L0,1000 Z" fill="url(#peakBack)" opacity="0.85" />

      {/* front mountain range */}
      <path d="M0,650 L150,470 L280,600 L420,420 L560,600 L700,460 L900,600 L900,1000 L0,1000 Z" fill="url(#peakFront)" />

      {/* snow caps */}
      <path d="M150,470 L190,500 L150,505 L110,500 Z" fill="#F5EFE4" opacity="0.85" />
      <path d="M420,420 L465,455 L420,460 L375,455 Z" fill="#F5EFE4" opacity="0.85" />
      <path d="M700,460 L738,490 L700,495 L662,490 Z" fill="#F5EFE4" opacity="0.85" />

      {/* ground */}
      <path d="M0,760 Q220,700 450,750 T900,730 L900,1000 L0,1000 Z" fill="url(#ground)" />

      {/* trail marker post */}
      <rect x="700" y="700" width="10" height="130" rx="3" fill="#503826" />
      {/* sign board */}
      <g transform="translate(650,660)">
        <rect x="0" y="0" width="110" height="60" rx="8" fill="#B5895D" />
        <text x="55" y="32" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="600" fontSize="26" fill="#241710">1600</text>
        <path d="M92,44 l10,-14 l10,14 Z" fill="#241710" />
      </g>

      {/* winding path up toward the sign */}
      <path
        d="M120,960 C220,900 200,840 300,820 C400,800 380,760 480,740 C560,725 600,700 655,700"
        fill="none"
        stroke="#F5EFE4"
        strokeOpacity="0.35"
        strokeWidth="6"
        strokeDasharray="2 18"
        strokeLinecap="round"
      />

      {/* companion blob 1 */}
      <g transform="translate(150,880)">
        <ellipse cx="0" cy="0" rx="34" ry="30" fill="#B5895D" />
        <circle cx="-10" cy="-4" r="4" fill="#241710" />
        <circle cx="10" cy="-4" r="4" fill="#241710" />
        <path d="M-8,8 Q0,14 8,8" stroke="#241710" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* companion blob 2 */}
      <g transform="translate(240,940) scale(0.8)">
        <ellipse cx="0" cy="0" rx="34" ry="30" fill="#D9C7A6" />
        <circle cx="-10" cy="-4" r="4" fill="#241710" />
        <circle cx="10" cy="-4" r="4" fill="#241710" />
        <path d="M-8,10 Q0,4 8,10" stroke="#241710" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* travel pack, echoing "peak" journey theme */}
      <g transform="translate(360,860)">
        <ellipse cx="0" cy="70" rx="56" ry="14" fill="#241710" opacity="0.15" />
        <rect x="-42" y="0" width="84" height="70" rx="20" fill="#6E5036" />
        <rect x="-30" y="-24" width="60" height="40" rx="18" fill="#8B6B4A" />
        <rect x="-14" y="10" width="28" height="36" rx="8" fill="#503826" />
        <circle cx="0" cy="26" r="12" fill="none" stroke="#F5EFE4" strokeWidth="3" opacity="0.7" />
      </g>
    </svg>
  );
}
