ALTER TABLE travel_plans
    ADD COLUMN currency VARCHAR(10) DEFAULT 'VND' AFTER budget,
    ADD COLUMN number_of_people INT DEFAULT 1 AFTER currency;
