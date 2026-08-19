-- Cada profesor da un minimo de 6 materias y cada materia tiene un minimo
-- de 2 profesores para elegir. El saludo de presentacion (greeting) pasa
-- de estar en `teachers` (uno solo por profesor, sin importar la materia)
-- a estar en `teacher_subjects` (uno por combinacion profesor+materia), asi
-- el saludo siempre menciona la materia correcta en la que estas.
--
-- Aplicado directamente en produccion en 3 pasos (por una restriccion de
-- Postgres al cambiar el tipo de retorno de una funcion existente):
--   1) teacher_multi_subject_greetings_data
--   2) teacher_multi_subject_greetings_fn
--   3) teacher_multi_subject_greetings_fix_originals
-- Este archivo documenta el resultado combinado de los 3 pasos.

-- 1) Columnas de saludo por combinacion profesor+materia.
alter table teacher_subjects
  add column if not exists greeting_template text,
  add column if not exists greeting_es text;

-- 2) Backfill inicial desde `teachers` (deja el saludo generico del
-- profesor en cada fila existente; se corrige por materia en el paso 4).
update teacher_subjects ts
set greeting_template = t.greeting_template,
    greeting_es = t.greeting_es
from teachers t
where t.id = ts.teacher_id
  and ts.greeting_template is null;

-- 3) Nuevas combinaciones profesor+materia (segundo profesor por materia +
-- Como Aprendemos, que no tenia ninguno) con saludo propio para esa materia.
insert into teacher_subjects (teacher_id, subject_id, greeting_template, greeting_es) values
  ('7ad8206c-dd16-4ce0-9185-8a0459d06d42', 'b324512a-4e29-4eec-915f-40a68c7f82a8', '¡Hola {name}! Soy Amara, tu profesora de Español. Hoy vamos a jugar con las palabras y descubrir historias increíbles. ¡Vamos allá! 📖', null),
  ('f4f57246-930c-452e-8a48-3968cc974ed6', 'aa60427a-0737-4b22-9486-3111cb48fa49', '¡Hola {name}! Soy Diego, tu profesor de Matemáticas. Vamos a resolver números como si fueran un mapa por descubrir. ¡Prepará tu brújula! 🔢', null),
  ('fb17ab22-122b-4773-83dd-7db86e67f419', 'ad420b3c-1fbd-4d3d-a21f-8ade2db6beaa', '¡Hola {name}! Soy Kenji, tu profesor de Geometría. Hoy vamos a descubrir las formas que se esconden en el mundo que nos rodea. ¡Prestá atención! 📐', null),
  ('138c2038-08b3-49b9-9ef4-7644167b8d28', 'e3faf308-6aef-42b0-a1df-6cb60e3b748c', '¡Hola {name}! Soy Lukas, tu profesor de Fracciones y Decimales. Vamos a partir números como quien hace un experimento. ¡A experimentar! 🧪', null),
  ('55cb0818-b34b-4fed-847a-137b8b5afdb9', 'd7688b22-f628-400c-8104-e44b3e2e9c72', '¡Hola {name}! Soy María José, tu profesora de Lógica y Razonamiento. Vamos a pensar juntos y encontrar la pista escondida en cada problema. ¡Vamos! 🧠', null),
  ('138c2038-08b3-49b9-9ef4-7644167b8d28', 'edce7b9a-b0b6-4f23-a6c2-9adb312da995', '¡Hola {name}! Soy Lukas, tu profesor de Ciencias Naturales. Hoy vamos a descubrir cómo funciona la naturaleza a nuestro alrededor. ¡A experimentar! 🌿', null),
  ('fb17ab22-122b-4773-83dd-7db86e67f419', '0adbc514-5180-44ce-893c-06269bfc8e38', '¡Hola {name}! Soy Kenji, tu profesor de Física Básica. Hoy vamos a descubrir cosas increíbles sobre cómo se mueve el mundo. ¡Prestá atención! 🔬', null),
  ('f4f57246-930c-452e-8a48-3968cc974ed6', 'c402f796-a4d5-43ad-94a0-8dff8e04b42f', '¡Hola {name}! Soy Diego, tu profesor de Química Básica. Vamos a explorar mezclas y reacciones como si fueran un mapa del tesoro. ¡Prepará tu mapa! 🧪', null),
  ('a32bfc0a-373b-444c-8979-9f6a47a1fbbf', 'df63cb1d-7c54-48c3-bafc-85d24ace4711', '¡Hola {name}! Soy Susan, tu profesora de Cuerpo Humano. Hoy vamos a leer las pistas que nos da nuestro propio cuerpo. ¡Empecemos! 🫀', null),
  ('f4f57246-930c-452e-8a48-3968cc974ed6', '50ef7787-0845-4fa6-aadb-7e91862a7499', '¡Hola {name}! Soy Diego, tu profesor de Historia. Vamos a viajar al pasado para descubrir grandes historias del mundo. ¡Prepará tu mapa! 🏛️', null),
  ('7ad8206c-dd16-4ce0-9185-8a0459d06d42', '62a552ff-9d0f-4407-959b-423554bdcb90', '¡Hola {name}! Soy Amara, tu profesora de Geografía. Hoy vamos a explorar el mundo, sus montañas, ríos y océanos. ¡Vamos allá! 🗺️', null),
  ('7ad8206c-dd16-4ce0-9185-8a0459d06d42', 'f89e66bb-0eb7-4ba2-a082-b7146a8f5ca1', '¡Hola {name}! Soy Amara, tu profesora de Educación Cívica. Vamos a descubrir juntos cómo construir un mundo mejor. ¡Vamos allá! 🏛️', null),
  ('f4f57246-930c-452e-8a48-3968cc974ed6', 'e6e13f8b-eb75-4995-a09e-5f6647e57940', '¡Hola {name}! Soy Diego, tu profesor de Cultura y Tradiciones. Vamos a descubrir costumbres del mundo entero. ¡Prepará tu mapa! 🌍', null),
  ('fb17ab22-122b-4773-83dd-7db86e67f419', 'a44ec0fe-7783-45af-a983-ae855946d571', '¡Hola {name}! Soy Kenji, tu profesor de Lectura Comprensiva. Hoy vamos a descubrir los secretos que se esconden en cada texto. ¡Prestá atención! 📖', null),
  ('7ad8206c-dd16-4ce0-9185-8a0459d06d42', '667a1fd9-aa87-44a0-8b0b-613cdcabf745', '¡Hola {name}! Soy Amara, tu profesora de Escritura Creativa. Vamos a inventar historias increíbles con nuestras propias palabras. ¡Vamos allá! ✍️', null),
  ('a32bfc0a-373b-444c-8979-9f6a47a1fbbf', '6e1d84e5-d946-45f6-9de2-97ba7067ef70', '¡Hola {name}! Soy Susan, tu profesora de Pensamiento Crítico. Hoy vamos a leer entre líneas y pensar con cabeza propia. ¡Empecemos! 🤔', null),
  ('138c2038-08b3-49b9-9ef4-7644167b8d28', 'd1bc75cd-c9e4-41bf-a9d4-8a54b5e5b6fd', '¡Hola {name}! Soy Lukas, tu profesor de Resolución de Problemas. Vamos a resolver desafíos como verdaderos científicos. ¡A experimentar! 🧩', null),
  ('a32bfc0a-373b-444c-8979-9f6a47a1fbbf', '7d49d48c-347a-4ae0-bcb4-0fb318d0e394', '¡Hola {name}! Soy Susan, tu profesora de Educación Artística. Hoy vamos a crear cosas hermosas con mucha imaginación. ¡Empecemos! 🎨', null),
  ('f4f57246-930c-452e-8a48-3968cc974ed6', 'f72cad5f-85ca-406e-966d-5f996f42733e', '¡Hola {name}! Soy Diego, tu profesor de Educación Física. Vamos a movernos y explorar el mundo con el cuerpo. ¡Prepará tu mapa! ⚽', null),
  ('61c86fa4-346a-4939-ab1c-9416ce962a34', '6bb9bcd4-3ed7-49d2-b3da-4140ced6af64', '¡Hola {name}! Soy Lucía, tu profesora de Música. Vamos a descubrir que la música y los números son grandes amigos. ¡Tú podés! 🎵', null),
  ('61c86fa4-346a-4939-ab1c-9416ce962a34', '6bc10746-9f0e-402a-99c1-1f53918cca83', '¡Hola {name}! Soy Lucía, tu profesora de Tecnología e Informática. Vamos a resolver desafíos tecnológicos paso a paso. ¡Tú podés! 💻', null),
  ('7ad8206c-dd16-4ce0-9185-8a0459d06d42', '4279034f-744e-40f4-9d54-97339778a72e', '¡Hola {name}! Soy Amara, tu profesora de Cómo Aprendemos. Vamos a descubrir juntos las mejores formas de aprender. ¡Vamos allá! 🧠', null),
  ('138c2038-08b3-49b9-9ef4-7644167b8d28', '4279034f-744e-40f4-9d54-97339778a72e', '¡Hola {name}! Soy Lukas, tu profesor de Cómo Aprendemos. Vamos a experimentar con distintas formas de pensar y aprender. ¡A experimentar! 🧠', null);

-- 4) Corregir el saludo de las combinaciones que YA existian antes de este
-- cambio: como el saludo original era uno solo por profesor, en los
-- profesores con varias materias mencionaba siempre la misma materia (el
-- backfill del paso 2 arrastro ese mismo problema a todas sus filas). Se
-- corrige cada una con un saludo propio para esa materia especifica.
update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Amara, tu profesora de Música. Vamos a descubrir que los sonidos y los ritmos pueden contar historias increíbles. ¡Vamos allá! 🎵'
where teacher_id = '7ad8206c-dd16-4ce0-9185-8a0459d06d42' and subject_id = '6bb9bcd4-3ed7-49d2-b3da-4140ced6af64';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Diego, tu profesor de Tecnología e Informática. Vamos a resolver desafíos tecnológicos como si fueran un mapa por descubrir. ¡Prepará tu mapa! 💻'
where teacher_id = 'f4f57246-930c-452e-8a48-3968cc974ed6' and subject_id = '6bc10746-9f0e-402a-99c1-1f53918cca83';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Kenji, tu profesor de Ciencias Naturales. Hoy vamos a descubrir cosas increíbles sobre el mundo que nos rodea. ¡Prestá atención! 🌿'
where teacher_id = 'fb17ab22-122b-4773-83dd-7db86e67f419' and subject_id = 'edce7b9a-b0b6-4f23-a6c2-9adb312da995';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Kenji, tu profesor de Cuerpo Humano. Hoy vamos a descubrir los secretos que esconde nuestro propio cuerpo. ¡Prestá atención! 🫀'
where teacher_id = 'fb17ab22-122b-4773-83dd-7db86e67f419' and subject_id = 'df63cb1d-7c54-48c3-bafc-85d24ace4711';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Kenji, tu profesor de Educación Física. Vamos a movernos y descubrir todo lo que nuestro cuerpo puede hacer. ¡Prestá atención! ⚽'
where teacher_id = 'fb17ab22-122b-4773-83dd-7db86e67f419' and subject_id = 'f72cad5f-85ca-406e-966d-5f996f42733e';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Lucía, tu profesora de Fracciones y Decimales. Vamos a partir números en pedacitos, paso a paso. ¡Tú podés! 🍕'
where teacher_id = '61c86fa4-346a-4939-ab1c-9416ce962a34' and subject_id = 'e3faf308-6aef-42b0-a1df-6cb60e3b748c';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Lucía, tu profesora de Geometría. Vamos a descubrir las formas que nos rodean, paso a paso. ¡Tú podés! 📐'
where teacher_id = '61c86fa4-346a-4939-ab1c-9416ce962a34' and subject_id = 'ad420b3c-1fbd-4d3d-a21f-8ade2db6beaa';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Lucía, tu profesora de Lógica y Razonamiento. Vamos a pensar juntos y encontrar la pista escondida. ¡Tú podés! 🧠'
where teacher_id = '61c86fa4-346a-4939-ab1c-9416ce962a34' and subject_id = 'd7688b22-f628-400c-8104-e44b3e2e9c72';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Lukas, tu profesor de Física Básica. Hoy vamos a descubrir cómo se mueve el mundo a nuestro alrededor. ¡A experimentar! 🔬'
where teacher_id = '138c2038-08b3-49b9-9ef4-7644167b8d28' and subject_id = '0adbc514-5180-44ce-893c-06269bfc8e38';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Lukas, tu profesor de Química Básica. Vamos a explorar mezclas y reacciones como verdaderos científicos. ¡A experimentar! 🧪'
where teacher_id = '138c2038-08b3-49b9-9ef4-7644167b8d28' and subject_id = 'c402f796-a4d5-43ad-94a0-8dff8e04b42f';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy María José, tu profesora de Cultura y Tradiciones. Vamos a descubrir costumbres de todo el mundo. ¡Vamos! 🌎'
where teacher_id = '55cb0818-b34b-4fed-847a-137b8b5afdb9' and subject_id = 'e6e13f8b-eb75-4995-a09e-5f6647e57940';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy María José, tu profesora de Educación Artística. Vamos a crear cosas hermosas con mucha imaginación. ¡Vamos! 🎨'
where teacher_id = '55cb0818-b34b-4fed-847a-137b8b5afdb9' and subject_id = '7d49d48c-347a-4ae0-bcb4-0fb318d0e394';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy María José, tu profesora de Educación Cívica. Vamos a pensar juntos cómo construir un mundo mejor. ¡Vamos! 🏛️'
where teacher_id = '55cb0818-b34b-4fed-847a-137b8b5afdb9' and subject_id = 'f89e66bb-0eb7-4ba2-a082-b7146a8f5ca1';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy María José, tu profesora de Pensamiento Crítico. Vamos a pensar con cabeza propia y mirar más allá. ¡Vamos! 🤔'
where teacher_id = '55cb0818-b34b-4fed-847a-137b8b5afdb9' and subject_id = '6e1d84e5-d946-45f6-9de2-97ba7067ef70';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy María José, tu profesora de Resolución de Problemas. Vamos a resolver desafíos paso a paso. ¡Vamos! 🧩'
where teacher_id = '55cb0818-b34b-4fed-847a-137b8b5afdb9' and subject_id = 'd1bc75cd-c9e4-41bf-a9d4-8a54b5e5b6fd';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Susan, tu profesora de Escritura Creativa. Vamos a inventar historias con nuestras propias palabras. ¡Empecemos! ✍️'
where teacher_id = 'a32bfc0a-373b-444c-8979-9f6a47a1fbbf' and subject_id = '667a1fd9-aa87-44a0-8b0b-613cdcabf745';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Susan, tu profesora de Español. Vamos a jugar con las palabras y descubrir historias increíbles. ¡Empecemos! 📖'
where teacher_id = 'a32bfc0a-373b-444c-8979-9f6a47a1fbbf' and subject_id = 'b324512a-4e29-4eec-915f-40a68c7f82a8';

update teacher_subjects set greeting_template =
  '¡Hola {name}! Soy Susan, tu profesora de Lectura Comprensiva. Vamos a descubrir los secretos que se esconden en cada texto. ¡Empecemos! 📖'
where teacher_id = 'a32bfc0a-373b-444c-8979-9f6a47a1fbbf' and subject_id = 'a44ec0fe-7783-45af-a983-ae855946d571';

-- 5) El saludo ahora se busca por profesor+materia, no solo por profesor:
-- asi cuando un profesor da varias materias, el saludo siempre menciona la
-- materia correcta en la que esta el alumno.
drop function if exists my_subject_teacher(uuid);

create function my_subject_teacher(p_subject_id uuid)
returns table (
  id uuid,
  name text,
  gender text,
  nationality text,
  flag_emoji text,
  age integer,
  image_url text,
  body_image_url text,
  voice_name text,
  greeting_template text,
  greeting_es text
)
language sql
security definer
set search_path = public
as $$
  select tc.id, tc.name, tc.gender, tc.nationality, tc.flag_emoji, tc.age, tc.image_url,
         tc.body_image_url, tc.voice_name, ts.greeting_template, ts.greeting_es
  from student_subject_teacher sst
  join teachers tc on tc.id = sst.teacher_id
  join teacher_subjects ts on ts.teacher_id = tc.id and ts.subject_id = sst.subject_id
  where sst.student_id = auth.uid() and sst.subject_id = p_subject_id;
$$;
