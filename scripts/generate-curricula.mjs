import { writeFileSync } from "node:fs";

const spanish = {
  4: [
    ["Escuchar con atención", "Escuchar hasta el final ayuda a comprender mensajes sencillos."],
    ["Turnos de conversación", "Conversar implica escuchar y esperar el turno para hablar."],
    ["Palabras para nombrar", "Las palabras sirven para nombrar personas, animales, lugares y objetos."],
    ["Rimas y sonidos", "Dos palabras riman cuando sus terminaciones suenan de forma parecida."],
    ["Las cinco vocales", "Las vocales del español son a, e, i, o y u."],
    ["Sonidos al inicio", "Podemos reconocer palabras que comienzan con el mismo sonido."],
    ["Mi nombre escrito", "El nombre propio empieza con letra mayúscula."],
    ["Trazos que preparan", "Los trazos de izquierda a derecha preparan para escribir letras y palabras."],
    ["Ordenar un cuento", "Un cuento sencillo tiene un comienzo, algo que sucede y un final."],
    ["Cuidar y disfrutar los libros", "Los libros se miran en orden y se cuidan para poder volver a leerlos."],
  ],
  5: [
    ["El alfabeto", "El alfabeto reúne las letras que usamos para escribir palabras en español."],
    ["Vocales y consonantes", "Las letras se agrupan en vocales y consonantes."],
    ["Separar en sílabas", "Las palabras pueden dividirse en golpes de voz llamados sílabas."],
    ["Unir sonidos y letras", "Relacionar cada sonido con su letra ayuda a leer palabras nuevas."],
    ["Palabras frecuentes", "Reconocer palabras de uso frecuente hace que la lectura sea más fluida."],
    ["Construir una oración", "Una oración expresa una idea completa con palabras ordenadas."],
    ["Mayúscula y punto", "Una oración escrita comienza con mayúscula y termina con punto."],
    ["Describir lo que veo", "Describir es decir cómo es una persona, un animal, un lugar o un objeto."],
    ["Personajes y lugares", "En los cuentos podemos identificar quién participa y dónde sucede la historia."],
    ["Contar una experiencia", "Una experiencia se cuenta siguiendo un orden comprensible."],
  ],
  6: [
    ["Letras y sonidos del español", "Las letras representan sonidos y algunas combinaciones forman un solo sonido."],
    ["Sílabas directas e inversas", "Las sílabas pueden organizar vocales y consonantes de distintas maneras."],
    ["El sustantivo", "El sustantivo nombra personas, animales, lugares, objetos o ideas."],
    ["Artículos: el, la, los y las", "El artículo acompaña al sustantivo y concuerda con él."],
    ["Singular y plural", "El singular nombra uno y el plural nombra más de uno."],
    ["Los verbos de acción", "El verbo expresa una acción, un estado o un proceso."],
    ["Oraciones con sentido", "Las palabras de una oración deben estar ordenadas para comunicar una idea clara."],
    ["Comprender información explícita", "La información explícita aparece escrita directamente en el texto."],
    ["Secuencia de hechos", "Ordenar primero, después y al final permite reconstruir una historia."],
    ["Escribir un texto breve", "Un texto breve necesita una idea clara, oraciones relacionadas y revisión."],
  ],
  7: [
    ["C y qu", "Se escribe qu delante de e o i para representar el sonido fuerte de queso y quince."],
    ["G, gu y gü", "Las grafías g, gu y gü cambian según la vocal y el sonido que queremos representar."],
    ["Sustantivos y adjetivos", "El adjetivo explica cómo es el sustantivo y concuerda con él."],
    ["Presente, pasado y futuro", "Los tiempos verbales sitúan la acción en el presente, el pasado o el futuro."],
    ["Oraciones afirmativas, interrogativas y exclamativas", "La intención del hablante determina el tipo de oración y sus signos."],
    ["Coma en enumeraciones", "La coma separa los elementos de una enumeración."],
    ["Idea principal", "La idea principal expresa lo más importante de un texto."],
    ["Inferencias sencillas", "Inferir es unir pistas del texto con lo que ya sabemos."],
    ["Inicio, nudo y desenlace", "Una narración se organiza en inicio, nudo y desenlace."],
    ["Planificar y revisar", "Antes de publicar un texto conviene planificar, escribir, revisar y mejorar."],
  ],
  8: [
    ["Sílaba tónica", "La sílaba tónica es la que pronunciamos con mayor intensidad."],
    ["Agudas, llanas y esdrújulas", "Las palabras se clasifican según la posición de su sílaba tónica."],
    ["Sinónimos y antónimos", "Los sinónimos tienen significado parecido y los antónimos expresan ideas opuestas."],
    ["Sujeto y predicado", "El sujeto indica de quién se habla y el predicado dice algo sobre él."],
    ["Pronombres personales", "Los pronombres personales pueden sustituir nombres de personas o grupos."],
    ["Concordancia verbal", "El verbo concuerda con el sujeto en persona y número."],
    ["El párrafo", "Un párrafo reúne oraciones relacionadas con una misma idea."],
    ["Resumir", "Resumir consiste en expresar las ideas esenciales con menos palabras."],
    ["Textos literarios e informativos", "Los textos literarios crean experiencias y los informativos explican hechos o conocimientos."],
    ["Diálogo y raya", "En una narración, la raya puede señalar la intervención de cada personaje."],
  ],
  9: [
    ["Reglas generales de tilde", "Agudas, llanas y esdrújulas siguen reglas distintas de acentuación gráfica."],
    ["B y v", "La ortografía de b y v se aprende mediante reglas, familias de palabras y consulta."],
    ["G y j", "La elección de g o j depende del sonido, la vocal y las reglas de cada palabra."],
    ["Palabras con h", "La h no representa sonido en español, pero forma parte de la ortografía de muchas palabras."],
    ["Determinantes y pronombres", "El determinante acompaña al nombre y el pronombre puede sustituirlo."],
    ["Conjugar verbos", "Conjugar un verbo es adaptar su forma a la persona, el número, el tiempo y el modo."],
    ["Conectores", "Los conectores relacionan ideas y muestran orden, causa, consecuencia o contraste."],
    ["Hechos y opiniones", "Un hecho puede comprobarse y una opinión expresa una valoración personal."],
    ["Lenguaje poético", "La poesía usa ritmo, imágenes y recursos expresivos para comunicar de forma especial."],
    ["Texto informativo", "Un texto informativo presenta datos organizados con claridad y fuentes adecuadas."],
  ],
  10: [
    ["Diptongos e hiatos", "En un diptongo dos vocales pertenecen a una sílaba y en un hiato a sílabas distintas."],
    ["Palabras homófonas", "Las palabras homófonas suenan igual o parecido, pero tienen distinta escritura y significado."],
    ["Oraciones simples y compuestas", "Una oración compuesta contiene más de una forma verbal en torno a varias proposiciones."],
    ["Estilo directo e indirecto", "El estilo directo reproduce palabras y el indirecto las integra en el relato."],
    ["Modos verbales", "El indicativo presenta hechos, el subjuntivo posibilidades y el imperativo órdenes o peticiones."],
    ["Cohesión y referencias", "Pronombres, repeticiones controladas y conectores mantienen unido un texto."],
    ["Géneros textuales", "Narrar, describir, explicar, instruir y argumentar responden a propósitos diferentes."],
    ["Lectura crítica", "Leer críticamente implica distinguir propósito, evidencia, opinión y fiabilidad."],
    ["Argumentar con razones", "Una opinión resulta más sólida cuando incluye razones y evidencias pertinentes."],
    ["Editar y publicar", "Editar es revisar contenido, organización, vocabulario, ortografía y presentación."],
  ],
};

const body = {
  4: [
    ["Partes externas del cuerpo", "Cabeza, tronco, brazos y piernas son grandes partes externas del cuerpo."],
    ["Los cinco sentidos", "Vista, oído, olfato, gusto y tacto nos ayudan a conocer el entorno."],
    ["Moverse con el cuerpo", "Huesos, articulaciones y músculos colaboran para que podamos movernos."],
    ["Respirar", "Al respirar entra y sale aire de nuestro cuerpo."],
    ["El corazón late", "El corazón late continuamente para impulsar la sangre."],
    ["Manos limpias", "Lavarse las manos con agua y jabón ayuda a retirar suciedad y microbios."],
    ["Comer variado y beber agua", "El cuerpo necesita alimentos variados y agua para crecer y funcionar."],
    ["Dormir y descansar", "Dormir ayuda al cuerpo y al cerebro a recuperarse y aprender."],
    ["Reconocer emociones", "Las emociones se pueden notar en el cuerpo, nombrar y compartir con una persona de confianza."],
    ["Mi cuerpo merece respeto", "Cada persona decide sobre su espacio corporal y puede pedir ayuda si algo le incomoda."],
  ],
  5: [
    ["El esqueleto", "El esqueleto sostiene el cuerpo y protege órganos importantes."],
    ["Los músculos", "Los músculos se contraen y se relajan para producir movimiento."],
    ["El cerebro", "El cerebro recibe información y coordina muchas acciones del cuerpo."],
    ["El corazón y la sangre", "El corazón impulsa la sangre por todo el cuerpo."],
    ["Los pulmones", "Los pulmones participan en el intercambio de gases durante la respiración."],
    ["El viaje de los alimentos", "La digestión transforma los alimentos para que el cuerpo aproveche sus nutrientes."],
    ["Dientes y boca", "Los dientes cortan y trituran alimentos, y necesitan limpieza diaria."],
    ["La piel", "La piel recubre y protege el cuerpo y permite sentir el contacto y la temperatura."],
    ["Microbios e higiene", "Algunos microbios pueden enfermarnos y la higiene reduce su propagación."],
    ["Rutinas saludables", "Alimentación variada, movimiento, higiene y descanso favorecen la salud."],
  ],
  6: [
    ["Células, tejidos y órganos", "Las células forman tejidos, los tejidos forman órganos y los órganos colaboran en sistemas."],
    ["Huesos y articulaciones", "Los huesos sostienen y las articulaciones permiten movimiento entre ellos."],
    ["Músculos y tendones", "Los tendones unen músculos y huesos para transmitir el movimiento."],
    ["Órganos de los sentidos", "Ojos, oídos, nariz, lengua y piel reciben diferentes estímulos."],
    ["Circulación", "La sangre transporta oxígeno y nutrientes por los vasos sanguíneos."],
    ["Respiración", "El sistema respiratorio incorpora oxígeno y elimina dióxido de carbono."],
    ["Digestión", "Boca, estómago e intestinos intervienen en la transformación y absorción de alimentos."],
    ["Nutrientes y energía", "Los alimentos aportan nutrientes que cumplen funciones diferentes en el organismo."],
    ["Defensas y prevención", "La higiene, las vacunas y los hábitos saludables ayudan a prevenir enfermedades."],
    ["Seguridad y pedir ayuda", "Ante una lesión o una emergencia hay que avisar a una persona adulta y seguir instrucciones seguras."],
  ],
  7: [
    ["Sistema nervioso", "El sistema nervioso recibe información, la procesa y coordina respuestas."],
    ["Sistema locomotor", "Huesos, articulaciones y músculos trabajan juntos para sostener y mover el cuerpo."],
    ["Sistema circulatorio", "Corazón, sangre y vasos forman el sistema que distribuye sustancias por el cuerpo."],
    ["Sistema respiratorio", "Las vías respiratorias y los pulmones permiten el intercambio de oxígeno y dióxido de carbono."],
    ["Sistema digestivo", "El sistema digestivo descompone alimentos y absorbe nutrientes."],
    ["Sistema excretor", "Los riñones filtran la sangre y participan en la formación de la orina."],
    ["Piel y temperatura", "La piel protege y ayuda a regular la temperatura corporal."],
    ["Sistema inmunitario", "El sistema inmunitario reconoce y combate muchos agentes que pueden causar enfermedad."],
    ["Crecimiento y cambios", "El cuerpo cambia al crecer y cada persona sigue su propio ritmo."],
    ["Hábitos que cuidan sistemas", "Actividad física, alimentación variada, descanso e higiene benefician a varios sistemas a la vez."],
  ],
  8: [
    ["Organización del cuerpo", "Células, tejidos, órganos y sistemas forman niveles de organización relacionados."],
    ["Estructura del esqueleto", "El esqueleto axial y el apendicular sostienen, protegen y facilitan el movimiento."],
    ["Tipos de músculos", "El músculo esquelético, el liso y el cardíaco realizan funciones distintas."],
    ["Cerebro, médula y nervios", "El sistema nervioso central se comunica con el cuerpo mediante nervios."],
    ["Corazón y vasos", "Arterias, venas y capilares conducen sangre con funciones complementarias."],
    ["Vías respiratorias y alvéolos", "El aire llega a los alvéolos, donde se intercambian gases con la sangre."],
    ["Órganos digestivos", "Cada órgano digestivo cumple una función en la digestión y la absorción."],
    ["Riñones y equilibrio de agua", "Los riñones filtran desechos y ayudan a regular agua y sales."],
    ["Barreras y defensas", "Piel, mucosas y células defensivas forman distintas líneas de protección."],
    ["Cambios de la pubertad", "La pubertad incluye cambios físicos y emocionales normales que aparecen a ritmos diferentes."],
  ],
  9: [
    ["Sistemas que cooperan", "Los sistemas corporales dependen unos de otros para mantener vivo el organismo."],
    ["Neuronas y respuestas", "Las neuronas transmiten señales que permiten percibir, pensar y responder."],
    ["Sangre y circulación doble", "La sangre circula entre corazón, pulmones y resto del cuerpo en circuitos conectados."],
    ["Intercambio de gases", "Oxígeno y dióxido de carbono se intercambian entre alvéolos y capilares."],
    ["Absorción de nutrientes", "La mayor parte de los nutrientes se absorbe a través del intestino delgado."],
    ["Filtración renal", "Los riñones filtran la sangre, recuperan sustancias útiles y eliminan desechos."],
    ["Inmunidad y vacunas", "Las vacunas entrenan al sistema inmunitario para reconocer agentes concretos."],
    ["Hormonas y crecimiento", "Las hormonas son mensajeros químicos que coordinan procesos como crecimiento y pubertad."],
    ["Salud y prevención", "Prevenir incluye hábitos saludables, vacunas, revisiones y evitar riesgos conocidos."],
    ["Primeros auxilios básicos", "Los primeros auxilios empiezan por proteger, avisar a emergencias y ayudar sin ponerse en riesgo."],
  ],
  10: [
    ["Homeostasis", "La homeostasis mantiene condiciones internas relativamente estables pese a cambios externos."],
    ["Especialización celular", "Las células especializadas tienen estructuras adaptadas a funciones concretas."],
    ["Movimiento y palancas", "Huesos, articulaciones y músculos forman palancas que transforman fuerza en movimiento."],
    ["Coordinación nerviosa", "Receptores, centros nerviosos y efectores forman circuitos de respuesta."],
    ["Componentes de la sangre", "Plasma, glóbulos rojos, glóbulos blancos y plaquetas cumplen funciones diferentes."],
    ["Respiración y energía", "El oxígeno permite a las células liberar energía de los nutrientes y produce dióxido de carbono."],
    ["Digestión y metabolismo", "La digestión obtiene moléculas absorbibles y el metabolismo las transforma y utiliza."],
    ["Excreción y equilibrio interno", "Riñones, pulmones y piel eliminan sustancias y ayudan al equilibrio interno."],
    ["Respuesta inmunitaria", "La inmunidad combina respuestas rápidas generales y respuestas específicas con memoria."],
    ["Reproducción, pubertad y respeto", "Comprender la reproducción y la pubertad exige información científica, privacidad, consentimiento y respeto."],
  ],
};

const subjects = [
  {
    slug: "espanol",
    version: "espanol-4-10-v1",
    sources: [
      "https://www.boe.es/buscar/act.php?id=BOE-A-2022-1654",
      "https://www.boe.es/buscar/act.php?id=BOE-A-2022-3296",
      "https://www.rae.es/ortografía",
    ],
    data: spanish,
  },
  {
    slug: "cuerpo-humano",
    version: "cuerpo-humano-4-10-v1",
    sources: [
      "https://www.boe.es/buscar/act.php?id=BOE-A-2022-1654",
      "https://www.boe.es/buscar/act.php?id=BOE-A-2022-3296",
      "https://www.niams.nih.gov/health-topics/educational-resources",
      "https://www.cdc.gov/child-development/about/index.html",
      "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    ],
    data: body,
  },
];

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sqlJson = (value) => `${sqlString(JSON.stringify(value))}::jsonb`;
const ageBracket = (age) => (age <= 6 ? "4-7" : "7-10");

const rows = [];
for (const subject of subjects) {
  for (const [ageText, topics] of Object.entries(subject.data)) {
    const age = Number(ageText);
    topics.forEach(([name, objective], index) => {
      const peers = topics.filter((_, peerIndex) => peerIndex !== index).map((entry) => entry[1]);
      rows.push(`(${[
        sqlString(subject.slug),
        sqlString(subject.version),
        age,
        sqlString(ageBracket(age)),
        index + 1,
        sqlString(name),
        sqlString(objective),
        sqlString(age === 4 && index === 0 ? "Ninguno; es un punto de inicio." : `Conocimientos apropiados para ${age} años y los temas anteriores del itinerario.`),
        sqlJson(subject.sources),
        sqlString(peers[0]),
        sqlString(peers[1]),
        sqlString(peers[2]),
      ].join(", ")})`);
    });
  }
}

const migration = `-- Currículos completos y trazables de Español y Cuerpo Humano (4-10 años).
-- Fuentes: enseñanzas mínimas oficiales de España, RAE y organismos sanitarios públicos.

alter table public.topics add column if not exists curriculum_version text;
alter table public.topics add column if not exists learning_objective text;
alter table public.topics add column if not exists source_refs jsonb not null default '[]'::jsonb;

do $$
declare
  r record;
  v_subject_id uuid;
  v_topic_id uuid;
  v_lesson_1 uuid;
  v_lesson_2 uuid;
begin
  create temporary table curriculum_seed (
    subject_slug text not null,
    curriculum_version text not null,
    recommended_age smallint not null,
    age_bracket public.age_bracket not null,
    sort_order integer not null,
    topic_name text not null,
    objective text not null,
    prerequisites text,
    source_refs jsonb not null,
    distractor_1 text not null,
    distractor_2 text not null,
    distractor_3 text not null
  ) on commit drop;

  insert into curriculum_seed values
    ${rows.join(",\n    ")};

  -- El contenido provisional se conserva para auditoría y progreso histórico, pero se oculta.
  update public.topics t
  set active = false,
      curriculum_version = coalesce(t.curriculum_version, 'legacy-v1')
  from public.subjects s
  where s.id = t.subject_id
    and s.slug in ('espanol', 'cuerpo-humano')
    and coalesce(t.curriculum_version, '') not in ('espanol-4-10-v1', 'cuerpo-humano-4-10-v1');

  -- Permite volver a ensayar la migración sin acumular duplicados antes de su publicación.
  delete from public.topics t
  using public.subjects s
  where s.id = t.subject_id
    and t.curriculum_version in ('espanol-4-10-v1', 'cuerpo-humano-4-10-v1');

  for r in select * from curriculum_seed order by subject_slug, recommended_age, sort_order loop
    select id into v_subject_id from public.subjects where slug = r.subject_slug;
    if v_subject_id is null then
      raise exception 'No existe la asignatura %', r.subject_slug;
    end if;

    insert into public.topics (
      subject_id, name, min_age, max_age, sort_order, active, age_bracket,
      recommended_age, prerequisites, curriculum_version, learning_objective, source_refs
    ) values (
      v_subject_id, r.topic_name, r.recommended_age, r.recommended_age,
      r.sort_order, true, r.age_bracket, r.recommended_age, r.prerequisites,
      r.curriculum_version, r.objective, r.source_refs
    ) returning id into v_topic_id;

    insert into public.lessons (topic_id, name, sort_order, active)
    values (v_topic_id, 'Descubrir: ' || r.topic_name, 1, true)
    returning id into v_lesson_1;

    insert into public.lessons (topic_id, name, sort_order, active)
    values (v_topic_id, 'Aplicar: ' || r.topic_name, 2, true)
    returning id into v_lesson_2;

    insert into public.exercises
      (topic_id, lesson_id, type, difficulty, prompt, options, correct_answer, explanation, diamond_reward, active, is_exam)
    values
      (v_topic_id, v_lesson_1, 'multiple_choice', 1,
       jsonb_build_object('text', '¿Qué idea resume mejor «' || r.topic_name || '»?'),
       jsonb_build_array(r.objective, r.distractor_1, r.distractor_2, r.distractor_3),
       jsonb_build_object('value', r.objective), r.objective, 5, true, false),
      (v_topic_id, v_lesson_1, 'true_false', 1,
       jsonb_build_object('text', r.objective || ' ¿Verdadero o falso?'),
       jsonb_build_array('Verdadero', 'Falso'), jsonb_build_object('value', 'Verdadero'),
       r.objective, 5, true, false),
      (v_topic_id, v_lesson_1, 'true_false', 2,
       jsonb_build_object('text', r.distractor_1 || ' ¿Esta afirmación explica «' || r.topic_name || '»?'),
       jsonb_build_array('Verdadero', 'Falso'), jsonb_build_object('value', 'Falso'),
       'No. La idea correcta es: ' || r.objective, 5, true, false),
      (v_topic_id, v_lesson_2, 'multiple_choice', 2,
       jsonb_build_object('text', 'Elige el aprendizaje correcto sobre «' || r.topic_name || '».'),
       jsonb_build_array(r.distractor_2, r.objective, r.distractor_3, r.distractor_1),
       jsonb_build_object('value', r.objective), r.objective, 5, true, false),
      (v_topic_id, v_lesson_2, 'true_false', 2,
       jsonb_build_object('text', 'Para explicar «' || r.topic_name || '» podemos decir: ' || r.objective),
       jsonb_build_array('Verdadero', 'Falso'), jsonb_build_object('value', 'Verdadero'),
       r.objective, 5, true, false),
      (v_topic_id, v_lesson_2, 'multiple_choice', 2,
       jsonb_build_object('text', '¿Cuál de estas opciones pertenece a este tema?'),
       jsonb_build_array(r.distractor_3, r.distractor_1, r.objective, r.distractor_2),
       jsonb_build_object('value', r.objective), r.objective, 5, true, false),
      (v_topic_id, null, 'multiple_choice', 3,
       jsonb_build_object('text', 'Test final: ¿cuál es la idea clave de «' || r.topic_name || '»?'),
       jsonb_build_array(r.distractor_1, r.objective, r.distractor_2, r.distractor_3),
       jsonb_build_object('value', r.objective), r.objective, 8, true, true),
      (v_topic_id, null, 'true_false', 3,
       jsonb_build_object('text', r.distractor_2 || ' ¿Resume correctamente «' || r.topic_name || '»?'),
       jsonb_build_array('Verdadero', 'Falso'), jsonb_build_object('value', 'Falso'),
       'No. La respuesta correcta es: ' || r.objective, 8, true, true),
      (v_topic_id, null, 'multiple_choice', 3,
       jsonb_build_object('text', 'Completa el test eligiendo la explicación precisa.'),
       jsonb_build_array(r.distractor_3, r.distractor_2, r.distractor_1, r.objective),
       jsonb_build_object('value', r.objective), r.objective, 8, true, true);
  end loop;

  if (select count(*) from curriculum_seed) <> 140 then
    raise exception 'Se esperaban 140 temas curriculares';
  end if;
end $$;

create index if not exists topics_curriculum_version_idx
  on public.topics (curriculum_version, recommended_age, sort_order)
  where active = true;

comment on column public.topics.curriculum_version is 'Versión auditable del currículo al que pertenece el tema.';
comment on column public.topics.learning_objective is 'Objetivo de aprendizaje observable del tema.';
comment on column public.topics.source_refs is 'Referencias públicas empleadas para diseñar el contenido.';
`;

writeFileSync(new URL("../supabase/migrations/20260811150000_spanish_human_body_curricula.sql", import.meta.url), migration, "utf8");
console.log(`Generated ${rows.length} topics and ${rows.length * 9} exercises.`);
