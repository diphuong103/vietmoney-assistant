-- =========================================
-- 1. CREATE NEW TABLE: categories
-- =========================================
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('INCOME','EXPENSE') NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================
-- 2. ADD category_id TO transactions
-- =========================================
ALTER TABLE transactions
ADD COLUMN category_id BIGINT NULL AFTER budget_id;


-- =========================================
-- 3. ADD FOREIGN KEY
-- =========================================
ALTER TABLE transactions
ADD CONSTRAINT fk_transaction_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE SET NULL;


-- =========================================
-- 4. MIGRATE EXISTING OLD CATEGORY DATA
-- =========================================
INSERT INTO categories (user_id, name, type, is_default)
SELECT DISTINCT
    t.user_id,
    t.category,
    t.type,
    TRUE
FROM transactions t
WHERE t.category IS NOT NULL
  AND t.category <> '';


-- =========================================
-- 5. MAP category_id BACK TO transactions
-- =========================================
UPDATE transactions t
JOIN categories c
    ON t.user_id = c.user_id
   AND t.category = c.name
   AND t.type = c.type
SET t.category_id = c.id
WHERE t.category_id IS NULL;