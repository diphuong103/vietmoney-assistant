-- V9__restore_missing_tables.sql
-- Khôi phục hai bảng đã bị xóa trực tiếp khỏi DB:
--   1. tourist_spots  – được dùng bởi TouristSpot entity và FK trong articles
--   2. scanned_regions – được dùng bởi AtmService để cache các ô lưới đã quét

-- ============================================================
-- 1. tourist_spots
--    (cấu trúc giữ nguyên so với V1__init_schema.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS tourist_spots (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    city         VARCHAR(100) NOT NULL,
    province     VARCHAR(100),
    address      VARCHAR(255),
    description  TEXT,
    image_url    VARCHAR(255),
    latitude     DOUBLE,
    longitude    DOUBLE,
    rating       DOUBLE,
    ticket_price VARCHAR(100),
    open_hours   VARCHAR(100),
    category     VARCHAR(50)
);

-- ============================================================
-- 2. scanned_regions
--    (cấu trúc giữ nguyên so với V6__fix_atm_cache.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS scanned_regions (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    grid_lat    INTEGER          NOT NULL,
    grid_lng    INTEGER          NOT NULL,
    center_lat  DOUBLE PRECISION NOT NULL,
    center_lng  DOUBLE PRECISION NOT NULL,
    atm_count   INTEGER          DEFAULT 0,
    scanned_at  TIMESTAMP        NOT NULL,
    CONSTRAINT uq_grid UNIQUE (grid_lat, grid_lng)
);

CREATE INDEX IF NOT EXISTS idx_scanned_regions_grid
    ON scanned_regions (grid_lat, grid_lng);

CREATE INDEX IF NOT EXISTS idx_scanned_regions_at
    ON scanned_regions (scanned_at);
