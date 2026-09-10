# Academia Mágica — cerebro del proyecto

Última actualización: 2026-09-10

## Propósito

Academia Mágica es una plataforma educativa gamificada para alumnado de 4 a 10 años. El aprendizaje se organiza por asignaturas, temas, dos lecciones de práctica y un test final. Los aciertos conceden diamantes que el alumno puede usar en su cuarto y tienda.

Este archivo es el índice estable del proyecto. Las notas extensas, investigación, decisiones y bitácora personal continúan en el vault de Obsidian; aquí solo vive el contexto necesario para desarrollar y operar el producto sin depender de la memoria de una IA.

## Producción y repositorios

- Web pública: https://academiamagicaedu.com — dominio propio, fijado en código desde `8644dc0`
  (`src/app/layout.tsx`, `robots.ts`, `sitemap.ts` y remitente de emails).
- Despliegue Vercel: proyecto `academia-magica-oficial`, enlazado a `cantera-gt/academia-magica`.
- GitHub: `cantera-gt/academia-magica`
- Supabase: proyecto `wlxgvbabljflvhtxuzue`
- Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 y Framer Motion.
- Backend: Supabase Auth, Postgres, RLS y RPCs.

Nunca se deben guardar secretos, tokens, contraseñas ni claves `service_role` en este archivo o en Git.

## Fuentes de verdad

- Supabase es la única fuente de verdad de usuarios, aprendizaje, progreso, economía y actividad administrativa.
- Google Sheets puede usarse como exportación o vista de trabajo, nunca como segunda base sincronizada manualmente.
- GitHub contiene el código y las migraciones reproducibles.
- Obsidian conserva investigación, decisiones, aprendizajes y contexto transversal.

## Roles y acceso

- `admin`: administra únicamente el hogar al que pertenece; las operaciones sensibles se realizan mediante RPCs con comprobación interna de rol y hogar.
- `student`: accede a las asignaturas que tiene asignadas, completa prácticas y test, gana diamantes y personaliza su cuarto.
- Las tablas sensibles usan RLS. Las funciones `security definer` fijan `search_path`, revocan acceso anónimo y validan permisos dentro de la función.

## Centro de control administrador

Rutas principales:

- `/admin`: KPIs, alertas, actividad de 14 días, rendimiento por asignatura y acciones recientes.
- `/admin/alumnos`: buscador, filtros, selección, altas, exportación CSV, borradores BCC y gestión de estado.
- `/admin/alumnos/[id]`: ficha 360º, aprendizaje, actividad, notas, etiquetas, asignaturas, diamantes y baja segura.
- `/admin/comunicacion`: segmentación de destinatarios, copia BCC, CSV y registro manual de contacto.
- `/admin/ejercicios`: cobertura curricular por asignatura y detección de vacíos.
- `/admin/actividad`: auditoría inmutable de acciones administrativas.

Decisiones operativas:

- La baja normal es reversible (`active=false`) y exige motivo.
- La eliminación definitiva crea antes una copia en `deleted_students_backup`.
- Todo ajuste de diamantes exige motivo y queda auditado.
- El envío de correo no es automático: se prepara un borrador BCC para evitar envíos accidentales y exposición de destinatarios.
- Las exportaciones CSV neutralizan fórmulas al abrirse en una hoja de cálculo.

Migraciones:

- `20260811110000_admin_control_center.sql`
- `20260811123000_admin_security_hardening.sql`

## Currículo

### Patrón de Matemáticas

El currículo detallado usa una progresión anual de 4 a 10 años. Cada edad dispone de 10 temas; cada tema contiene dos lecciones, seis ejercicios de práctica y tres preguntas de test. La edad recomendada orienta la secuencia sin bloquear rígidamente al alumno.

La base histórica conserva cuatro temas provisionales adicionales. Deben considerarse legado y no modelo para nuevas asignaturas.

### Español y Cuerpo Humano

Versiones activas:

- `espanol-4-10-v1`
- `cuerpo-humano-4-10-v1`

Cada asignatura contiene:

- 70 temas: 10 por cada edad de 4 a 10.
- 140 lecciones.
- 420 ejercicios de práctica.
- 210 preguntas de test.
- Objetivo de aprendizaje y referencias públicas por tema.

Las fuentes base son las enseñanzas mínimas oficiales de Educación Infantil y Primaria (BOE/LOMLOE), la RAE para lengua y materiales públicos de NIAMS, CDC y OMS para anatomía y hábitos saludables. El contenido provisional anterior queda inactivo, no borrado, para conservar el progreso histórico.

Migración: `20260811150000_spanish_human_body_curricula.sql`.

## Reglas de evolución

1. Toda modificación de esquema o contenido masivo debe vivir en una migración y validarse primero de forma reversible.
2. No borrar progreso para reemplazar un currículo; versionar y desactivar el contenido anterior.
3. Cada nuevo currículo debe declarar edad, objetivo, prerrequisitos, fuentes y métricas de cobertura.
4. Probar permisos desde el rol real, no solo como propietario de la base.
5. Verificar compilación, flujos críticos y producción antes de declarar una entrega terminada.
6. Actualizar este archivo cuando cambien arquitectura, decisiones o estado operativo; guardar el aprendizaje amplio también en Obsidian.

## Próximas mejoras de alto impacto

- Proveedor de correo transaccional con consentimiento, plantillas, bajas y registro de entregabilidad.
- Autenticación reforzada del administrador (MFA) y recuperación segura.
- Cohortes, objetivos y comparativas temporales en analítica.
- Banco editorial con revisión humana y variantes de ejercicios aplicados, especialmente lectura comprensiva y casos científicos.
- Pruebas end-to-end autenticadas para administrador y alumno en cada despliegue.

## Landing comercial y captación

La ruta / es una landing de venta dirigida a madres, padres y familias. Mantiene la identidad visual crema, violeta, rosa, menta y amarillo, además de los personajes 2D y las fotografías existentes. Su estructura de conversión es: transformación deseada, problema cotidiano, mecanismo de producto, currículo, acompañamiento, control familiar, preguntas frecuentes y llamada final a la matrícula.

- Acción principal: Quiero matricularme.
- Acceso de alumnos: visible arriba a la derecha y enlazado a /alumno.
- La captación usa `/matricula`: formulario persistente para tutor legal o alumno adulto, con datos de contacto, datos mínimos del menor, protección antispam, UTM y referencia pública.
- Supabase es la fuente de verdad de solicitudes. Se quitó el enlace a la hoja de Google Sheets `1wU1jzKcKTsT9dkCepfz4e2m8t74VYRnWKMGCItiDrIo` (11/08/2026) porque estaba creada bajo una cuenta de Google incorrecta (no businesscatserrano@gmail.com) y no había forma de corregir el dueño desde el código. La vista operativa hoy es el botón "Exportar CSV" en `/admin/matriculas`, que no depende de ninguna cuenta externa. Si se quiere retomar una hoja de Google Sheets, debe crearse nueva bajo businesscatserrano@gmail.com y volver a enlazarla.
- `/matricula/pago` prepara el paso PayPal sin realizar cargos hasta configurar cuenta, producto, precio y webhook verificado.
- `/admin/matriculas` permite buscar, contactar por WhatsApp, cambiar estado/pago, etiquetar, anotar y exportar CSV.
- Consentimientos separados: condiciones y privacidad obligatorios; marketing opcional. Se guardan versión y fecha/hora.
- Antes de activar ventas: completar identidad legal, NIT, domicilio, precio, moneda, duración, cancelación y reembolso; revisión jurídica en Guatemala.
- SEO: metadatos específicos, canonical, Open Graph, Twitter Card, datos estructurados de organización/aplicación/FAQ, robots.txt y sitemap.xml.


## Modelo comercial de matrícula

- El comprador selecciona las materias activas directamente desde Supabase.
- La home comercial y el formulario consumen el mismo catálogo dinámico. Cuando una materia nueva tiene contenido y `subjects.active=true`, aparece automáticamente en la home y en matrícula; al pulsarla desde la home llega preseleccionada al carrito.
- El acceso dura 3 meses y se factura en USD.
- Tarifas por volumen: 1–3 materias a $10 cada una; 4–6 a $8; 7–10 a $7; 11 o más a $6.
- La tarifa del tramo se aplica a todas las materias seleccionadas, por lo que existen saltos favorables en 4, 7 y 11 materias (por ejemplo, 10 cuestan $70 y 11 cuestan $66).
- El navegador muestra una estimación, pero la función SQL valida materias activas y recalcula el precio. La solicitud guarda una fotografía inmutable de materias, nombres, tarifa, total, moneda y duración.
- PayPal opera primero en Sandbox mediante Orders v2. Sus secretos solo se guardan como variables cifradas de Vercel; nunca en Git, Obsidian ni conversaciones.
- Cada matrícula recibe un token de pago UUID distinto de la referencia visible. La orden se crea en el servidor usando el total guardado por Supabase; la confirmación vuelve a validar orden, captura, importe y moneda antes de marcar el pago.
- Las mutaciones de pago requieren además un secreto interno del servidor cuyo hash vive en el esquema privado de Postgres. El navegador no puede marcar una matrícula como pagada directamente.
- Estado de validación: credenciales Sandbox autenticadas y creación/redirección de una orden de 10 USD comprobadas. La ruta de webhook verifica criptográficamente la firma con PayPal, procesa eventos de forma idempotente y concilia pago, fallo, pendiente y reembolso en Supabase. El endpoint está registrado en la aplicación Sandbox para orden aprobada y los eventos de captura completada, rechazada, denegada, pendiente, reembolsada y revertida; la orden aprobada se captura también desde el servidor, sin depender del retorno del navegador; su identificador vive cifrado en Vercel. Falta aprobar una compra con una cuenta personal Sandbox antes de activar Live.

## Migraciones de captación

- `20260811190000_enrollment_pipeline.sql`
- `20260811190500_enrollment_terms_consent.sql`
- `20260811191000_enrollment_function_privileges.sql`
- `20260811200000_enrollment_subject_pricing.sql`
- `20260811201000_public_enrollment_subject_catalog.sql`
- `20260811202000_paypal_sandbox_checkout.sql`
- `20260811202500_harden_paypal_server_mutations.sql`
- `20260811210000_paypal_verified_webhook_events.sql`

## Circuito de entrega (cómo trabajamos)

Acordado el 10/09/2026 con Pablo. Aplica a toda sesión de Claude sobre este repo.

- El repo de trabajo es `C:\Users\pablo\academia-magica`: conectado a la sesión de Claude y
  añadido a GitHub Desktop en la rama `main`. La carpeta
  `…\CEREBROCLAUDE\proyectos\Academia-Magica` es solo material de apoyo (imágenes, currículos,
  parches sueltos): el código nunca se trabaja ahí.
- Claude escribe los archivos directamente en el repo local y deja el commit hecho. Pablo revisa
  el diff en GitHub Desktop y pulsa **Push**. Claude nunca empuja a `origin`.
- **Antes de escribir nada, `git pull`.** Buena parte del trabajo entra por la cuenta `cantera-gt`,
  a veces desde la web de GitHub ("Add files via upload"), así que la copia local se queda atrás
  sin avisar. Trabajar sobre una copia vieja produce diagnósticos falsos y conflictos.
- Un aviso por lote: qué archivos se tocaron, qué hace cada uno y qué hay que comprobar.
- Las migraciones SQL las **aplica Pablo** en el editor SQL de Supabase. Claude escribe el `.sql`
  en `supabase/migrations/`, explica qué hace y en qué orden, y no da el cambio por cerrado hasta
  que Pablo confirma que se aplicó. Claude no escribe en la base de datos de producción.
- Antes de avisar, Claude verifica lo que pueda desde el repo local (`npm run lint`,
  `npm run build`). Si no ha podido verificar, lo dice. `.github/workflows/verify.yml` repite
  lint + build en GitHub al empujar a `main`.
- Nunca se escriben secretos, tokens ni claves `service_role` en archivos, Git ni conversaciones.

## Estado a 10/09/2026

- Último commit en `origin/main`: `1e96dcd`, 09/09/2026. Casi todo el trabajo desde el 18/08 va
  firmado por la cuenta `cantera-gt`.
- **El esquema ya está versionado.** `20260818000000_baseline_schema.sql` (3666 líneas) es la foto
  completa del schema de producción — extensiones, tablas, constraints, índices, ~76 funciones,
  triggers, RLS y políticas — obtenida por introspección de Postgres. Ver
  `supabase/migrations/README.md`.
- Migración posterior: `20260819120000_teacher_multi_subject_greetings.sql` (saludo por
  combinación profesor+materia; documenta un cambio aplicado en producción en 3 pasos).
- Migraciones de puesta al día (10/09), obtenidas por introspección de Supabase y idempotentes,
  porque los objetos ya existían en producción:
  `20260820120000_landing_leads_capture.sql` (tabla `landing_leads`, RLS, y la RPC
  `submit_landing_lead`) y `20260909120000_garaje_vehicle_designs.sql` (valor `garaje` del enum
  `item_zone`, columnas `store_items.vehicle_slot` y `vehicle_variant`, tabla `vehicle_designs`
  con RLS, y las RPCs `my_garage` y `save_vehicle_design`).
- **Sin deuda de esquema conocida:** todos los RPCs y tablas que usa el código están definidos en
  `supabase/migrations/`.
- Restos por limpiar: `racha-nivel-xp.patch` commiteado por error en la raíz, y 9 ramas remotas
  del 11/08 ya fusionadas por squash.
- No verificable desde el código: si `PAYPAL_ENV` está en `live`, si Resend tiene el dominio
  verificado y qué commit sirve Vercel en cada momento.

## Construido entre el 18/08 y el 09/09/2026

- **Landing comercial v2**: hero con fotografía real de los personajes, precios, historia del
  fundador, footer con contacto y aviso de propiedad, y captura de email para visitantes
  indecisos (`src/components/landing-lead-capture.tsx`).
- **Español de España (tuteo)** en toda la aplicación: landing, alumno, panel de padres, tienda,
  cuarto, juegos, afiliados, admin, y también el prompt y las recomendaciones del profesor IA.
- **Juegos de recreo ampliados a diez**: memoria, memoria-colores, puzzle, reflejos, suma-veloz,
  atrapa-fruta, laberinto, tres-en-raya, diseño-libre y dibujos-color.
- **Voz y TTS**: cada materia con dos o más profesores y saludo propio por materia; voz inglesa
  para materias de idioma; arreglos de eco por doble reproducción, de porcentajes y de lectura
  de restas, divisiones, fracciones y decimales.
- **Cuarto**: fondos equipables (categoría `fondo`) y escalado de objetos en el inventario.
- **Garaje** (09/09): ruta `/alumno/garaje`, coche en SVG por piezas tocable y pintable
  (`src/components/vehicle-svg.tsx`), catálogo de piezas y geometría de chasis
  (`src/lib/vehicle.ts`), con compra de piezas y premio.
