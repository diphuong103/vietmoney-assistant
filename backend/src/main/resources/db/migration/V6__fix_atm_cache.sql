-- V5__atm_cache_alter_and_scanned_regions.sql
-- Bảng atm_cache đã tạo ở V4 nhưng thiếu các cột cần thiết.
-- Migration này thêm cột còn thiếu + tạo bảng scanned_regions mới.

-- ══════════════════════════════════════════════════════════════════════════
-- 1. Thêm các cột còn thiếu vào atm_cache (dùng IF NOT EXISTS để idempotent)
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE atm_cache
    ADD COLUMN IF NOT EXISTS status     VARCHAR(32)    DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS rating     DECIMAL(3,1)   DEFAULT 4.5,
    ADD COLUMN IF NOT EXISTS phone      VARCHAR(32),
    ADD COLUMN IF NOT EXISTS type       VARCHAR(64)    DEFAULT 'Cây ATM';

-- Đổi tên cột grid_key thành chuẩn (nếu tên cũ là grid_key giữ nguyên)
-- Nếu cần đổi kiểu VARCHAR(32) → VARCHAR(64) cho an toàn:
ALTER TABLE atm_cache
ALTER COLUMN grid_key   TYPE VARCHAR(64),
    ALTER COLUMN type       TYPE VARCHAR(64),
    ALTER COLUMN address    TYPE VARCHAR(1024),
    ALTER COLUMN name       TYPE VARCHAR(512);

-- Thêm index lat/lng cho bounding-box query (quan trọng cho performance)
CREATE INDEX IF NOT EXISTS idx_atm_cache_lat_lng
    ON atm_cache (lat, lng);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. Tạo bảng scanned_regions (theo dõi ô lưới đã quét từ Goong API)
--    Mỗi ô ~38km x 38km (SCAN_CELL_DEG = 0.35°)
--    Khi ô đã có trong bảng này → không gọi Goong API nữa, chỉ query DB
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scanned_regions (
                                               id          BIGSERIAL PRIMARY KEY,
                                               grid_lat    INTEGER     NOT NULL,
                                               grid_lng    INTEGER     NOT NULL,
                                               center_lat  DOUBLE PRECISION NOT NULL,
                                               center_lng  DOUBLE PRECISION NOT NULL,
                                               atm_count   INTEGER     DEFAULT 0,
                                               scanned_at  TIMESTAMP   NOT NULL,
                                               CONSTRAINT uq_grid UNIQUE (grid_lat, grid_lng)
    );

CREATE INDEX IF NOT EXISTS idx_scanned_regions_grid
    ON scanned_regions (grid_lat, grid_lng);

CREATE INDEX IF NOT EXISTS idx_scanned_regions_at
    ON scanned_regions (scanned_at);

-- ══════════════════════════════════════════════════════════════════════════
-- 3. (Optional) Xóa dữ liệu cũ trong atm_cache nếu muốn quét lại sạch
--    Bỏ comment dòng dưới nếu muốn reset toàn bộ cache:
-- ══════════════════════════════════════════════════════════════════════════
TRUNCATE TABLE atm_cache;