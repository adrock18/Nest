ALTER TABLE transactions ADD COLUMN trip_expense_id TEXT;
CREATE UNIQUE INDEX transactions_trip_expense_unique
ON transactions(trip_expense_id) WHERE trip_expense_id IS NOT NULL;
CREATE TRIGGER clear_deleted_trip_source AFTER DELETE ON trip_expenses
BEGIN
    UPDATE transactions SET trip_expense_id = NULL WHERE trip_expense_id = OLD.id;
END;
INSERT OR IGNORE INTO categories (id, name, color, is_income) VALUES
('cat-transport', 'Transport', '#60a5fa', 0),
('cat-home', 'Home', '#2dd4bf', 0),
('cat-personal-care', 'Personal Care', '#f472b6', 0),
('cat-shopping', 'Shopping', '#fb923c', 0);
PRAGMA user_version = 5;
