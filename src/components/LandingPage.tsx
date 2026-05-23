"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#8B6B4A", "#6E5036", "#B5895D", "#503826", "#C3AC83"];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number; life: number; decay: number;
      color: string; gravity: number;
      rot: number; rotSpeed: number;
    };
    type Ripple = { x: number; y: number; r: number; life: number };

    let particles: Particle[] = [];
    let ripples: Ripple[] = [];

    const onClick = (e: MouseEvent) => {
      ripples.push({ x: e.clientX, y: e.clientY, r: 5, life: 1 });
      const count = 14 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 5,
          life: 1, decay: 0.012 + Math.random() * 0.015,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          gravity: 0.12,
          rot: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.15,
        });
      }
    };
    document.addEventListener("click", onClick);

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ripples = ripples.filter((r) => r.life > 0);
      particles = particles.filter((p) => p.life > 0);

      ripples.forEach((r) => {
        r.r += 4; r.life -= 0.025;
        ctx.save();
        ctx.globalAlpha = r.life * 0.6;
        ctx.strokeStyle = "#8B6B4A";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
        p.vx *= 0.97; p.life -= p.decay;
        p.rot += p.rotSpeed;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(251, 247, 241, 0.5)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.2);
        ctx.bezierCurveTo(p.size * 0.3, -p.size * 0.4, p.size * 0.3, p.size * 0.4, 0, p.size * 1.2);
        ctx.stroke();
        ctx.restore();
      });

      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="relative overflow-x-hidden">
      {/* floating background shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-beige-300 -top-24 -left-20 opacity-55 blur-3xl animate-drift1" />
        <div className="absolute w-[360px] h-[360px] rounded-full bg-cream-200 top-1/3 -right-16 opacity-55 blur-3xl animate-drift2" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-beige-400 -bottom-32 left-1/3 opacity-30 blur-3xl animate-drift3" />
        <div className="absolute w-[280px] h-[280px] rounded-full bg-cream-100 top-3/5 left-[5%] opacity-55 blur-3xl animate-drift1" />
      </div>

      {/* click burst canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur bg-cream-50/85 border-b border-coffee-700/10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-coffee-700 text-cream-50 grid place-items-center font-display italic font-bold">S</span>
            <span className="font-display font-semibold text-xl text-coffee-800">SATPrep</span>
          </Link>
          <div className="flex gap-6 items-center">
            <a href="#features" className="text-coffee-700 text-sm font-medium hover:text-coffee-900 hidden sm:inline">Features</a>
            <a href="#pricing" className="text-coffee-700 text-sm font-medium hover:text-coffee-900 hidden sm:inline">Pricing</a>
            <Link href="/login" className="text-coffee-700 text-sm font-medium hover:text-coffee-900">Log in</Link>
            <Link href="/signup" className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2 rounded-full text-sm font-medium">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-cream-100 text-coffee-700 px-3 py-1.5 rounded-full text-sm font-medium border border-coffee-700/10 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-coffee-600 animate-pulse" />
              Built for the digital SAT
            </div>
            <h1 className="font-display font-medium text-coffee-900 leading-[1.02] tracking-tight mb-6" style={{ fontSize: "clamp(2.8rem, 5.8vw, 4.6rem)" }}>
              Master the SAT, <em className="italic font-normal text-coffee-600">the warm way.</em>
            </h1>
            <p className="text-coffee-600 text-xl max-w-xl mb-10 leading-relaxed">
              A calmer way to prep. Skill-by-skill drills, real Bluebook-style mocks,
              and clear hand-written explanations for every wrong answer.
            </p>
            <div className="flex gap-3 items-center flex-wrap">
              <Link href="/signup" className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-8 py-4 rounded-full font-medium transition shadow-sm">
                Start practising — 19,900 so'm
              </Link>
              <a href="#features" className="border-2 border-beige-400 text-coffee-800 hover:bg-coffee-800 hover:text-cream-50 hover:border-coffee-800 px-8 py-4 rounded-full font-medium transition">
                See how it works
              </a>
            </div>
            <div className="mt-10 flex gap-10 flex-wrap">
              <div>
                <div className="font-display text-3xl font-semibold text-coffee-800">800+</div>
                <div className="text-sm text-coffee-600 mt-1">Official questions</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-coffee-800">+180</div>
                <div className="text-sm text-coffee-600 mt-1">Avg. score gain</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-coffee-800">1,600</div>
                <div className="text-sm text-coffee-600 mt-1">Score ceiling, met daily</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-cream-50 rounded-3xl shadow-2xl p-7 border border-coffee-700/10 -rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-5">
                <span className="text-sm text-coffee-600 font-medium">R&W · Q 14 of 27</span>
                <span className="bg-coffee-800 text-cream-50 px-3 py-1 rounded-full text-sm font-medium tabular-nums">14:32</span>
              </div>
              <p className="font-display text-coffee-800 text-base leading-relaxed mb-5">
                Which choice completes the text with the most logical transition?
              </p>
              {[
                { letter: "A", text: "Likewise, the data confirms…", sel: false },
                { letter: "B", text: "However, the data suggests…", sel: true },
                { letter: "C", text: "For instance, the data shows…", sel: false },
                { letter: "D", text: "In addition, the data confirms…", sel: false },
              ].map((c) => (
                <div key={c.letter} className={`flex items-center gap-3 p-3 mb-2 rounded-xl border-2 transition ${c.sel ? "bg-cream-200 border-coffee-700" : "bg-cream-100 border-transparent"}`}>
                  <span className={`w-6 h-6 rounded-full grid place-items-center text-sm font-semibold ${c.sel ? "bg-coffee-700 text-cream-50" : "bg-cream-50 border-2 border-coffee-700 text-coffee-800"}`}>{c.letter}</span>
                  <span className="text-coffee-700 text-sm">{c.text}</span>
                </div>
              ))}
            </div>
            <div className="absolute -top-5 right-0 bg-cream-50 rounded-2xl px-4 py-3 shadow-lg border border-coffee-700/10 text-sm font-medium text-coffee-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-600 text-white grid place-items-center text-xs">✓</span>
              Transitions · Strong
            </div>
            <div className="absolute bottom-5 -left-8 bg-cream-50 rounded-2xl px-4 py-3 shadow-lg border border-coffee-700/10 text-sm font-medium text-coffee-700">
              🔥 7-day streak
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-8 py-20">
        <div className="mb-16">
          <div className="text-coffee-600 text-sm font-medium uppercase tracking-widest mb-3">What's inside</div>
          <h2 className="font-display font-medium text-coffee-900 mb-4 tracking-tight max-w-2xl" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}>
            Everything you need. <em className="italic font-normal text-coffee-600">Nothing you don't.</em>
          </h2>
          <p className="text-coffee-600 text-lg max-w-2xl">
            Three practice modes, a hand-written explanation for every question, and a calm interface inspired by the real Bluebook app.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Skill drills", body: "Practise Transitions, Boundaries, Algebra, Geometry — one skill at a time. Easy → hard ramp like the real test.", featured: false },
            { title: "Full SAT mock", body: "The exact real-SAT structure — 2 R&W modules, a break, then 2 Math modules. Adaptive. Score out of 1,600.", featured: true },
            { title: "Single modules", body: "Short on time? Run a single Math or English module at the difficulty you want. Perfect for a focused session.", featured: false },
            { title: "Explanation for every question", body: "Got it wrong? A clear hand-written explanation appears immediately. No paywall, no waiting.", featured: false },
            { title: "Bluebook-style tools", body: "Built-in Desmos calculator, math reference sheet, passage highlighter, strikethrough, and question navigator.", featured: false },
            { title: "Progress that adapts", body: "We surface your weakest skills and keep an eye on your countdown to test day. You always know what to practise next.", featured: false },
          ].map((f, i) => (
            <div key={i} className={`p-7 rounded-2xl border transition hover:-translate-y-1 hover:shadow-md ${f.featured ? "bg-coffee-800 border-transparent text-cream-100" : "bg-cream-50 border-coffee-700/10 hover:border-beige-400"}`}>
              <div className={`w-12 h-12 rounded-xl grid place-items-center mb-5 ${f.featured ? "bg-cream-100/10" : "bg-cream-100"}`}>
                <div className={`w-5 h-5 rounded-full ${f.featured ? "bg-cream-100" : "bg-coffee-700"}`} />
              </div>
              <h3 className={`font-display font-semibold text-xl mb-2 ${f.featured ? "text-cream-50" : "text-coffee-800"}`}>{f.title}</h3>
              <p className={`text-base leading-relaxed ${f.featured ? "text-cream-200" : "text-coffee-600"}`}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-cream-100 relative z-10">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="mb-12">
            <div className="text-coffee-600 text-sm font-medium uppercase tracking-widest mb-3">Loved by students</div>
            <h2 className="font-display font-medium text-coffee-900 tracking-tight max-w-3xl" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}>
              From <em className="italic font-normal text-coffee-600">1180</em> to <em className="italic font-normal text-coffee-600">1480</em>. Stories like this every week.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { quote: "Felt like Bluebook but warmer. The drills by skill changed my R&W score — went from 580 to 720 in six weeks.", name: "Aziza K.", meta: "Tashkent · 1480 SAT", init: "AK" },
              { quote: "The explanation after each wrong answer was so clear, I finally understood Transitions for real. Best 20k so'm I've spent.", name: "Jasur D.", meta: "Samarkand · 1390 SAT", init: "JD" },
              { quote: "Did three full mocks before the real exam. Walking in I already knew the interface, the timer, the calculator. No surprises.", name: "Madina S.", meta: "Bukhara · 1520 SAT", init: "MS" },
            ].map((t, i) => (
              <div key={i} className="bg-cream-50 rounded-2xl p-7 border border-coffee-700/10 flex flex-col">
                <div className="font-display text-5xl text-beige-400 leading-none mb-2">"</div>
                <p className="font-display italic text-coffee-800 text-lg mb-6 flex-1">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-coffee-700 text-cream-50 grid place-items-center font-display font-semibold">{t.init}</div>
                  <div>
                    <div className="font-semibold text-coffee-800 text-sm">{t.name}</div>
                    <div className="text-xs text-coffee-600">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-8 py-20 text-center">
        <div className="mb-12">
          <div className="text-coffee-600 text-sm font-medium uppercase tracking-widest mb-3">One price. One time.</div>
          <h2 className="font-display font-medium text-coffee-900 tracking-tight mb-4 max-w-2xl mx-auto" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}>
            No subscriptions. <em className="italic font-normal text-coffee-600">Ever.</em>
          </h2>
          <p className="text-coffee-600 text-lg max-w-2xl mx-auto">Pay once, prep forever. Every drill, every module, every full mock — plus all future updates.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* USD */}
          <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-9 text-left">
            <div className="text-xs text-coffee-600 font-medium uppercase tracking-widest mb-2">🌍 International</div>
            <h3 className="font-display font-semibold text-2xl text-coffee-900 mb-5">Lifetime access</h3>
            <div className="font-display text-5xl font-semibold text-coffee-900 mb-1 tracking-tight"><sup className="text-xl">$</sup>1.99</div>
            <div className="text-coffee-600 text-sm mb-7">one-time payment</div>
            <ul className="space-y-3 mb-8">
              {["Unlimited skill drills", "All standalone modules", "Unlimited full SAT mocks", "Hand-written explanations", "Progress tracking", "Bluebook-style tools"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-coffee-700 border-b border-dashed border-coffee-700/10 pb-3 last:border-none last:pb-0">
                  <span className="text-coffee-700 font-semibold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full text-center py-4 rounded-full bg-coffee-800 hover:bg-coffee-900 text-cream-50 font-medium">
              Get started →
            </Link>
            <div className="text-xs text-coffee-600 text-center mt-3">Stripe · Visa, Mastercard, Amex</div>
          </div>
          {/* UZS */}
          <div className="bg-coffee-800 text-cream-100 rounded-3xl p-9 text-left scale-[1.02] relative">
            <div className="absolute top-6 right-6 bg-accent text-coffee-900 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">For Uzbekistan</div>
            <div className="text-xs text-cream-200 font-medium uppercase tracking-widest mb-2">🇺🇿 O'zbekiston</div>
            <h3 className="font-display font-semibold text-2xl text-cream-50 mb-5">Lifetime access</h3>
            <div className="font-display text-5xl font-semibold text-cream-50 mb-1 tracking-tight">19,900 <sup className="text-base">so'm</sup></div>
            <div className="text-cream-200 text-sm mb-7">one-time payment</div>
            <ul className="space-y-3 mb-8">
              {["Unlimited skill drills", "All standalone modules", "Unlimited full SAT mocks", "Hand-written explanations", "Progress tracking", "Bluebook-style tools"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-cream-200 border-b border-dashed border-cream-100/10 pb-3 last:border-none last:pb-0">
                  <span className="text-accent font-semibold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full text-center py-4 rounded-full bg-cream-50 hover:bg-cream-100 text-coffee-900 font-medium">
              Get started →
            </Link>
            <div className="text-xs text-cream-200 text-center mt-3">Click · Payme · Uzum</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-coffee-900 text-cream-200 mt-16 py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-cream-50 text-coffee-900 grid place-items-center font-display italic font-bold">S</span>
                <span className="font-display font-semibold text-xl text-cream-50">SATPrep</span>
              </Link>
              <p className="text-cream-200/70 text-sm max-w-xs">A calmer, warmer way to prepare for the digital SAT. Built for ambitious students, everywhere.</p>
            </div>
            <div>
              <h4 className="font-display font-medium text-cream-50 mb-3">Product</h4>
              {["Features", "Pricing", "Skill list"].map((l) => (
                <div key={l} className="text-cream-200/70 text-sm py-1 hover:opacity-100">{l}</div>
              ))}
            </div>
            <div>
              <h4 className="font-display font-medium text-cream-50 mb-3">Company</h4>
              {["About", "Contact", "Blog"].map((l) => (
                <div key={l} className="text-cream-200/70 text-sm py-1">{l}</div>
              ))}
            </div>
            <div>
              <h4 className="font-display font-medium text-cream-50 mb-3">Legal</h4>
              {["Terms", "Privacy", "Refunds"].map((l) => (
                <div key={l} className="text-cream-200/70 text-sm py-1">{l}</div>
              ))}
            </div>
          </div>
          <div className="border-t border-cream-100/10 pt-7 flex justify-between flex-wrap gap-3 text-cream-200/50 text-sm">
            <div>© 2026 SATPrep. Not affiliated with College Board.</div>
            <div>Made with care in Tashkent ☕</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
