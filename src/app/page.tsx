import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";

const steps = [
  {
    number: "01",
    title: "Encuentra tu espacio",
    description:
      "Explora escritorios, salas de reuniones y cabinas privadas con su precio, capacidad y disponibilidad a la vista.",
  },
  {
    number: "02",
    title: "Reserva en minutos",
    description:
      "Elige la fecha y la hora de inicio en bloques de 60 minutos. El precio total lo calcula el servidor antes de confirmar.",
  },
  {
    number: "03",
    title: "Trabaja a tu manera",
    description:
      "Consulta tus reservas, cancela hasta dos horas antes y vuelve a empezar desde el mismo panel.",
  },
];

const stats = [
  { value: "3", label: "tipos de espacio" },
  { value: "1–4", label: "horas por reserva" },
  { value: "07–21", label: "horario disponible" },
  { value: "30", label: "días de anticipación" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-xl font-black tracking-tight"
          >
            <span className="grid size-8 place-items-center rounded-[10px_10px_10px_3px] bg-[#d9fa72] font-display text-sm text-[#242a23]">
              C
            </span>
            CoSpace
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link href="/spaces" className="transition hover:text-foreground">
              Espacios
            </Link>
            <Link href="/reservations" className="transition hover:text-foreground">
              Mis reservas
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-4 px-5 pb-4 pt-12">
        <Reveal className="col-span-12 lg:col-span-7">
          <div className="bento-cell flex h-full flex-col justify-between gap-8 p-9">
            <Badge className="w-fit font-display uppercase tracking-[0.2em]">
              Tu espacio · tu ritmo · tu forma de trabajar
            </Badge>

            <h1 className="font-heading text-[clamp(3rem,7vw,5.5rem)] font-black leading-[0.92] tracking-tight">
              Un mejor lugar
              <br />
              para hacer
              <br />
              <span className="text-[#7d8c4f]">grandes cosas.</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/spaces">Explorar espacios</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Crear cuenta</Link>
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="col-span-12 grid gap-4 lg:col-span-5">
          <Reveal delay={120}>
            <div className="bento-cell dark drift h-full">
              <p className="font-display text-xs uppercase tracking-[0.28em] text-[#c1ce9c]">
                Espacios para crecer
              </p>
              <p className="mt-6 font-heading text-4xl font-bold leading-tight">
                Tu próxima gran idea necesita una mesa, no una excusa.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Puestos con luz natural, salas equipadas y cabinas silenciosas,
                reservadas por horas y confirmadas al instante.
              </p>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="bento-cell accent h-full">
              <p className="font-display text-xs uppercase tracking-[0.28em] text-[#4c5a2e]">
                Cómo funciona
              </p>
              <p className="mt-4 font-heading text-2xl font-bold leading-snug text-[#242a23]">
                Elige, reserva y trabaja. Sin llamadas, sin formularios eternos.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-4 px-5 py-4">
        {stats.map((stat, index) => (
          <Reveal
            key={stat.label}
            delay={index * 90}
            className="col-span-6 lg:col-span-3"
          >
            <div className="bento-cell soft h-full">
              <p className="font-display text-[2.6rem] leading-none text-[#242a23]">
                {stat.value}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section
        id="como-funciona"
        className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-4 px-5 py-8"
      >
        <Reveal className="col-span-12 lg:col-span-4">
          <div className="bento-cell h-full">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Menos complicaciones, más ideas
            </p>
            <h2 className="mt-5 font-heading text-4xl font-black leading-tight tracking-tight">
              Trabajar bien empieza por{" "}
              <span className="text-[#7d8c4f]">el lugar.</span>
            </h2>
          </div>
        </Reveal>

        {steps.map((step, index) => (
          <Reveal
            key={step.number}
            delay={index * 110}
            className="col-span-12 lg:col-span-4"
          >
            <article className="bento-cell h-full">
              <span className="font-display text-3xl text-[#b9c48f]">
                {step.number}
              </span>
              <h3 className="mt-6 font-heading text-2xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </article>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-4 px-5 pb-14 pt-4">
        <Reveal className="col-span-12">
          <div className="bento-cell dark flex flex-col items-start justify-between gap-7 p-10 md:flex-row md:items-center">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.28em] text-[#c1ce9c]">
                Tu siguiente jornada comienza aquí
              </p>
              <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,3.2rem)] font-black leading-tight tracking-tight">
                Encuentra tu lugar.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
                Espacios pensados para que puedas concentrarte, con precio por
                hora calculado antes de reservar.
              </p>
            </div>

            <Button size="lg" className="shrink-0 bg-[#d9fa72] text-[#242a23] hover:bg-[#cdf55e]" asChild>
              <Link href="/spaces">Ver espacios</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
          <span className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
            <span className="grid size-7 place-items-center rounded-[9px_9px_9px_3px] bg-[#d9fa72] font-display text-xs text-[#242a23]">
              C
            </span>
            CoSpace
          </span>
          <span>Un espacio para cada idea.</span>
          <span>© 2026 CoSpace</span>
        </div>
      </footer>
    </main>
  );
}