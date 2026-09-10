# Migraciones de Supabase

`20260818000000_baseline_schema.sql` es una **foto del schema completo** de
producción tal como estaba el 18/08/2026 — extensiones, tablas, constraints,
índices, las ~76 funciones/RPCs propias, triggers, RLS y políticas. Se generó
por introspección directa de Postgres porque el repo nunca tuvo las
migraciones versionadas hasta ahora (se aplicaban a mano en el SQL Editor de
Supabase).

No es un reemplazo del historial narrativo del proyecto — para el "por qué" y
"cómo se construyó cada cosa", ver `proyectos/Academia-Magica.md` en el vault
de Obsidian de Pablo. Esto es solo la estructura técnica final.

## De acá en adelante

Cualquier cambio de schema nuevo (tabla, columna, función, política) debe
agregarse como un archivo nuevo en esta carpeta, con el formato
`YYYYMMDDHHMMSS_nombre_descriptivo.sql`, en vez de aplicarse solo en Supabase
y quedar sin registrar en el repo. Así el repo y la base de datos no se
vuelven a desincronizar.
