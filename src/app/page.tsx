import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/types/database";
import StudentQuickLogin from "@/components/student-quick-login";
import LandingLeadCapture from "@/components/landing-lead-capture";
import { ENROLLMENT_PRICE_TIERS, ENROLLMENT_ACCESS_MONTHS } from "@/lib/enrollment-pricing";

const SITE_URL = "https://academiamagicaedu.com";
export const metadata: Metadata = {
  title: "Aprender jugando para niños de 4 a 10 años | Academia Mágica",
  description:
    "Plataforma educativa gamificada para niños de 4 a 10 años con catálogo de materias, profesores con voz, progreso visible y diamantes por aprender. Acceso inmediato tras el pago.",
  alternates: { canonical: "/" },
  keywords: [
    "plataforma educativa para niños",
    "aprender jugando",
    "educación gamificada",
    "matemáticas para niños",
    "español para niños",
    "Academia Mágica",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "Academia Mágica",
    title: "Academia Mágica | Aprender jugando es posible",
    description:
      "Una aventura educativa para que niños de 4 a 10 años aprendan, ganen diamantes y quieran seguir avanzando.",
    images: [{
      url: "/classroom/ninos-saltando.jpg",
      alt: "Niños celebrando un logro en Academia Mágica",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Academia Mágica | Aprender jugando es posible",
    description:
      "Aprendizaje gamificado, profesores con voz y progreso visible para niños de 4 a 10 años.",
    images: ["/classroom/ninos-saltando.jpg"],
  },
};

const BENEFITS = [
  { icon: "🧠", title: "Aprende a su ritmo", text: "Los contenidos están organizados por edad, materia y dificultad para que avance paso a paso, sin saltos imposibles." },
  { icon: "🎤", title: "Pregunta cuando lo necesita", text: "Cada materia tiene un profesor con voz. Le da pistas, le hace pensar y le enseña el camino sin regalarle la respuesta." },
  { icon: "💎", title: "Cada logro cuenta", text: "Los aciertos se transforman en diamantes que puede usar para crear y decorar su propio mundo dentro de la academia." },
  { icon: "📈", title: "Tú ves el progreso", text: "El panel familiar permite seguir actividad, rendimiento y evolución para acompañar con información real." },
];

const FEATURED_SUBJECTS = [
  { icon: "🔢", name: "Matemáticas", text: "Números, cálculo, geometría, medida, lógica y resolución de problemas con progresión por edad.", color: "bg-[#ffd93d]" },
  { icon: "📚", name: "Español", text: "Lectura, vocabulario, ortografía, gramática y comprensión para expresarse cada vez mejor.", color: "bg-[#ff9abd]" },
  { icon: "🫀", name: "Cuerpo humano", text: "Anatomía, sentidos, salud y hábitos explicados con curiosidad, ejemplos y actividades cercanas.", color: "bg-[#7fe7c4]" },
];

const OBJECTIONS = [
  {
    icon: "🎮",
    title: "“¿No es demasiada pantalla?”",
    text: "Entendemos la duda. Lo que cambia es qué hace con esa pantalla: 7 de cada 10 familias con niños de 2 a 8 años ya usan aplicaciones educativas como parte de su rutina, según un estudio de verano 2025 de Age of Learning (ABCmouse). Nosotros sumamos límites de tiempo por sesión y un panel para que veas exactamente en qué invierte cada minuto.",
    source: { label: "Age of Learning / ABCmouse, 2025", href: "https://www.abcmouse.com/learn/advice/education-app-statistics-every-parent-should-know/77938" },
  },
  {
    icon: "🧪",
    title: "“¿La gamificación realmente funciona?”",
    text: "Un meta-análisis de 2025 sobre gamificación en educación K-12, publicado en Psychology in the Schools, encontró un efecto positivo de moderado a grande sobre la motivación de los alumnos (g = 0,654) frente a la enseñanza sin estos elementos.",
    source: { label: "Kurnaz, Psychology in the Schools, 2025", href: "https://onlinelibrary.wiley.com/doi/10.1002/pits.70056" },
  },
  {
    icon: "💳",
    title: "“¿Es seguro pagar y cómo empiezo?”",
    text: "El pago se procesa con PayPal. En cuanto se confirma, el acceso se activa al instante: recibís un correo con el enlace para crear el usuario de tu hijo/a, sin esperar respuesta de nadie.",
    source: null,
  },
];

const FAQS = [
  { question: "¿Para qué edades está pensada Academia Mágica?", answer: "Está diseñada principalmente para niños y niñas de 4 a 10 años. El contenido se organiza por edades para que cada alumno encuentre un reto adecuado a su momento de aprendizaje." },
  { question: "¿Necesita un adulto estar siempre a su lado?", answer: "Al principio conviene acompañarle para conocer la plataforma. Después puede avanzar con bastante autonomía: las instrucciones son claras y puede pedir ayuda al profesor por voz o texto." },
  { question: "¿El profesor le dice directamente la respuesta?", answer: "No. Está preparado para guiar con preguntas y pequeñas pistas. El objetivo es que el alumno comprenda y llegue a la solución por sí mismo." },
  { question: "¿Qué puede controlar la familia?", answer: "Desde el panel para padres podés ver tiempo de uso, precisión, racha de días y progreso por materia, además de gestionar el acceso y contratar más materias cuando quieras." },
  { question: "¿Dónde funciona?", answer: "Es una aplicación web. Se accede online desde un navegador moderno en ordenador, tableta o móvil, sin instalar un programa especial." },
  { question: "¿Qué pasa apenas termino de pagar?", answer: "El acceso se activa de inmediato. Te llega un correo con la confirmación de la compra y un enlace para crear el usuario con el que tu hijo/a va a entrar a la plataforma. Todo el proceso es automático, sin esperar a que alguien te responda." },
  { question: "¿Cómo puedo conocer el precio y matricularme?", answer: "Pulsa «Quiero matricularme», elige las materias y verás el precio final al instante. El acceso dura 3 meses: 1–3 materias cuestan $10 cada una, 4–6 cuestan $8, 7–10 cuestan $7 y desde 11 cuestan $6. Después puedes continuar al pago seguro con PayPal." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": SITE_URL + "/#organization",
      name: "Academia Mágica",
      url: SITE_URL,
      email: "businesscatserrano@gmail.com",
      description: "Plataforma educativa gamificada para niños de 4 a 10 años.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": SITE_URL + "/#application",
      name: "Academia Mágica",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      audience: { "@type": "PeopleAudience", suggestedMinAge: 4, suggestedMaxAge: 10 },
      provider: { "@id": SITE_URL + "/#organization" },
      description: "Aprendizaje gamificado con un catálogo creciente de materias, profesores por voz, ejercicios y recompensas. Acceso inmediato y automático tras el pago.",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

function EnrollmentLink({
  className = "",
  children = "Quiero matricularme",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href="/matricula"
      className={"inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#ffd93d] px-7 py-3.5 text-center font-extrabold text-[#3b2a55] shadow-[0_10px_30px_rgba(255,217,61,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#ffd93d] " + className}
    >
      {children}
    </Link>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const { data: catalogData } = await supabase.rpc("get_enrollment_subject_catalog");
  const activeSubjects = (catalogData ?? []) as Subject[];

  return (
    <main className="overflow-hidden bg-[#fffaf3] text-[#3b2a55]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#3b2a55]/10 bg-[#fffaf3]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Link href="/" aria-label="Academia Mágica, inicio" className="font-display text-lg font-extrabold sm:text-2xl">
            <span aria-hidden="true">✨</span> Academia Mágica
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-3">
            <a href="#como-funciona" className="hidden text-sm font-bold text-[#3b2a55]/70 transition hover:text-[#6c5ce7] md:block">Cómo funciona</a>
            <a href="#precios" className="hidden text-sm font-bold text-[#3b2a55]/70 transition hover:text-[#6c5ce7] md:block">Precios</a>
            <a href="#acceso-alumnos" className="rounded-full border-2 border-[#6c5ce7] px-4 py-2 text-sm font-extrabold text-[#6c5ce7] transition hover:bg-[#6c5ce7] hover:text-white sm:px-5">
              Acceso alumnos
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate pt-24 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-[#ff9abd]/20 blur-3xl" />
          <div className="absolute right-[-7rem] top-44 h-96 w-96 rounded-full bg-[#7fe7c4]/25 blur-3xl" />
        </div>
        <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-8 px-5 pb-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pb-20">
          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <p className="mx-auto inline-flex rounded-full bg-[#6c5ce7]/10 px-4 py-2 text-sm font-extrabold text-[#6c5ce7] lg:mx-0">Para niños y niñas de 4 a 10 años</p>
            <h1 className="font-display mt-5 text-balance text-4xl font-extrabold leading-[1.04] sm:text-6xl lg:text-7xl">
              Que aprender deje de ser una pelea y se convierta en su <span className="text-[#6c5ce7]">aventura favorita</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg font-semibold leading-relaxed text-[#3b2a55]/75 sm:text-xl lg:mx-0">
              Academia Mágica transforma un catálogo creciente de materias en retos, profesores que guían y diamantes que dan ganas de seguir. Pagás, el acceso se activa al instante y tu hijo/a ya puede entrar.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <EnrollmentLink className="w-full text-lg sm:w-auto sm:px-9 sm:py-4">Quiero matricularme</EnrollmentLink>
              <a href="#como-funciona" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-7 py-3.5 font-extrabold text-[#6c5ce7] transition hover:bg-[#6c5ce7]/10 sm:w-auto">Ver cómo funciona ↓</a>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-[#3b2a55]/65 lg:justify-start">
              <span>✓ Acceso inmediato tras el pago</span><span>✓ A su ritmo</span><span>✓ Progreso visible</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[640px]">
            <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-[#7fe7c4]/25 via-transparent to-[#ff9abd]/25 blur-3xl" />
                        <span className="absolute -top-12 left-1/2 z-20 -translate-x-1/2 text-7xl drop-shadow-[0_0_22px_rgba(127,231,196,0.9)] sm:-top-14 sm:text-8xl" aria-hidden="true">💎</span>
            <Image
              src="/landing/hero-7-10.webp"
              alt="Alumnos y alumnas de Academia Mágica de 7 a 10 años"
              width={1243}
              height={665}
              priority
              sizes="(min-width: 1024px) 640px, 92vw"
              className="relative z-10 w-full drop-shadow-[0_35px_50px_rgba(59,42,85,0.28)]"
            />
          </div>
        </div>
      </section>

      <section aria-label="Ventajas principales" className="bg-[#3b2a55] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 text-center text-sm font-extrabold sm:grid-cols-4 sm:text-base">
          <p>🎯 Retos por edad</p><p>🎤 Ayuda por voz</p><p>💎 Recompensas con sentido</p><p>⚡ Acceso automático</p>
        </div>
      </section>

      <section aria-label="Respaldo con datos" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-3xl border border-[#3b2a55]/10 bg-white p-6 shadow-sm">
              <p className="font-display text-4xl font-extrabold text-[#6c5ce7]">g = 0,65</p>
              <p className="mt-2 font-bold">Efecto positivo de la gamificación sobre la motivación de alumnos K-12, según un meta-análisis de 2025.</p>
              <a href="https://onlinelibrary.wiley.com/doi/10.1002/pits.70056" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs font-bold text-[#6c5ce7]/70 hover:underline">Kurnaz, Psychology in the Schools, 2025 ↗</a>
            </div>
            <div className="rounded-3xl border border-[#3b2a55]/10 bg-white p-6 shadow-sm">
              <p className="font-display text-4xl font-extrabold text-[#ff6b9d]">6 de 10</p>
              <p className="mt-2 font-bold">Padres con hijos en primaria que dicen tener dificultades para ayudarlos con la tarea.</p>
              <a href="https://familieslearning.org/blog/60-percent-of-parents-struggle-to-help-with-homework-survey-reveals/" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs font-bold text-[#ff6b9d]/70 hover:underline">National Center for Families Learning ↗</a>
            </div>
            <div className="rounded-3xl border border-[#3b2a55]/10 bg-white p-6 shadow-sm">
              <p className="font-display text-4xl font-extrabold text-[#2fae82]">72%</p>
              <p className="mt-2 font-bold">De familias con niños de 2 a 8 años ya usan aplicaciones educativas como parte de su rutina.</p>
              <a href="https://www.abcmouse.com/learn/advice/education-app-statistics-every-parent-should-know/77938" target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs font-bold text-[#2fae82]/70 hover:underline">Age of Learning / ABCmouse, 2025 ↗</a>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Quién está detrás de Academia Mágica" className="px-5 pb-14 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-[#3b2a55]/10 bg-white p-8 shadow-sm sm:p-12">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#f2e9ff] text-4xl" aria-hidden="true">👨‍👧‍👦</div>
            <div>
              <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#ff6b9d]">Por qué existe Academia Mágica</p>
              <p className="mt-3 text-lg font-semibold leading-relaxed text-[#3b2a55]/80">&ldquo;La empecé para mis propios hijos porque no encontraba una plataforma que combinara ejercicios de verdad con algo que ellos quisieran abrir todos los días. La seguimos construyendo materia por materia, probando primero en casa antes de sumar cada novedad.&rdquo;</p>
              <p className="mt-4 font-display font-extrabold text-[#3b2a55]">Pablo Serrano, fundador de Academia Mágica</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#ff6b9d]">La situación que conoces</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-5xl">No le falta capacidad. Le falta una forma de aprender que conecte con él.</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-[#3b2a55]/75">
              <p>Le pides que practique y aparece el «ahora no», el aburrimiento o la frustración. No sos el único: 6 de cada 10 padres con hijos en primaria dicen tener dificultades reales para ayudarlos con la tarea.</p>
              <p>Las pantallas le atraen, pero no siempre encuentras contenido que le aporte algo de verdad.</p>
              <p>Y tú quieres ayudar, aunque no siempre sabes qué ha entendido, dónde se atasca o cómo motivarle sin terminar discutiendo.</p>
            </div>
            <p className="font-display mt-7 rounded-3xl bg-[#ffd93d]/35 p-5 text-xl font-extrabold">La solución no es añadir más deberes. Es cambiar la experiencia de aprender.</p>
          </div>
          <div className="relative min-h-[430px] overflow-hidden rounded-[2.5rem] bg-[#6c5ce7] shadow-2xl">
            <Image src="/classroom/ninos-suelo.jpg" alt="Niños aprendiendo juntos mediante el juego" fill sizes="(min-width: 1024px) 550px, 92vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3b2a55]/80 via-transparent to-transparent" />
            <p className="font-display absolute bottom-0 left-0 max-w-md p-7 text-2xl font-extrabold text-white sm:p-9 sm:text-3xl">Su curiosidad ya está ahí. Vamos a convertirla en aprendizaje.</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 bg-[#6c5ce7] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#ffd93d]">El método de Academia Mágica</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-5xl">Aprende. Recibe ayuda. Gana. Crea. Y quiere volver.</h2>
            <p className="mt-5 text-lg text-white/80">Una rueda de motivación que convierte cada pequeño avance en una razón para seguir practicando.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, index) => (
              <article key={benefit.title} className="rounded-3xl bg-white p-6 text-[#3b2a55] shadow-xl">
                <div className="flex items-center justify-between"><span className="text-4xl" aria-hidden="true">{benefit.icon}</span><span className="font-display text-4xl font-extrabold text-[#6c5ce7]/15">0{index + 1}</span></div>
                <h3 className="font-display mt-5 text-xl font-extrabold">{benefit.title}</h3>
                <p className="mt-3 leading-relaxed text-[#3b2a55]/70">{benefit.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center"><EnrollmentLink>Quiero matricularme</EnrollmentLink></div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#ff6b9d]">Qué va a encontrar dentro</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-5xl">Un currículo que crece con cada alumno</h2>
            <p className="mt-5 text-lg text-[#3b2a55]/70">Temas, prácticas y evaluaciones organizados por edad para construir bases sólidas sin perder la diversión.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {FEATURED_SUBJECTS.map((subject) => (
              <article key={subject.name} className="overflow-hidden rounded-[2rem] border border-[#3b2a55]/10 bg-white shadow-lg">
                <div className={subject.color + " flex h-28 items-center justify-center text-6xl"} aria-hidden="true">{subject.icon}</div>
                <div className="p-7"><h3 className="font-display text-2xl font-extrabold">{subject.name}</h3><p className="mt-3 leading-relaxed text-[#3b2a55]/70">{subject.text}</p></div>
              </article>
            ))}
          </div>
          {activeSubjects.length > 0 ? (
            <div className="mt-10 rounded-[2rem] border border-[#6c5ce7]/15 bg-[#f2e9ff] p-5 sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-[#6c5ce7]">Catálogo actualizado automáticamente</p>
                  <h3 className="font-display mt-1 text-2xl font-extrabold">Todas las materias disponibles</h3>
                </div>
                <p className="font-bold text-[#3b2a55]/60">{activeSubjects.length} materias activas</p>
              </div>
              <p className="mt-3 text-[#3b2a55]/70">Pulsa una materia para abrir la matrícula con ella ya seleccionada. Si añadimos una materia nueva y la activamos, aparecerá aquí y en el selector de matrícula sin tocar esta página.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeSubjects.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/matricula?materia=${encodeURIComponent(subject.slug)}#materias`}
                    className="group flex min-h-16 items-center gap-3 rounded-2xl border-2 border-white bg-white px-4 py-3 font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:border-[#6c5ce7]/40 hover:shadow-md focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#6c5ce7]"
                  >
                    <span className="text-2xl" aria-hidden="true">{subject.icon ?? "✨"}</span>
                    <span>{subject.name}</span>
                    <span className="ml-auto text-[#6c5ce7] transition group-hover:translate-x-1" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-7 text-center text-sm font-bold text-[#3b2a55]/55">Consulta las materias disponibles dentro del formulario de matrícula.</p>
          )}
        </div>
      </section>

      <section id="precios" className="scroll-mt-20 bg-[#3b2a55] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#7fe7c4]">Precio simple, sin sorpresas</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-5xl">Cuantas más materias, menos paga cada una</h2>
            <p className="mt-5 text-lg text-white/75">Un solo pago cubre {ENROLLMENT_ACCESS_MONTHS} meses de acceso completo. Elegís las materias en la matrícula y ves el total antes de pagar, sin cobros escondidos.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-4">
            {ENROLLMENT_PRICE_TIERS.map((tier) => (
              <div key={tier.label} className="rounded-3xl bg-white/10 p-6 text-center">
                <p className="font-bold text-white/65">{tier.label}</p>
                <p className="font-display mt-2 text-4xl font-extrabold text-[#ffd93d]">${tier.unitPriceUsd}</p>
                <p className="mt-1 text-sm font-bold text-white/55">por materia</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-[2rem] bg-white p-7 text-center text-[#3b2a55] sm:p-9">
            <p className="font-display text-xl font-extrabold sm:text-2xl">Ejemplo: 3 materias = ${3 * ENROLLMENT_PRICE_TIERS[0].unitPriceUsd} por {ENROLLMENT_ACCESS_MONTHS} meses (unos ${Math.round((3 * ENROLLMENT_PRICE_TIERS[0].unitPriceUsd) / ENROLLMENT_ACCESS_MONTHS)}/mes)</p>
            <p className="mt-2 text-[#3b2a55]/65">Podés sumar más materias cuando quieras: cuantas más elijas, menos paga cada una.</p>
          </div>
          <div className="mt-10 text-center"><EnrollmentLink>Quiero matricularme</EnrollmentLink></div>
        </div>
      </section>

      <section className="bg-[#f2e9ff] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.95fr_1.05fr]">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-56 overflow-hidden rounded-[2rem] shadow-xl sm:h-72"><Image src="/classroom/tutoria-nino-profesor.jpg" alt="Profesor guiando a un alumno" fill sizes="280px" className="object-cover" /></div>
            <div className="relative mt-10 h-56 overflow-hidden rounded-[2rem] shadow-xl sm:h-72"><Image src="/classroom/tutoria-profesora-nina.jpg" alt="Profesora acompañando a una alumna" fill sizes="280px" className="object-cover" /></div>
          </div>
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#6c5ce7]">Un profesor a un micrófono de distancia</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-5xl">No le damos la respuesta. Le enseñamos a encontrarla.</h2>
            <p className="mt-6 text-lg leading-relaxed text-[#3b2a55]/75">Cuando aparece una duda, puede escribirla o decirla en voz alta. El profesor conoce la materia y el ejercicio que está resolviendo, y responde con preguntas, ejemplos y pistas pequeñas.</p>
            <ul className="mt-7 space-y-3 font-bold text-[#3b2a55]/80"><li>✓ Explicaciones adaptadas a su edad</li><li>✓ Ayuda disponible dentro del ejercicio</li><li>✓ Pensamiento y autonomía antes que respuestas fáciles</li></ul>
          </div>
        </div>
      </section>

      <section className="bg-[#3b2a55] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#7fe7c4]">También está pensado para ti</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-5xl">Acompaña sin tener que adivinar qué está pasando</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/75">Desde el panel familiar puedes ver actividad, progreso y rendimiento; asignar materias, gestionar el acceso y reconocer el esfuerzo con diamantes.</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/10 p-5"><p className="text-3xl">📊</p><p className="mt-2 font-extrabold">Métricas claras</p></div>
              <div className="rounded-3xl bg-white/10 p-5"><p className="text-3xl">🎯</p><p className="mt-2 font-extrabold">Materias a medida</p></div>
              <div className="rounded-3xl bg-white/10 p-5"><p className="text-3xl">🏅</p><p className="mt-2 font-extrabold">Premios y motivación</p></div>
              <div className="rounded-3xl bg-white/10 p-5"><p className="text-3xl">🔒</p><p className="mt-2 font-extrabold">Acceso gestionado</p></div>
            </div>
          </div>
          <div className="relative min-h-[430px] overflow-hidden rounded-[2.5rem] border-8 border-white/10">
            <Image src="/classroom/ninos-saltando.jpg" alt="Niños celebrando que han aprendido" fill sizes="(min-width: 1024px) 550px, 92vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3b2a55]/75 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/95 p-5 text-[#3b2a55] shadow-xl"><p className="font-display text-xl font-extrabold">Menos perseguir. Más celebrar.</p><p className="mt-1 text-sm font-semibold text-[#3b2a55]/65">Porque sabes qué ha conseguido y dónde necesita apoyo.</p></div>
          </div>
        </div>
      </section>

      <section aria-label="Dudas frecuentes antes de matricularte" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#ff6b9d]">Antes de decidir</p>
            <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-5xl">Las dudas más habituales, respondidas con datos</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {OBJECTIONS.map((item) => (
              <article key={item.title} className="rounded-3xl border border-[#3b2a55]/10 bg-white p-6 shadow-sm">
                <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                <h3 className="font-display mt-3 text-lg font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3b2a55]/70">{item.text}</p>
                {item.source && (
                  <a href={item.source.href} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs font-bold text-[#6c5ce7]/70 hover:underline">{item.source.label} ↗</a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center"><p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#ff6b9d]">Preguntas frecuentes</p><h2 className="font-display mt-3 text-3xl font-extrabold sm:text-5xl">Todo lo demás que quizás te preguntes</h2></div>
          <div className="mt-10 space-y-4">
            {FAQS.map((item) => (
              <details key={item.question} className="group rounded-3xl border border-[#3b2a55]/10 bg-white p-6 shadow-sm">
                <summary className="font-display flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold marker:content-none">{item.question}<span className="text-2xl text-[#6c5ce7] transition group-open:rotate-45" aria-hidden="true">+</span></summary>
                <p className="mt-4 max-w-3xl leading-relaxed text-[#3b2a55]/70">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Recibir novedades" className="px-5 pb-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <LandingLeadCapture />
        </div>
      </section>

      <section id="acceso-alumnos" className="scroll-mt-20 bg-[#f2e9ff] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#6c5ce7]">¿Ya sos parte de Academia Mágica?</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-4xl">Entrá directo desde acá, sin buscar otra página</h2>
            <p className="mt-4 text-lg leading-relaxed text-[#3b2a55]/70">Si tu hijo/a ya tiene usuario, escribí su nombre de usuario y su PIN acá mismo. Si todavía no se matriculó, hacelo en un par de minutos y el acceso queda listo al instante.</p>
          </div>
          <StudentQuickLogin />
        </div>
      </section>

      <section className="scroll-mt-20 px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6c5ce7] via-[#755ee5] to-[#ff6b9d] px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#ffd93d]/25 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-[#ffd93d]">El siguiente paso</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-extrabold sm:text-5xl">¿Quieres que aprender sea el momento que tu hijo espera?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">Elegí las materias, pagá con PayPal y el acceso queda activo al instante: te llega un correo con el enlace para crear el usuario de tu hijo/a. Sin esperas, sin trámites manuales.</p>
            <div className="mt-8"><EnrollmentLink className="text-lg sm:px-10 sm:py-4">Quiero matricularme</EnrollmentLink></div>
            <p className="mt-4 text-sm font-semibold text-white/70">Pago seguro con PayPal · Acceso inmediato · Duración de 3 meses</p>
          </div>
        </div>
      </section>

            <footer className="bg-[#2b1d40] px-5 py-10 text-white/65 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div><p className="font-display text-xl font-extrabold text-white">✨ Academia Mágica</p><p className="mt-1 text-sm">Aprender jugando es posible.</p></div>
          <div className="flex flex-wrap justify-center gap-5 text-sm font-bold">
            <a href="mailto:admin@academiamagicaedu.com" className="hover:text-white">Contacto</a>
            <a href="#acceso-alumnos" className="hover:text-white">Acceso alumnos</a>
            <Link href="/login" className="hover:text-white">Administración</Link>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-white/40 sm:text-left">Academia Mágica es propiedad de Telion Empresa Centro Americana. Contacto: admin@academiamagicaedu.com</p>
      </footer>
    </main>
  );
}
