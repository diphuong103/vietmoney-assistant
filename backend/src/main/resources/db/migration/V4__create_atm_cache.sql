-- V4__create_atm_cache.sql
CREATE TABLE IF NOT EXISTS atm_cache (
                                         id          BIGSERIAL PRIMARY KEY,
                                         place_id    VARCHAR(512) NOT NULL UNIQUE,
    name        VARCHAR(256),
    address     VARCHAR(512),
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    bank_key    VARCHAR(64),
    type        VARCHAR(32),
    grid_key    VARCHAR(32),
    scanned_at  TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_atm_cache_grid_key   ON atm_cache(grid_key);
CREATE INDEX IF NOT EXISTS idx_atm_cache_scanned_at ON atm_cache(scanned_at);