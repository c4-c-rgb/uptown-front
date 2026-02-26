DROP DATABASE IF EXISTS `uptownhair`;
CREATE DATABASE `uptownhair`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `uptownhair`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ---------- TABLA: rol ----------
DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TABLA: user ----------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type_doc` VARCHAR(50) NOT NULL,
  `document` VARCHAR(100) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `gender` VARCHAR(50) NOT NULL,
  `birthdate` VARCHAR(50) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `password` VARCHAR(255) NOT NULL,
  `id_rol` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bio` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_email` (`email`),
  UNIQUE KEY `uk_user_document` (`document`),
  KEY `idx_user_rol` (`id_rol`),
  CONSTRAINT `fk_user_rol` FOREIGN KEY (`id_rol`)
    REFERENCES `rol` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TABLA: services ----------
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `minutes_duration` INT NOT NULL,
  `image` VARCHAR(255) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TABLA: users_services ----------
DROP TABLE IF EXISTS `users_services`;
CREATE TABLE `users_services` (
  `id_user` INT NOT NULL,
  `id_service` INT NOT NULL,
  PRIMARY KEY (`id_user`, `id_service`),
  KEY `idx_users_services_service` (`id_service`),
  CONSTRAINT `fk_users_services_user` FOREIGN KEY (`id_user`)
    REFERENCES `user` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_users_services_service` FOREIGN KEY (`id_service`)
    REFERENCES `services` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TABLA: reservas ----------
DROP TABLE IF EXISTS `reservas`;
CREATE TABLE `reservas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_user` INT NOT NULL,
  `id_service` INT NOT NULL,
  `id_employee` INT NOT NULL,
  `date_reservation` DATE NULL DEFAULT NULL,
  `time_reservation` TIME NULL DEFAULT NULL,
  `state` ENUM('pendiente','confirmada','en_proceso','finalizada','cancelada')
      NOT NULL DEFAULT 'pendiente',
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reservas_id_employee` (`id_employee`),
  KEY `idx_reservas_date_reservation` (`date_reservation`),
  KEY `idx_reservas_id_user` (`id_user`),
  KEY `idx_reservas_id_service` (`id_service`),
  CONSTRAINT `fk_reservas_user` FOREIGN KEY (`id_user`)
    REFERENCES `user` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_reservas_service` FOREIGN KEY (`id_service`)
    REFERENCES `services` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_reservas_employee` FOREIGN KEY (`id_employee`)
    REFERENCES `user` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TABLA: facturas ----------
DROP TABLE IF EXISTS `facturas`;
CREATE TABLE `facturas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `numero_factura` VARCHAR(20) NOT NULL UNIQUE,
  `id_reserva` INT NOT NULL,
  `id_user` INT NOT NULL,
  `id_service` INT NOT NULL,
  `cliente_nombre` VARCHAR(200) NULL,
  `servicio_nombre` VARCHAR(200) NULL,
  `servicio_precio` DECIMAL(10,2) NULL,
  `servicio_duracion` INT NULL,
  `estilista_nombre` VARCHAR(200) NULL,
  `fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `iva` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(10,2) NOT NULL,
  `estado` ENUM('pagada','pendiente','anulada') NOT NULL DEFAULT 'pendiente',
  `metodo_pago` VARCHAR(50) NULL,
  `notas` TEXT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_facturas_reserva` (`id_reserva`),
  KEY `idx_facturas_user` (`id_user`),
  KEY `idx_facturas_service` (`id_service`),
  CONSTRAINT `fk_facturas_reserva` FOREIGN KEY (`id_reserva`)
    REFERENCES `reservas` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_facturas_user` FOREIGN KEY (`id_user`)
    REFERENCES `user` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_facturas_service` FOREIGN KEY (`id_service`)
    REFERENCES `services` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TABLA: horarios ----------
DROP TABLE IF EXISTS `horarios`;
CREATE TABLE `horarios` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_estilista` INT NOT NULL,
  `tipo` VARCHAR(16) NOT NULL DEFAULT 'weekly',
  `inicio_semana` DATE NOT NULL,
  `plantilla_semana` JSON NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_horarios_estilista` (`id_estilista`),
  CONSTRAINT `fk_horarios_estilista` FOREIGN KEY (`id_estilista`)
    REFERENCES `user` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TABLA: password_reset_token ----------
DROP TABLE IF EXISTS `password_reset_token`;
CREATE TABLE `password_reset_token` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(150) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prt_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;