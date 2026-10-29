-- 001_init.sql
-- Creates the two core tables for the Boundary Digitization Tracker.
-- "stage" mirrors the workflow steps: a village moves forward one stage at a time.

CREATE TABLE villages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(20)  NOT NULL,                 -- human-readable id, e.g. VLG-0001
  name        VARCHAR(100) NOT NULL,
  tehsil      VARCHAR(100) NOT NULL,
  district    VARCHAR(100) NOT NULL,
  area_sq_km  DECIMAL(8,2) NULL,
  stage       ENUM(
                'not_started',
                'georeferenced',
                'parcels_matched',
                'boundary_digitized',
                'stored_in_geodatabase',
                'tehsil_merged'
              ) NOT NULL DEFAULT 'not_started',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_villages_code (code),
  KEY idx_villages_stage (stage),
  KEY idx_villages_tehsil (tehsil),
  KEY idx_villages_name (name),
  KEY idx_villages_updated_at (updated_at)
) ENGINE=InnoDB;

CREATE TABLE stage_notes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  village_id  INT UNSIGNED NOT NULL,
  from_stage  VARCHAR(30)  NOT NULL,
  to_stage    VARCHAR(30)  NOT NULL,
  note        TEXT NULL,                              -- required by the API when moving backwards
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stage_notes_village_created (village_id, created_at),
  CONSTRAINT fk_stage_notes_village
    FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
