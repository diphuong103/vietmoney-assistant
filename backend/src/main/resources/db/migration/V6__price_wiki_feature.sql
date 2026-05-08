-- =========================================
-- PRICE WIKI - EXTENSION MODULE (ENTERPRISE VERSION)
-- =========================================

-- =========================================
-- 1. FIX DATA TYPE
-- =========================================
ALTER TABLE city_price_wikis
MODIFY min_price DECIMAL(15,2),
MODIFY max_price DECIMAL(15,2);

-- =========================================
-- 2. MASTER DATA: PRICE CATEGORIES
-- =========================================
CREATE TABLE IF NOT EXISTS price_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(20),
    color VARCHAR(100),
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 3. MASTER DATA: PRICE UNITS
-- =========================================
CREATE TABLE IF NOT EXISTS price_units (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 4. OPTIONAL NORMALIZATION FOR city_price_wikis
-- (Giữ category/unit cũ để backward compatibility)
-- =========================================
ALTER TABLE city_price_wikis
ADD COLUMN category_id BIGINT NULL,
ADD COLUMN unit_id BIGINT NULL;

ALTER TABLE city_price_wikis
ADD CONSTRAINT fk_city_price_category
FOREIGN KEY (category_id) REFERENCES price_categories(id)
ON DELETE SET NULL;

ALTER TABLE city_price_wikis
ADD CONSTRAINT fk_city_price_unit
FOREIGN KEY (unit_id) REFERENCES price_units(id)
ON DELETE SET NULL;

-- =========================================
-- 5. USER SUBMIT PRICE (User submit giá thực tế)
-- =========================================
CREATE TABLE IF NOT EXISTS price_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    city VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    item VARCHAR(100) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    unit VARCHAR(30),
    note VARCHAR(255),
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_price_reports_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_price_reports_main
ON price_reports(city, category, item);

-- =========================================
-- 6. VOTE PRICE (user nhập giá sai-SPAM)
-- =========================================
CREATE TABLE IF NOT EXISTS price_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    report_id BIGINT NOT NULL,
    vote ENUM('UP','DOWN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_vote (user_id, report_id),

    CONSTRAINT fk_price_vote_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_price_vote_report
        FOREIGN KEY (report_id) REFERENCES price_reports(id)
        ON DELETE CASCADE
);

-- =========================================
-- 7. PRICE HISTORY (giá trung bình theo ngày)
-- =========================================
CREATE TABLE IF NOT EXISTS price_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    item VARCHAR(100) NOT NULL,
    avg_price DECIMAL(15,2),
    min_price DECIMAL(15,2),
    max_price DECIMAL(15,2),
    recorded_at DATE,

    INDEX idx_price_history (city, category, item)
);

-- =========================================
-- 8. FAVORITE ITEMS (USER lưu item quan tâm)
-- =========================================
CREATE TABLE IF NOT EXISTS price_favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    city VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    item VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_favorite (user_id, city, item),

    CONSTRAINT fk_price_fav_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================
-- 9. CURRENCY TABLE (REPLACE HARDCODE)
-- =========================================
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(10) PRIMARY KEY,
    rate_to_vnd DECIMAL(15,4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- =========================================
-- 9.1 COUNTRIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS countries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(10) NOT NULL UNIQUE,          -- VN, US, KR
    name VARCHAR(100) NOT NULL,                -- Vietnam, United States
    currency_code VARCHAR(10) NOT NULL,        -- VND, USD, KRW

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_countries_currency
        FOREIGN KEY (currency_code)
        REFERENCES currencies(code)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX idx_countries_active
ON countries(active, name);


-- =========================================
-- 9.2 CITIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS cities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    country_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,                -- Da Nang, Seoul
    normalized_name VARCHAR(150) NOT NULL,     -- da_nang, seoul
    province VARCHAR(100),                     -- Da Nang, California
    is_popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cities_country
        FOREIGN KEY (country_id)
        REFERENCES countries(id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_city_country (country_id, normalized_name)
);

CREATE INDEX idx_cities_lookup
ON cities(country_id, normalized_name, active);


-- =========================================
-- 10. PRICE RECOMMENDATION (Gợi ý theo budget)
-- =========================================
CREATE TABLE IF NOT EXISTS price_recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100),
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 11. INDEX OPTIMIZATION (QUAN TRỌNG)
-- =========================================
CREATE INDEX idx_city_price
ON city_price_wikis(city, category);

CREATE INDEX idx_price_reports_status
ON price_reports(status);

CREATE INDEX idx_price_category_active
ON price_categories(active, display_order);

CREATE INDEX idx_price_unit_active
ON price_units(active, display_order);

-- =========================================
-- 12. SEED DATA: CURRENCIES
-- =========================================
INSERT INTO currencies (code, rate_to_vnd) VALUES
('VND', 1),
('USD', 25420),
('EUR', 27810),
('KRW', 18.9)
ON DUPLICATE KEY UPDATE rate_to_vnd = VALUES(rate_to_vnd);

-- =========================================
-- 13. SEED DATA: PRICE CATEGORIES
-- =========================================
INSERT INTO price_categories (name, icon, color, display_order) VALUES
('Food','🍜','#F2C43D',1),
('Transport','🚗','#3D8FF2',2),
('Hotel','🏨','#C8F23D',3),
('Shopping','🛍️','#F23DC8',4),
('Entertainment','🎭','#3DF2C8',5),
('Other','📦','#999999',6)
ON DUPLICATE KEY UPDATE
icon = VALUES(icon),
color = VALUES(color),
display_order = VALUES(display_order);

-- =========================================
-- 14. SEED DATA: PRICE UNITS
-- =========================================
INSERT INTO price_units (name, display_order) VALUES
('bowl',1),
('plate',2),
('person',3),
('night',4),
('trip',5),
('item',6),
('hour',7),
('kg',8),
('bottle',9)
ON DUPLICATE KEY UPDATE
display_order = VALUES(display_order);

-- =========================================
-- 15. DROP LEGACY COLUMNS (SAFE)
-- =========================================
ALTER TABLE city_price_wikis
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS unit;
-- Xoá index cũ (nếu có)
DROP INDEX idx_city_price ON city_price_wikis;

-- Tạo lại index
CREATE INDEX idx_city_price
ON city_price_wikis(city, category_id);