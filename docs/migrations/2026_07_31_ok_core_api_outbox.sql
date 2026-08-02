-- forest-platform -> OK-Core API synchronization
-- Target: MySQL 5.7 / existing forest_platform database
--
-- This migration adds source-owned context packages and an Outbox.
-- Existing KF rows remain valid and are not copied or deleted.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS kf_context_packages (
    context_package_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_type_code VARCHAR(64) NOT NULL,
    external_activity_id VARCHAR(191) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    PRIMARY KEY (context_package_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS kf_context_package_items (
    context_package_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    context_package_id BIGINT UNSIGNED NOT NULL,
    entity_type_code VARCHAR(64) NOT NULL,
    entity_id VARCHAR(191) NOT NULL,
    display_order INT NOT NULL,
    snapshot_json JSON NOT NULL,
    PRIMARY KEY (context_package_item_id),
    UNIQUE KEY ux_kf_context_item (
        context_package_id,
        entity_type_code,
        entity_id
    ),
    CONSTRAINT fk_kf_context_item_package
        FOREIGN KEY (context_package_id)
        REFERENCES kf_context_packages (context_package_id)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET @schema_name := DATABASE();

SET @ddl := IF(
    EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'experience_knowledges'
          AND COLUMN_NAME = 'context_package_id'
    ),
    'DO 0',
    'ALTER TABLE experience_knowledges ADD COLUMN context_package_id BIGINT UNSIGNED NULL AFTER stage3'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @ddl := IF(
    EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'experience_knowledges'
          AND COLUMN_NAME = 'stage_payload_json'
    ),
    'DO 0',
    'ALTER TABLE experience_knowledges ADD COLUMN stage_payload_json JSON NULL AFTER context_package_id'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @ddl := IF(
    EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'experience_knowledges'
          AND COLUMN_NAME = 'source_revision'
    ),
    'DO 0',
    'ALTER TABLE experience_knowledges ADD COLUMN source_revision BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER stage_payload_json'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @ddl := IF(
    EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = @schema_name
          AND TABLE_NAME = 'experience_knowledges'
          AND INDEX_NAME = 'ix_experience_context_package'
    ),
    'DO 0',
    'ALTER TABLE experience_knowledges ADD KEY ix_experience_context_package (context_package_id)'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @ddl := IF(
    EXISTS (
        SELECT 1
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = @schema_name
          AND TABLE_NAME = 'experience_knowledges'
          AND CONSTRAINT_NAME = 'fk_experience_context_package'
    ),
    'DO 0',
    'ALTER TABLE experience_knowledges ADD CONSTRAINT fk_experience_context_package FOREIGN KEY (context_package_id) REFERENCES kf_context_packages (context_package_id) ON UPDATE RESTRICT ON DELETE RESTRICT'
);
PREPARE migration_statement FROM @ddl;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

CREATE TABLE IF NOT EXISTS kf_sync_outbox (
    outbox_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    experience_knowledge_id INT NOT NULL,
    source_revision BIGINT UNSIGNED NOT NULL,
    operation ENUM('UPSERT', 'DELETE') NOT NULL,
    acting_user_sso_sub VARCHAR(191) NOT NULL,
    payload_json JSON NULL,
    status ENUM('PENDING', 'SENT', 'FAILED', 'SUPERSEDED') NOT NULL DEFAULT 'PENDING',
    attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
    next_retry_at DATETIME NULL,
    last_http_status SMALLINT UNSIGNED NULL,
    last_request_id VARCHAR(100) NULL,
    last_error TEXT NULL,
    response_json JSON NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    sent_at DATETIME(3) NULL,
    PRIMARY KEY (outbox_id),
    UNIQUE KEY ux_kf_outbox_revision (
        experience_knowledge_id,
        source_revision
    ),
    KEY ix_kf_outbox_retry (status, next_retry_at, outbox_id),
    CONSTRAINT fk_kf_outbox_experience
        FOREIGN KEY (experience_knowledge_id)
        REFERENCES experience_knowledges (experience_knowledge_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Verification queries. These do not modify data.
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'experience_knowledges'
  AND COLUMN_NAME IN (
      'context_package_id',
      'stage_payload_json',
      'source_revision'
  )
ORDER BY ORDINAL_POSITION;

SELECT
    TABLE_NAME,
    ENGINE,
    TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
      'kf_context_packages',
      'kf_context_package_items',
      'kf_sync_outbox'
  )
ORDER BY TABLE_NAME;
