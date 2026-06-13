import Link from "next/link";

const features = [
  {
    title: "Symptom Analyzer",
    description: "Describe symptoms in plain language and get AI-powered condition insights with severity levels.",
    href: "/symptoms",
    icon: "🩺",
  },
  {
    title: "Report Intelligence",
    description: "Upload medical PDFs and extract key metrics with actionable recommendations.",
    href: "/reports",
    icon: "📋",
  },
  {
    title: "AI Health Chat",
    description: "Multilingual medical assistant for symptoms, medications, and general health guidance.",
    href: "/chat",
    icon: "💬",
  },
  {
    title: "Hospital Finder",
    description: "Search nearby hospitals by specialty, distance, and emergency room availability.",
    href: "/hospitals",
    icon: "🏥",
  },
];

export default function Home() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-white to-emerald-50 px-8 py-16 shadow-sm dark:from-primary/10 dark:via-background dark:to-emerald-950/20">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            AI-Powered Healthcare
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Your health,{" "}
            <span className="text-primary">intelligently guarded.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            MediGuardian combines symptom analysis, medical report interpretation,
            multilingual AI chat, and hospital discovery — built for modern deployment
            on Vercel and Render.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/symptoms"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              Try Symptom Analyzer
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-6 text-sm font-bold text-foreground transition-all hover:bg-muted dark:bg-background"
            >
              Sign In / Register
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-2">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group rounded-2xl border border-border/50 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:bg-background"
          >
            <span className="text-3xl">{feature.icon}</span>
            <h2 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-16 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-8 text-center">
        <h3 className="text-lg font-bold text-foreground">Ready to deploy?</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Frontend on Vercel · Backend on Render · PostgreSQL included via{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">render.yaml</code>
        </p>
      </section>
    </div>
  );
}
