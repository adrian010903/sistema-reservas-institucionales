-- Catálogo demostrativo para desarrollo local.
-- Es idempotente: puede ejecutarse varias veces sin duplicar registros.

START TRANSACTION;

INSERT INTO tipos_espacio (nombre, descripcion)
SELECT 'Alojamiento', 'Habitaciones y dormitorios para delegaciones'
WHERE NOT EXISTS (SELECT 1 FROM tipos_espacio WHERE UPPER(nombre) = UPPER('Alojamiento'));

INSERT INTO tipos_espacio (nombre, descripcion)
SELECT 'Salón multiuso', 'Espacios cubiertos para reuniones, talleres y actividades'
WHERE NOT EXISTS (SELECT 1 FROM tipos_espacio WHERE UPPER(nombre) = UPPER('Salón multiuso'));

INSERT INTO tipos_espacio (nombre, descripcion)
SELECT 'Área recreativa', 'Espacios para recreación y actividades educativas'
WHERE NOT EXISTS (SELECT 1 FROM tipos_espacio WHERE UPPER(nombre) = UPPER('Área recreativa'));

INSERT INTO categorias_espacio (nombre, descripcion)
SELECT 'Hospedaje', 'Espacios destinados a alojamiento institucional'
WHERE NOT EXISTS (SELECT 1 FROM categorias_espacio WHERE UPPER(nombre) = UPPER('Hospedaje'));

INSERT INTO categorias_espacio (nombre, descripcion)
SELECT 'Formación', 'Espacios para capacitación y reuniones'
WHERE NOT EXISTS (SELECT 1 FROM categorias_espacio WHERE UPPER(nombre) = UPPER('Formación'));

INSERT INTO categorias_espacio (nombre, descripcion)
SELECT 'Recreación', 'Espacios para convivencia y actividades recreativas'
WHERE NOT EXISTS (SELECT 1 FROM categorias_espacio WHERE UPPER(nombre) = UPPER('Recreación'));

SET @hostel_id = (SELECT id FROM lugares WHERE UPPER(nombre) = UPPER('Hostel') LIMIT 1);
SET @campo_id = (SELECT id FROM lugares WHERE UPPER(nombre) = UPPER('Campo Escuela') LIMIT 1);
SET @tipo_campo = (SELECT id FROM tipos_espacio WHERE UPPER(nombre) = UPPER('Campo Escuela') LIMIT 1);
SET @tipo_alojamiento = (SELECT id FROM tipos_espacio WHERE UPPER(nombre) = UPPER('Alojamiento') LIMIT 1);
SET @tipo_salon = (SELECT id FROM tipos_espacio WHERE UPPER(nombre) = UPPER('Salón multiuso') LIMIT 1);
SET @tipo_recreativo = (SELECT id FROM tipos_espacio WHERE UPPER(nombre) = UPPER('Área recreativa') LIMIT 1);
SET @cat_aire_libre = (SELECT id FROM categorias_espacio WHERE UPPER(nombre) = UPPER('Espacios al aire libre') LIMIT 1);
SET @cat_hospedaje = (SELECT id FROM categorias_espacio WHERE UPPER(nombre) = UPPER('Hospedaje') LIMIT 1);
SET @cat_formacion = (SELECT id FROM categorias_espacio WHERE UPPER(nombre) = UPPER('Formación') LIMIT 1);
SET @cat_recreacion = (SELECT id FROM categorias_espacio WHERE UPPER(nombre) = UPPER('Recreación') LIMIT 1);

-- Corrige el espacio inicial que había quedado sin lugar asociado.
UPDATE espacios
SET lugar_id = @campo_id
WHERE UPPER(nombre) = UPPER('Campo Escuela La Montaña') AND lugar_id IS NULL;

INSERT INTO espacios (nombre, descripcion, capacidad, estado, tipo_id, categoria_id, lugar_id)
SELECT 'Dormitorio Compartido', 'Dormitorio grupal para delegaciones juveniles y equipos de trabajo.', 24, 'DISPONIBLE', @tipo_alojamiento, @cat_hospedaje, @hostel_id
WHERE @hostel_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM espacios WHERE lugar_id = @hostel_id AND UPPER(nombre) = UPPER('Dormitorio Compartido'));

INSERT INTO espacios (nombre, descripcion, capacidad, estado, tipo_id, categoria_id, lugar_id)
SELECT 'Habitación para Dirigentes', 'Habitación privada para dirigentes, facilitadores o invitados institucionales.', 6, 'DISPONIBLE', @tipo_alojamiento, @cat_hospedaje, @hostel_id
WHERE @hostel_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM espacios WHERE lugar_id = @hostel_id AND UPPER(nombre) = UPPER('Habitación para Dirigentes'));

INSERT INTO espacios (nombre, descripcion, capacidad, estado, tipo_id, categoria_id, lugar_id)
SELECT 'Salón Comunal del Hostel', 'Salón cubierto para reuniones de delegaciones y actividades de convivencia.', 40, 'DISPONIBLE', @tipo_salon, @cat_formacion, @hostel_id
WHERE @hostel_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM espacios WHERE lugar_id = @hostel_id AND UPPER(nombre) = UPPER('Salón Comunal del Hostel'));

INSERT INTO espacios (nombre, descripcion, capacidad, estado, tipo_id, categoria_id, lugar_id)
SELECT 'Zona de Campamento Norte', 'Área amplia para campamentos, montaje de tiendas y actividades al aire libre.', 80, 'DISPONIBLE', @tipo_campo, @cat_aire_libre, @campo_id
WHERE @campo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM espacios WHERE lugar_id = @campo_id AND UPPER(nombre) = UPPER('Zona de Campamento Norte'));

INSERT INTO espacios (nombre, descripcion, capacidad, estado, tipo_id, categoria_id, lugar_id)
SELECT 'Rancho de Actividades', 'Espacio techado para dinámicas grupales, ceremonias y convivencia.', 60, 'DISPONIBLE', @tipo_salon, @cat_recreacion, @campo_id
WHERE @campo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM espacios WHERE lugar_id = @campo_id AND UPPER(nombre) = UPPER('Rancho de Actividades'));

INSERT INTO espacios (nombre, descripcion, capacidad, estado, tipo_id, categoria_id, lugar_id)
SELECT 'Aula de Capacitación', 'Aula equipada para talleres, cursos y sesiones de formación.', 35, 'DISPONIBLE', @tipo_salon, @cat_formacion, @campo_id
WHERE @campo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM espacios WHERE lugar_id = @campo_id AND UPPER(nombre) = UPPER('Aula de Capacitación'));

INSERT INTO espacios (nombre, descripcion, capacidad, estado, tipo_id, categoria_id, lugar_id)
SELECT 'Sendero Educativo', 'Recorrido natural para actividades de orientación y educación ambiental.', 30, 'DISPONIBLE', @tipo_recreativo, @cat_recreacion, @campo_id
WHERE @campo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM espacios WHERE lugar_id = @campo_id AND UPPER(nombre) = UPPER('Sendero Educativo'));

COMMIT;
