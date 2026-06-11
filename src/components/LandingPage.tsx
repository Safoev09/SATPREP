"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-100 text-coffee-900 overflow-x-hidden">
      <Header />
      <Hero3D />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-cream-100/70 border-b border-coffee-700/8">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold text-lg">S</div>
          <span className="font-display font-semibold text-lg tracking-tight">SATPeaK</span>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm text-coffee-700">
          <a href="#features" className="hover:text-coffee-900 transition">Features</a>
          <a href="#how" className="hover:text-coffee-900 transition">How it works</a>
          <a href="#stories" className="hover:text-coffee-900 transition">Stories</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-coffee-700 hover:text-coffee-900 transition px-2 py-2">Log in</Link>
          <Link href="/signup" className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 text-sm font-medium px-5 py-2.5 rounded-full transition hover:scale-[1.03] shadow-lg shadow-coffee-800/15">
            Start free →
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ===== 3D INTERACTIVE HERO — mouse-tracked perspective tilt, pure CSS 3D ===== */
function Hero3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 14 });
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative pt-36 pb-28 px-6 overflow-hidden"
    >
      <div className="absolute top-[-20%] left-[10%] w-[34rem] h-[34rem] rounded-full bg-accent/12 blur-3xl animate-drift1 pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[5%] w-[40rem] h-[40rem] rounded-full bg-beige-300/25 blur-3xl animate-drift2 pointer-events-none" />
      <div className="absolute top-[30%] right-[30%] w-72 h-72 rounded-full bg-coffee-500/8 blur-3xl animate-drift3 pointer-events-none" />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
        <div>
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-300/60 text-green-800 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 animate-fadeup">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            100% free during beta — no card, no catch
          </div>
          <h1 className="font-display text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight mb-6 animate-fadeup" style={{ animationDelay: "80ms" }}>
            The calm way to a<br />
            <span className="relative inline-block">
              <span className="relative z-10">1500+ SAT.</span>
              <span className="absolute bottom-1.5 left-0 right-0 h-4 bg-accent/25 -rotate-1 rounded" />
            </span>
          </h1>
          <p className="text-coffee-600 text-lg leading-relaxed mb-9 max-w-md animate-fadeup" style={{ animationDelay: "160ms" }}>
            Adaptive mock exams, surgical drills, a living vocabulary system, and a study plan that rebuilds itself around you — every single day.
          </p>
          <div className="flex flex-wrap items-center gap-4 animate-fadeup" style={{ animationDelay: "240ms" }}>
            <Link href="/signup" className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 font-medium px-8 py-4 rounded-full transition hover:scale-[1.03] shadow-xl shadow-coffee-800/25 text-[15px]">
              Create free account →
            </Link>
            <a href="#how" className="text-coffee-700 hover:text-coffee-900 font-medium text-[15px] px-2 py-4 transition">
              See how it works ↓
            </a>
          </div>
        </div>

        <div className="relative h-[420px] hidden lg:block" style={{ perspective: "1200px" }}>
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute top-4 left-8 w-72 bg-cream-50 rounded-3xl border border-coffee-700/10 shadow-2xl shadow-coffee-900/10 p-6 animate-floaty"
              style={{ transform: "translateZ(80px)" }}
            >
              <div className="text-xs text-coffee-500 uppercase tracking-wider font-semibold mb-2">Mock exam result</div>
              <div className="font-display text-5xl font-semibold mb-1">1480</div>
              <div className="text-xs text-green-700 font-medium">▲ +160 from baseline</div>
              <div className="mt-4 h-2 rounded-full bg-cream-200 overflow-hidden">
                <div className="h-full w-[88%] bg-gradient-to-r from-accent to-coffee-700 rounded-full" />
              </div>
            </div>

            <div
              className="absolute top-44 right-0 w-60 bg-coffee-800 text-cream-50 rounded-3xl shadow-2xl shadow-coffee-900/30 p-6 animate-floaty"
              style={{ transform: "translateZ(140px)", animationDelay: "0.8s" }}
            >
              <div className="text-3xl mb-2">🔥</div>
              <div className="font-display text-3xl font-semibold">21-day streak</div>
              <div className="text-cream-200 text-xs mt-1">Longest in your cohort</div>
            </div>

            <div
              className="absolute bottom-2 left-0 w-64 bg-cream-50 rounded-3xl border border-coffee-700/10 shadow-xl shadow-coffee-900/10 p-5 animate-floaty"
              style={{ transform: "translateZ(40px)", animationDelay: "1.6s" }}
            >
              <div className="text-xs text-coffee-500 uppercase tracking-wider font-semibold mb-2">Vocabulary constellation</div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <span className="w-7 h-7 rounded-full grid place-items-center text-xs bg-gradient-to-br from-accent/30 to-beige-300/50 border border-cream-100">✦</span>
                  <span className="w-7 h-7 rounded-full grid place-items-center text-xs bg-gradient-to-br from-accent/30 to-beige-300/50 border border-cream-100">✦</span>
                  <span className="w-7 h-7 rounded-full grid place-items-center text-xs bg-gradient-to-br from-accent/30 to-beige-300/50 border border-cream-100">✦</span>
                </div>
                <div className="text-sm font-medium">312 words mastered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const stats = [
    { num: "270+", label: "Original questions" },
    { num: "500", label: "SAT Power vocabulary words" },
    { num: "10", label: "R&W skills mapped" },
    { num: "∞", label: "Adaptive practice paths" },
  ];
  return (
    <section className="border-y border-coffee-700/8 bg-cream-50/60 py-8 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display text-3xl font-semibold text-coffee-900">{s.num}</div>
            <div className="text-xs text-coffee-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { emoji: "🎯", title: "Bluebook-real mock exams", desc: "Adaptive Module 2, exact timing, exam-mode lockdown — your practice feels exactly like test day, so test day feels like practice." },
    { emoji: "🧠", title: "A study plan with a brain", desc: "Every morning your plan rebuilds itself from yesterday's accuracy, due vocabulary, and days-to-exam. No two students see the same route." },
    { emoji: "🏔️", title: "Vocabulary that sticks", desc: "Spaced repetition tuned for the SAT Power 400, etymology trees, match sprints, and a constellation map that fills as you master words." },
    { emoji: "📊", title: "Skill-level X-ray", desc: "Not just reading scores — your Cross-Text Connections accuracy is 43% and here are 12 targeted drills to fix it." },
    { emoji: "💬", title: "A community that grinds with you", desc: "Share tricky questions to channels, DM friends, build study groups. Solo prep is over." },
    { emoji: "🛡️", title: "Honest exam conditions", desc: "Full-screen exam shield, violation tracking, auto-submit. Your mock score means something." },
  ];
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-3">Why SATPeaK</div>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Built like the real exam.<br />Designed like nothing else.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f) => (
            <div
              key={f.title}
              className="group bg-cream-50 rounded-3xl border border-coffee-700/10 p-7 hover:border-accent/40 hover:shadow-xl hover:shadow-coffee-900/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{f.emoji}</div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-coffee-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Diagnose", desc: "A 30-minute diagnostic maps your exact skill shape across all 10 R&W skills and 4 Math domains." },
    { n: "02", title: "Follow your route", desc: "Each day, a fresh plan: weakest-skill drills, due vocabulary, and timed modules — paced to your exam date." },
    { n: "03", title: "Rehearse the real thing", desc: "Full adaptive mocks under exam-shield conditions. Score 400–1600, reviewed question by question." },
    { n: "04", title: "Peak on test day", desc: "By exam week you have seen every question type, every trap, every timing crunch — nothing can surprise you." },
  ];
  return (
    <section id="how" className="py-24 px-6 bg-coffee-900 text-cream-50 relative overflow-hidden">
      <div className="absolute top-[-30%] right-[-10%] w-[36rem] h-[36rem] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-3">The route</div>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Four steps to the summit.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-5">
              <div className="font-display text-4xl font-semibold text-accent/60 leading-none shrink-0">{s.n}</div>
              <div>
                <h3 className="font-display text-xl font-semibold mb-1.5">{s.title}</h3>
                <p className="text-cream-200/80 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { quote: "The explanation after each wrong answer was so clear, I finally understood Transitions for real.", name: "Jasur D.", meta: "Samarkand · 1390 SAT", init: "JD" },
    { quote: "The daily route is genius. I stopped wasting an hour deciding what to study — I just open the app and go.", name: "Madina K.", meta: "Tashkent · aiming 1500", init: "MK" },
    { quote: "Mock exams feel exactly like Bluebook. On test day my hands were not even shaking.", name: "Timur A.", meta: "Bukhara · 1450 SAT", init: "TA" },
  ];
  return (
    <section id="stories" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-3">From students</div>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Real climbs.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map((t) => (
            <div key={t.name} className="bg-cream-50 rounded-3xl border border-coffee-700/10 p-7 hover:shadow-lg transition-shadow">
              <p className="text-coffee-800 text-sm leading-relaxed mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-coffee-700 text-cream-50 grid place-items-center text-xs font-semibold">{t.init}</div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-coffee-500">{t.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-coffee-800 to-coffee-900 rounded-[2.5rem] px-10 py-16 relative overflow-hidden shadow-2xl shadow-coffee-900/30">
        <div className="absolute top-[-50%] left-[20%] w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <h2 className="font-display text-4xl font-semibold text-cream-50 tracking-tight mb-4 relative">
          Free. All of it. Right now.
        </h2>
        <p className="text-cream-200/80 mb-9 max-w-md mx-auto relative">
          We are in beta and every feature is open — mock exams, the full question bank, vocabulary, community. Just bring the work ethic.
        </p>
        <Link href="/signup" className="inline-block bg-cream-50 hover:bg-cream-100 text-coffee-900 font-semibold px-9 py-4 rounded-full transition hover:scale-[1.03] relative">
          Start climbing →
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-coffee-700/10 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold text-sm">S</div>
          <span className="font-display font-semibold text-sm">SATPeaK</span>
          <span className="text-coffee-500 text-xs">· Digital SAT prep, made in Uzbekistan</span>
        </div>
        <div className="text-xs text-coffee-500">
          © {new Date().getFullYear()} SATPeaK · <a href="https://t.me/ASI_08_30" className="hover:text-coffee-800 transition">Telegram</a>
        </div>
      </div>
    </footer>
  );
}
