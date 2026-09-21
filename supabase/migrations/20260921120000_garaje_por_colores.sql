-- El garaje pasa de piezas intercambiables a pintar por colores.
--
-- POR QUE
-- El garaje se escribio el 09/09/2026 suponiendo un coche dibujado por piezas
-- (5 chasis, 5 llantas, 4 alerones...), y se poblaron 46 items de tienda para
-- venderlas. Ese coche nunca se vio en pantalla: la ruta /alumno/garaje no
-- tenia ningun enlace hasta el 21/09/2026, asi que nadie pudo llegar nunca.
--
-- Los coches definitivos son renders 3D despiezados en capas PNG. Las capas
-- solo contienen lo que se veia en la imagen original, o sea que las zonas
-- tapadas no estan reconstruidas: cambiar una rueda por otra dejaria a la
-- vista el hueco de la primera. Con estos assets no se pueden intercambiar
-- piezas, solo pintar.
--
-- QUE HACE ESTA MIGRACION
-- Desactiva los 46 items de la zona garaje. No se borran: se desactivan, por
-- si mas adelante se generan piezas independientes y vuelven a tener sentido.
--
-- SIN RIESGO DE PERDER PROGRESO
-- Comprobado antes de escribir esto: 0 compras de items de garaje en
-- student_inventory y 0 filas en vehicle_designs. Nadie llego a usarlo.
--
-- LOS RPC NO CAMBIAN
-- save_vehicle_design solo valida las claves que vengan bajo design->'parts'.
-- El diseño nuevo es {model, colors, matricula}, sin 'parts', asi que el bucle
-- de validacion no itera y la funcion sigue sirviendo tal cual. my_garage
-- tambien: devuelve 'owned' vacio y la pagina ya no lo mira.

update public.store_items
   set active = false
 where zone = 'garaje'
   and active;

-- Para revertir:
--   update public.store_items set active = true where zone = 'garaje';
