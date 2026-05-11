CREATE TABLE notifications (
                               id BIGINT PRIMARY KEY AUTO_INCREMENT,

                               title VARCHAR(255) NOT NULL,

                               body TEXT,

                               link VARCHAR(255),

                               is_read BIT(1) NOT NULL DEFAULT 0,

                               type ENUM(
        'BUDGET_WARNING',
        'BUDGET_EXCEEDED',
        'TRANSACTION_CREATED',
        'ARTICLE_APPROVED',
        'ARTICLE_REJECTED',
        'TRAVEL_REMINDER'
    ) NOT NULL,

                               created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),

                               user_id BIGINT NOT NULL,

                               CONSTRAINT fk_notification_user
                                   FOREIGN KEY (user_id)
                                       REFERENCES users(id)
                                       ON DELETE CASCADE
);