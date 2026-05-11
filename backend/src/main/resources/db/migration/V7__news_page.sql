-- =========================================================
-- V7__news_page_complete_system.sql
-- NEWS PAGE FULL SYSTEM (CRUD → FEED → SOCIAL → ADMIN → SCALE)
-- Đồng bộ với:
-- users / notifications / tourist_spots / travel_plans / city_price_wikis
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- DROP OLD NEWS TABLES
-- =========================================================
DROP TABLE IF EXISTS comment_likes;
DROP TABLE IF EXISTS article_reports;
DROP TABLE IF EXISTS article_likes;
DROP TABLE IF EXISTS article_comments;
DROP TABLE IF EXISTS article_hashtags;
DROP TABLE IF EXISTS hashtags;
DROP TABLE IF EXISTS article_media;
DROP TABLE IF EXISTS article_shares;
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS saved_articles;
DROP TABLE IF EXISTS articles;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 1. ARTICLES
-- =========================================================
CREATE TABLE articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    author_id BIGINT NOT NULL,

    title VARCHAR(255) NULL,
    content LONGTEXT NOT NULL,

    category ENUM(
        'GENERAL',
        'TRAVEL',
        'FOOD',
        'BUDGET',
        'SCAM_ALERT',
        'TRANSPORT',
        'HOTEL',
        'TIPS'
    ) DEFAULT 'GENERAL',

    tourist_spot_id BIGINT NULL,
    travel_plan_id BIGINT NULL,
    city_price_wiki_id BIGINT NULL,

    location VARCHAR(255) NULL,

    visibility ENUM('PUBLIC','PRIVATE','FOLLOWERS') DEFAULT 'PUBLIC',

    status ENUM('DRAFT','PENDING','APPROVED','REJECTED') DEFAULT 'DRAFT',
    rejection_reason VARCHAR(255),

    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    save_count BIGINT DEFAULT 0,

    is_featured BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    edited_at TIMESTAMP NULL,

    FULLTEXT KEY ft_articles_search(title, content),

    CONSTRAINT fk_articles_author
        FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_articles_tourist_spot
        FOREIGN KEY (tourist_spot_id) REFERENCES tourist_spots(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_articles_travel_plan
        FOREIGN KEY (travel_plan_id) REFERENCES travel_plans(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_articles_city_price
        FOREIGN KEY (city_price_wiki_id) REFERENCES city_price_wikis(id)
        ON DELETE SET NULL
);

-- =========================================================
-- 2. ARTICLE MEDIA
-- =========================================================
CREATE TABLE article_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    article_id BIGINT NOT NULL,

    media_url VARCHAR(1000) NOT NULL,
    media_type ENUM('IMAGE','VIDEO') NOT NULL,

    thumbnail_url VARCHAR(1000) NULL,
    mime_type VARCHAR(100) NULL,
    file_size BIGINT NULL,
    duration_seconds INT NULL,

    display_order INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_article_media_article
        FOREIGN KEY (article_id) REFERENCES articles(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 3. HASHTAGS
-- =========================================================
CREATE TABLE hashtags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE article_hashtags (
    article_id BIGINT NOT NULL,
    hashtag_id BIGINT NOT NULL,

    PRIMARY KEY(article_id, hashtag_id),

    CONSTRAINT fk_article_hashtags_article
        FOREIGN KEY (article_id) REFERENCES articles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_article_hashtags_hashtag
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 4. COMMENTS
-- =========================================================
CREATE TABLE article_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    article_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    parent_comment_id BIGINT NULL,

    content TEXT NOT NULL,

    like_count BIGINT DEFAULT 0,

    is_edited BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_article_comments_article
        FOREIGN KEY (article_id) REFERENCES articles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_article_comments_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_article_comments_parent
        FOREIGN KEY (parent_comment_id) REFERENCES article_comments(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 5. COMMENT LIKES
-- =========================================================
CREATE TABLE comment_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_comment_like(comment_id, user_id),

    CONSTRAINT fk_comment_likes_comment
        FOREIGN KEY (comment_id) REFERENCES article_comments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_likes_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 6. ARTICLE LIKES
-- =========================================================
CREATE TABLE article_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    article_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_article_like(article_id, user_id),

    CONSTRAINT fk_article_likes_article
        FOREIGN KEY (article_id) REFERENCES articles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_article_likes_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 7. SAVED ARTICLES
-- =========================================================
CREATE TABLE saved_articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    article_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    folder VARCHAR(100) DEFAULT 'DEFAULT',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_saved_article(article_id, user_id),

    CONSTRAINT fk_saved_articles_article
        FOREIGN KEY (article_id) REFERENCES articles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_articles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 8. ARTICLE SHARES
-- =========================================================
CREATE TABLE article_shares (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    article_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    share_type ENUM(
        'INTERNAL',
        'LINK',
        'FACEBOOK',
        'ZALO',
        'MESSENGER'
    ) DEFAULT 'INTERNAL',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_article_shares_article
        FOREIGN KEY (article_id) REFERENCES articles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_article_shares_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 9. REPORT POSTS
-- =========================================================
CREATE TABLE article_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    article_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,

    reason VARCHAR(255) NOT NULL,

    status ENUM('PENDING','REVIEWED','DISMISSED') DEFAULT 'PENDING',

    reviewed_by BIGINT NULL,
    reviewed_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_article_reports_article
        FOREIGN KEY (article_id) REFERENCES articles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_article_reports_user
        FOREIGN KEY (reporter_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_article_reports_admin
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON DELETE SET NULL
);

-- =========================================================
-- 10. USER FOLLOWS
-- =========================================================
CREATE TABLE user_follows (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    follower_id BIGINT NOT NULL,
    following_id BIGINT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_follow(follower_id, following_id),

    CONSTRAINT fk_user_follows_follower
        FOREIGN KEY (follower_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_follows_following
        FOREIGN KEY (following_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- PERFORMANCE INDEXES
-- =========================================================
CREATE INDEX idx_articles_feed
ON articles(status, visibility, deleted, created_at);

CREATE INDEX idx_articles_author
ON articles(author_id, deleted);

CREATE INDEX idx_articles_category
ON articles(category, created_at);

CREATE INDEX idx_articles_location
ON articles(location);

CREATE INDEX idx_article_media_article
ON article_media(article_id);

CREATE INDEX idx_hashtag_name
ON hashtags(name);

CREATE INDEX idx_comments_article
ON article_comments(article_id, deleted);

CREATE INDEX idx_comments_parent
ON article_comments(parent_comment_id);

CREATE INDEX idx_saved_articles_user
ON saved_articles(user_id);

CREATE INDEX idx_article_reports_status
ON article_reports(status);

CREATE INDEX idx_user_follows_following
ON user_follows(following_id);

-- =========================================================
-- DEFAULT HASHTAGS
-- =========================================================
INSERT IGNORE INTO hashtags(name) VALUES
('#travel'),
('#food'),
('#budget'),
('#tips'),
('#scamalert'),
('#danang'),
('#hoian');