-- ============================================
-- SISTEMA DE GESTIÓN DE AULAS
-- Base de datos completa con datos iniciales
-- Optimizado para Railway
-- ============================================

-- IMPORTANTE: Railway usa la base de datos "railway" por defecto
-- NO crear nueva base de datos, usar la existente

-- ============================================
-- TABLA: users (Usuarios del sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'INSTRUCTOR') DEFAULT 'INSTRUCTOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: rooms (Aulas)
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    status ENUM('Libre', 'Ocupada') DEFAULT 'Libre',
    occupied_by VARCHAR(100) DEFAULT NULL,
    qr_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: resources (Recursos por aula)
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL,
    status ENUM('Activo', 'Dañado', 'Reparado') DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_room (room_id),
    INDEX idx_status (status),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: reservations (Reservas de aulas)
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor VARCHAR(100) NOT NULL,
    room_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    whatsapp_group VARCHAR(255) DEFAULT NULL,
    status ENUM('Activa', 'Completada', 'Cancelada') DEFAULT 'Activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_room_date (room_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: history (Historial de reservas)
-- ============================================
CREATE TABLE IF NOT EXISTS history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor VARCHAR(100) NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_instructor (instructor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: logs (Bitácora de acciones)
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS INICIALES: Usuario Administrador
-- ============================================
-- Email: admin@aulas.com
-- Password: admin123
INSERT INTO users (name, email, password, role) VALUES 
('Administrador', 'admin@aulas.com', '$2b$10$K7L/WzY5m5kJZf5RX5k5kuO5k5k5k5k5k5k5k5k5k5k5k5k5k5k5k5', 'ADMIN');

-- ============================================
-- DATOS INICIALES: Aulas (según especificaciones)
-- ============================================
INSERT INTO rooms (id, name, module, status, occupied_by) VALUES 
(1, 'Aula 1', 'Modulo 1', 'Libre', NULL),
(3, 'Aula 3', 'Modulo 1', 'Libre', NULL),
(4, 'Aula 4', 'Modulo 1', 'Libre', NULL),
(5, 'Salon Ejecutivo', 'Modulo 2', 'Libre', NULL),
(6, 'Salon Ejecutivo', 'Modulo 2', 'Libre', NULL);

-- ============================================
-- DATOS INICIALES: Recursos (Aula 1 - Ejemplo)
-- ============================================
-- Recurso inicial como ejemplo
-- Puedes agregar más recursos después desde el panel de administración
INSERT INTO resources (room_id, type, code, status) VALUES 
(1, 'Escritorio', 'I-304-56413', 'Activo'),
(1, 'Silla', 'I-304-56414', 'Activo'),
(1, 'Computadora', 'I-304-56415', 'Activo'),
(1, 'Monitor', 'I-304-56416', 'Activo'),
(1, 'Teclado', 'I-304-56417', 'Activo'),
(1, 'Mouse', 'I-304-56418', 'Activo'),
(1, 'Proyector', 'I-304-56419', 'Activo'),
(1, 'Pizarra', 'I-304-56420', 'Activo'),
(1, 'Aire Acondicionado', 'I-304-56421', 'Activo'),
(1, 'Ventilador', 'I-304-56422', 'Activo');

-- ============================================
-- TRIGGERS: Sincronización automática
-- ============================================

-- Trigger: Copiar a historial cuando se crea una reserva
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS after_reservation_insert
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    DECLARE room_name_var VARCHAR(100);
    SELECT name INTO room_name_var FROM rooms WHERE id = NEW.room_id;
    
    INSERT INTO history (instructor, room_name, date, start_time, end_time, status)
    VALUES (NEW.instructor, room_name_var, NEW.date, NEW.start_time, NEW.end_time, NEW.status);
END$$
DELIMITER ;

-- Trigger: Actualizar historial cuando se modifica una reserva
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS after_reservation_update
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    DECLARE room_name_var VARCHAR(100);
    SELECT name INTO room_name_var FROM rooms WHERE id = NEW.room_id;
    
    INSERT INTO history (instructor, room_name, date, start_time, end_time, status)
    VALUES (NEW.instructor, room_name_var, NEW.date, NEW.start_time, NEW.end_time, NEW.status);
END$$
DELIMITER ;

-- ============================================
-- VERIFICACIÓN: Mostrar datos creados
-- ============================================
SELECT 'Base de datos configurada correctamente' AS mensaje;
SELECT COUNT(*) AS total_usuarios FROM users;
SELECT COUNT(*) AS total_aulas FROM rooms;
SELECT COUNT(*) AS total_recursos FROM resources;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
