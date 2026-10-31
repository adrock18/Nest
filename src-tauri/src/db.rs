use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::{Path, PathBuf};
use crate::models::{Account, CategoryBudget, MonthlySummary, Transaction, Trip, TripExpense};

pub fn get_db_path() -> PathBuf {
    let mut base_dir = dirs_fallback();
    base_dir.push("Nest");
    let _ = fs::create_dir_all(&base_dir);
    base_dir.push("nest.db");
    base_dir
}

fn dirs_fallback() -> PathBuf {
    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        PathBuf::from(local_app_data)
    } else if let Ok(home) = std::env::var("USERPROFILE") {
        let mut p = PathBuf::from(home);
        p.push(".nest");
        p
    } else {
        PathBuf::from(".")
    }
}

pub fn init_database(conn: &mut Connection) -> Result<()> {
    // Check schema version
    let version: i32 = conn.query_row("PRAGMA user_version;", [], |row| row.get(0))?;

    if version < 1 {
        let tx = conn.transaction()?;

        // 1. Accounts Table
        tx.execute(
            "CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                account_type TEXT NOT NULL,
                starting_balance_paise INTEGER NOT NULL
            );",
            [],
        )?;

        // 2. Categories Table
        tx.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT NOT NULL,
                is_income INTEGER NOT NULL
            );",
            [],
        )?;

        // 3. Transactions Table (Integer Paise Precision)
        tx.execute(
            "CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                flow_type TEXT NOT NULL,
                account_id TEXT NOT NULL,
                category TEXT NOT NULL,
                notes TEXT NOT NULL,
                tags_json TEXT NOT NULL,
                is_recurring INTEGER NOT NULL,
                amount_paise INTEGER NOT NULL
            );",
            [],
        )?;

        // 4. Budgets Table
        tx.execute(
            "CREATE TABLE IF NOT EXISTS budgets (
                category TEXT PRIMARY KEY,
                limit_paise INTEGER NOT NULL,
                color TEXT NOT NULL
            );",
            [],
        )?;

        // Seed Default Categories
        let seed_categories = [
            ("cat-general", "General Spending", "#64748b", 0),
            ("cat-rent", "Rent", "#0ea5e9", 0),
            ("cat-groceries", "Groceries", "#10b981", 0),
            ("cat-dining", "Dining Out", "#f59e0b", 0),
            ("cat-fuel", "Fuel", "#8b5cf6", 0),
            ("cat-utilities", "Utilities", "#ec4899", 0),
            ("cat-subscriptions", "Subscriptions", "#f43f5e", 0),
            ("cat-healthcare", "Healthcare", "#14b8a6", 0),
            ("cat-salary", "Salary", "#10b981", 1),
            ("cat-freelance", "Freelance", "#0ea5e9", 1),
            ("cat-other", "Other", "#94a3b8", 0),
        ];

        for (id, name, color, is_inc) in seed_categories {
            tx.execute(
                "INSERT OR IGNORE INTO categories (id, name, color, is_income) VALUES (?1, ?2, ?3, ?4);",
                params![id, name, color, is_inc],
            )?;
        }

        // Seed Default Accounts (V1: Unified Primary Amount)
        let seed_accounts = [
            ("acc-primary", "Primary Amount", "bank", 15000000),
        ];

        for (id, name, acc_type, bal) in seed_accounts {
            tx.execute(
                "INSERT OR IGNORE INTO accounts (id, name, account_type, starting_balance_paise) VALUES (?1, ?2, ?3, ?4);",
                params![id, name, acc_type, bal],
            )?;
        }

        // Seed Default Category Budgets
        let seed_budgets = [
            ("Rent", 2500000, "#0ea5e9"),
            ("Groceries", 1000000, "#10b981"),
            ("Dining Out", 500000, "#f59e0b"),
            ("Fuel", 500000, "#8b5cf6"),
            ("Utilities", 400000, "#ec4899"),
            ("Subscriptions", 200000, "#f43f5e"),
        ];

        for (cat, limit, col) in seed_budgets {
            tx.execute(
                "INSERT OR IGNORE INTO budgets (category, limit_paise, color) VALUES (?1, ?2, ?3);",
                params![cat, limit, col],
            )?;
        }

        tx.execute("PRAGMA user_version = 2;", [])?;
        tx.commit()?;
    }

    if version < 2 {
        let tx = conn.transaction()?;
        // Migration to version 2: Consolidate legacy bank-specific accounts into unified Primary Amount
        tx.execute(
            "INSERT OR IGNORE INTO accounts (id, name, account_type, starting_balance_paise) VALUES ('acc-primary', 'Primary Amount', 'bank', 15000000);",
            [],
        )?;
        tx.execute(
            "UPDATE transactions SET account_id = 'acc-primary' WHERE account_id IN ('acc-hdfc', 'acc-icici', 'acc-cash');",
            [],
        )?;
        tx.execute(
            "DELETE FROM accounts WHERE id IN ('acc-hdfc', 'acc-icici', 'acc-cash');",
            [],
        )?;
        tx.execute("PRAGMA user_version = 2;", [])?;
        tx.commit()?;
    }

    if version < 3 {
        let tx = conn.transaction()?;

        // 5. Trips Table
        tx.execute(
            "CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                destination TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                budget_paise INTEGER NOT NULL,
                members_json TEXT NOT NULL,
                cover_color TEXT NOT NULL,
                created_at TEXT NOT NULL
            );",
            [],
        )?;

        // 6. Trip Expenses Table
        tx.execute(
            "CREATE TABLE IF NOT EXISTS trip_expenses (
                id TEXT PRIMARY KEY,
                trip_id TEXT NOT NULL,
                date TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                amount_paise INTEGER NOT NULL,
                paid_by TEXT NOT NULL,
                split_type TEXT NOT NULL,
                split_members_json TEXT NOT NULL,
                my_share_paise INTEGER NOT NULL,
                notes TEXT,
                items_json TEXT,
                receipt_image TEXT,
                FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
            );",
            [],
        )?;

        // Seed Sample Trip: Goa Coastal & Adventure Trip
        tx.execute(
            "INSERT OR IGNORE INTO trips (id, name, destination, start_date, end_date, budget_paise, members_json, cover_color, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);",
            params![
                "trip-goa-2026",
                "Goa Coastal & Adventure Trip",
                "Goa, India",
                "2026-10-18",
                "2026-10-24",
                6000000,
                "[\"Me\",\"Aarav\",\"Pooja\",\"Vikram\"]",
                "#06b6d4",
                "2026-10-15"
            ],
        )?;

        let seed_trip_expenses = [
            (
                "texp-1",
                "trip-goa-2026",
                "2026-10-18",
                "Airport Prepaid Taxi to Resort",
                "transport",
                240000,
                "Me",
                "equal",
                "[\"Me\",\"Aarav\",\"Pooja\",\"Vikram\"]",
                60000,
                "Prepaid counter taxi from Dabolim airport to Candolim"
            ),
            (
                "texp-2",
                "trip-goa-2026",
                "2026-10-18",
                "Heritage Boutique Beach Villa - 3 Nights",
                "stay",
                2400000,
                "Aarav",
                "equal",
                "[\"Me\",\"Aarav\",\"Pooja\",\"Vikram\"]",
                600000,
                "4-bedroom private villa with pool close to the beach"
            ),
            (
                "texp-3",
                "trip-goa-2026",
                "2026-10-19",
                "Morning Surfing Lessons & Board Rental",
                "activities",
                600000,
                "Me",
                "custom",
                "[\"Me\",\"Vikram\"]",
                300000,
                "2-hour beginner surfing session with instructor at Ashwem Beach"
            ),
            (
                "texp-4",
                "trip-goa-2026",
                "2026-10-20",
                "Backwater Sea Kayaking & Mangrove Safari",
                "activities",
                480000,
                "Pooja",
                "equal",
                "[\"Me\",\"Aarav\",\"Pooja\",\"Vikram\"]",
                120000,
                "Guided double kayaks through Chapora river mangroves"
            ),
            (
                "texp-5",
                "trip-goa-2026",
                "2026-10-20",
                "Seafood Dinner at Fisherman's Wharf",
                "food",
                520000,
                "Me",
                "equal",
                "[\"Me\",\"Aarav\",\"Pooja\",\"Vikram\"]",
                130000,
                "Butter garlic prawns, fish curry, cocktails and desserts"
            ),
            (
                "texp-6",
                "trip-goa-2026",
                "2026-10-21",
                "Car Petrol Tank Refill & Highway Tolls",
                "fuel",
                320000,
                "Vikram",
                "equal",
                "[\"Me\",\"Aarav\",\"Pooja\",\"Vikram\"]",
                80000,
                "HPCL petrol refill for rented Thar"
            ),
        ];

        for (id, tid, dt, tit, cat, amt, pb, st, sm, ms, n) in seed_trip_expenses {
            tx.execute(
                "INSERT OR IGNORE INTO trip_expenses (id, trip_id, date, title, category, amount_paise, paid_by, split_type, split_members_json, my_share_paise, notes)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11);",
                params![id, tid, dt, tit, cat, amt, pb, st, sm, ms, n],
            )?;
        }

        tx.execute("PRAGMA user_version = 3;", [])?;
        tx.commit()?;
    }

    if version < 4 {
        let tx = conn.transaction()?;

        // Add items_json and receipt_image columns if missing
        let has_items: bool = {
            let mut stmt = tx.prepare("PRAGMA table_info(trip_expenses);")?;
            let mut rows = stmt.query([])?;
            let mut found = false;
            while let Some(row) = rows.next()? {
                let col_name: String = row.get(1)?;
                if col_name == "items_json" {
                    found = true;
                    break;
                }
            }
            found
        };

        if !has_items {
            tx.execute("ALTER TABLE trip_expenses ADD COLUMN items_json TEXT;", [])?;
            tx.execute("ALTER TABLE trip_expenses ADD COLUMN receipt_image TEXT;", [])?;
        }

        // Populate sample itemized bill for seed expense texp-5 (Seafood Dinner)
        let sample_items_json = r#"[
            {"id":"item-1","name":"Butter Garlic Tiger Prawns (Shared)","quantity":1,"pricePaise":140000,"totalPaise":140000,"isMine":true,"isShared":true},
            {"id":"item-2","name":"Kingfish Rava Fry","quantity":1,"pricePaise":65000,"totalPaise":65000,"isMine":true,"isShared":false},
            {"id":"item-3","name":"Garlic Butter Naan Basket (Shared)","quantity":4,"pricePaise":6000,"totalPaise":24000,"isMine":true,"isShared":true},
            {"id":"item-4","name":"Fresh Lime Soda Sweet & Salt","quantity":1,"pricePaise":11000,"totalPaise":11000,"isMine":true,"isShared":false},
            {"id":"item-5","name":"Goan Prawn Curry & Steamed Rice","quantity":2,"pricePaise":85000,"totalPaise":170000,"isMine":false,"isShared":false},
            {"id":"item-6","name":"Craft Beer Pitchers (Shared by 3)","quantity":2,"pricePaise":40000,"totalPaise":80000,"isMine":false,"isShared":false},
            {"id":"item-7","name":"GST (5%) & Service Charge (10%)","quantity":1,"pricePaise":30000,"totalPaise":30000,"isMine":true,"isShared":true}
        ]"#;

        let _ = tx.execute(
            "UPDATE trip_expenses SET split_type = 'itemized', items_json = ?1 WHERE id = 'texp-5';",
            params![sample_items_json],
        );

        tx.execute("PRAGMA user_version = 4;", [])?;
        tx.commit()?;
    }

    Ok(())
}

// Queries & Persistence API
pub fn fetch_accounts(conn: &Connection) -> Result<Vec<Account>> {
    let mut stmt = conn.prepare("SELECT id, name, account_type, starting_balance_paise FROM accounts ORDER BY name ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(Account {
            id: row.get(0)?,
            name: row.get(1)?,
            account_type: row.get(2)?,
            starting_balance_paise: row.get(3)?,
        })
    })?;

    let mut accounts = Vec::new();
    for acc in rows {
        accounts.push(acc?);
    }
    Ok(accounts)
}

pub fn fetch_transactions(conn: &Connection, month_prefix: Option<&str>) -> Result<Vec<Transaction>> {
    let query = match month_prefix {
        Some(_) => "SELECT id, date, flow_type, account_id, category, notes, tags_json, is_recurring, amount_paise FROM transactions WHERE date LIKE ?1 ORDER BY date DESC, id DESC",
        None => "SELECT id, date, flow_type, account_id, category, notes, tags_json, is_recurring, amount_paise FROM transactions ORDER BY date DESC, id DESC",
    };

    let mut stmt = conn.prepare(query)?;
    let rows = if let Some(m) = month_prefix {
        let pattern = format!("{}%", m);
        stmt.query_map(params![pattern], parse_transaction_row)?
    } else {
        stmt.query_map([], parse_transaction_row)?
    };

    let mut list = Vec::new();
    for tx in rows {
        list.push(tx?);
    }
    Ok(list)
}

fn parse_transaction_row(row: &rusqlite::Row) -> Result<Transaction> {
    let tags_json: String = row.get(6)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    let is_recurring_num: i32 = row.get(7)?;

    Ok(Transaction {
        id: row.get(0)?,
        date: row.get(1)?,
        flow_type: row.get(2)?,
        account_id: row.get(3)?,
        category: row.get(4)?,
        notes: row.get(5)?,
        tags,
        is_recurring: is_recurring_num != 0,
        amount_paise: row.get(8)?,
    })
}

pub fn insert_transaction(conn: &Connection, tx: &Transaction) -> Result<()> {
    let tags_json = serde_json::to_string(&tx.tags).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "INSERT INTO transactions (id, date, flow_type, account_id, category, notes, tags_json, is_recurring, amount_paise)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            tx.id,
            tx.date,
            tx.flow_type,
            tx.account_id,
            tx.category,
            tx.notes,
            tags_json,
            if tx.is_recurring { 1 } else { 0 },
            tx.amount_paise
        ],
    )?;
    Ok(())
}

pub fn remove_transaction(conn: &Connection, id: &str) -> Result<bool> {
    let affected = conn.execute("DELETE FROM transactions WHERE id = ?1", params![id])?;
    Ok(affected > 0)
}

pub fn fetch_budgets(conn: &Connection) -> Result<Vec<CategoryBudget>> {
    let mut stmt = conn.prepare("SELECT category, limit_paise, color FROM budgets ORDER BY category ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(CategoryBudget {
            category: row.get(0)?,
            limit_paise: row.get(1)?,
            color: row.get(2)?,
        })
    })?;

    let mut budgets = Vec::new();
    for b in rows {
        budgets.push(b?);
    }
    Ok(budgets)
}

pub fn save_budget_limit(conn: &Connection, budget: &CategoryBudget) -> Result<()> {
    conn.execute(
        "INSERT INTO budgets (category, limit_paise, color) VALUES (?1, ?2, ?3)
         ON CONFLICT(category) DO UPDATE SET limit_paise = excluded.limit_paise, color = excluded.color",
        params![budget.category, budget.limit_paise, budget.color],
    )?;
    Ok(())
}

pub fn calculate_monthly_summary(conn: &Connection, month_prefix: &str) -> Result<MonthlySummary> {
    let pattern = format!("{}%", month_prefix);

    let inflow: i64 = conn.query_row(
        "SELECT COALESCE(SUM(amount_paise), 0) FROM transactions WHERE flow_type = 'income' AND date LIKE ?1",
        params![pattern],
        |row| row.get(0),
    )?;

    let outflow: i64 = conn.query_row(
        "SELECT COALESCE(SUM(amount_paise), 0) FROM transactions WHERE flow_type = 'expense' AND date LIKE ?1",
        params![pattern],
        |row| row.get(0),
    )?;

    let recurring: i64 = conn.query_row(
        "SELECT COALESCE(SUM(amount_paise), 0) FROM transactions WHERE flow_type = 'expense' AND is_recurring = 1 AND date LIKE ?1",
        params![pattern],
        |row| row.get(0),
    )?;

    let net_savings = inflow - outflow;
    let savings_rate = if inflow > 0 {
        ((net_savings as f64) / (inflow as f64)) * 100.0
    } else {
        0.0
    };

    Ok(MonthlySummary {
        total_inflow_paise: inflow,
        total_outflow_paise: outflow,
        net_savings_paise: net_savings,
        savings_rate_percentage: if savings_rate < 0.0 { 0.0 } else { savings_rate },
        recurring_commitment_paise: recurring,
    })
}

// Point-in-Time SQLite Backup Drill
pub fn vacuum_into_backup(conn: &Connection, target_file_path: &Path) -> Result<()> {
    let target_str = target_file_path.to_string_lossy();
    conn.execute(&format!("VACUUM INTO '{}';", target_str.replace("'", "''")), [])?;
    Ok(())
}

// Trips & Trip Expenses Persistence API
pub fn fetch_trips(conn: &Connection) -> Result<Vec<Trip>> {
    let mut stmt = conn.prepare("SELECT id, name, destination, start_date, end_date, budget_paise, members_json, cover_color, created_at FROM trips ORDER BY start_date DESC")?;
    let rows = stmt.query_map([], |row| {
        let members_json: String = row.get(6)?;
        let members: Vec<String> = serde_json::from_str(&members_json).unwrap_or_default();
        Ok(Trip {
            id: row.get(0)?,
            name: row.get(1)?,
            destination: row.get(2)?,
            start_date: row.get(3)?,
            end_date: row.get(4)?,
            budget_paise: row.get(5)?,
            members,
            cover_color: row.get(7)?,
            created_at: row.get(8)?,
        })
    })?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r?);
    }
    Ok(list)
}

pub fn insert_trip(conn: &Connection, trip: &Trip) -> Result<()> {
    let members_json = serde_json::to_string(&trip.members).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "INSERT INTO trips (id, name, destination, start_date, end_date, budget_paise, members_json, cover_color, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(id) DO UPDATE SET 
            name = excluded.name,
            destination = excluded.destination,
            start_date = excluded.start_date,
            end_date = excluded.end_date,
            budget_paise = excluded.budget_paise,
            members_json = excluded.members_json,
            cover_color = excluded.cover_color",
        params![
            trip.id,
            trip.name,
            trip.destination,
            trip.start_date,
            trip.end_date,
            trip.budget_paise,
            members_json,
            trip.cover_color,
            trip.created_at
        ],
    )?;
    Ok(())
}

pub fn remove_trip(conn: &Connection, id: &str) -> Result<bool> {
    let _ = conn.execute("DELETE FROM trip_expenses WHERE trip_id = ?1", params![id]);
    let affected = conn.execute("DELETE FROM trips WHERE id = ?1", params![id])?;
    Ok(affected > 0)
}

pub fn fetch_trip_expenses(conn: &Connection, trip_id: Option<&str>) -> Result<Vec<TripExpense>> {
    let (query, has_param) = match trip_id {
        Some(_) => (
            "SELECT id, trip_id, date, title, category, amount_paise, paid_by, split_type, split_members_json, my_share_paise, notes, items_json, receipt_image FROM trip_expenses WHERE trip_id = ?1 ORDER BY date DESC, id DESC",
            true
        ),
        None => (
            "SELECT id, trip_id, date, title, category, amount_paise, paid_by, split_type, split_members_json, my_share_paise, notes, items_json, receipt_image FROM trip_expenses ORDER BY date DESC, id DESC",
            false
        ),
    };

    let mut stmt = conn.prepare(query)?;
    let rows = if has_param {
        stmt.query_map(params![trip_id.unwrap()], parse_trip_expense_row)?
    } else {
        stmt.query_map([], parse_trip_expense_row)?
    };

    let mut list = Vec::new();
    for r in rows {
        list.push(r?);
    }
    Ok(list)
}

fn parse_trip_expense_row(row: &rusqlite::Row) -> Result<TripExpense> {
    let split_members_json: String = row.get(8)?;
    let split_members: Vec<String> = serde_json::from_str(&split_members_json).unwrap_or_default();

    let items_raw: Option<String> = row.get(11)?;
    let items: Option<Vec<crate::models::ExpenseItem>> = items_raw.and_then(|json| serde_json::from_str(&json).ok());
    let receipt_image: Option<String> = row.get(12)?;

    Ok(TripExpense {
        id: row.get(0)?,
        trip_id: row.get(1)?,
        date: row.get(2)?,
        title: row.get(3)?,
        category: row.get(4)?,
        amount_paise: row.get(5)?,
        paid_by: row.get(6)?,
        split_type: row.get(7)?,
        split_members,
        my_share_paise: row.get(9)?,
        notes: row.get(10)?,
        items,
        receipt_image,
    })
}

pub fn insert_trip_expense(conn: &Connection, exp: &TripExpense) -> Result<()> {
    let split_members_json = serde_json::to_string(&exp.split_members).unwrap_or_else(|_| "[]".to_string());
    let items_json = exp.items.as_ref().map(|items| serde_json::to_string(items).unwrap_or_else(|_| "[]".to_string()));

    conn.execute(
        "INSERT INTO trip_expenses (id, trip_id, date, title, category, amount_paise, paid_by, split_type, split_members_json, my_share_paise, notes, items_json, receipt_image)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
         ON CONFLICT(id) DO UPDATE SET
            date = excluded.date,
            title = excluded.title,
            category = excluded.category,
            amount_paise = excluded.amount_paise,
            paid_by = excluded.paid_by,
            split_type = excluded.split_type,
            split_members_json = excluded.split_members_json,
            my_share_paise = excluded.my_share_paise,
            notes = excluded.notes,
            items_json = excluded.items_json,
            receipt_image = excluded.receipt_image",
        params![
            exp.id,
            exp.trip_id,
            exp.date,
            exp.title,
            exp.category,
            exp.amount_paise,
            exp.paid_by,
            exp.split_type,
            split_members_json,
            exp.my_share_paise,
            exp.notes,
            items_json,
            exp.receipt_image
        ],
    )?;
    Ok(())
}

pub fn remove_trip_expense(conn: &Connection, id: &str) -> Result<bool> {
    let affected = conn.execute("DELETE FROM trip_expenses WHERE id = ?1", params![id])?;
    Ok(affected > 0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use uuid::Uuid;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().expect("Failed to open test in-memory database");
        init_database(&mut conn).expect("Failed to initialize test database schema");
        conn
    }

    #[test]
    fn test_schema_init_and_idempotency() {
        let mut conn = setup_test_db();
        
        let version: i32 = conn.query_row("PRAGMA user_version;", [], |row| row.get(0)).unwrap();
        assert_eq!(version, 4);

        // Verify seeded accounts (V1: Unified Primary Amount)
        let accounts = fetch_accounts(&conn).unwrap();
        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].id, "acc-primary");
        assert_eq!(accounts[0].name, "Primary Amount");
        assert_eq!(accounts[0].starting_balance_paise, 15000000);

        // Verify seeded budgets
        let budgets = fetch_budgets(&conn).unwrap();
        assert_eq!(budgets.len(), 6);
        assert!(budgets.iter().any(|b| b.category == "Rent" && b.limit_paise == 2500000));

        // Re-run init_database to verify idempotency (no panic or duplicate key errors)
        init_database(&mut conn).expect("Database initialization must be idempotent");
        let accounts_after = fetch_accounts(&conn).unwrap();
        assert_eq!(accounts_after.len(), 1);
    }

    #[test]
    fn test_transaction_crud_and_integer_paise() {
        let conn = setup_test_db();

        let tx1 = Transaction {
            id: "tx-test-1".to_string(),
            date: "2026-10-15".to_string(),
            flow_type: "income".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Salary".to_string(),
            notes: "October Consulting Fee".to_string(),
            tags: vec!["#Consulting".to_string(), "#October".to_string()],
            is_recurring: true,
            amount_paise: 15000000, // ₹1,50,000.00
        };

        let tx2 = Transaction {
            id: "tx-test-2".to_string(),
            date: "2026-10-18".to_string(),
            flow_type: "expense".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Groceries".to_string(),
            notes: "Organic Market".to_string(),
            tags: vec!["#Food".to_string()],
            is_recurring: false,
            amount_paise: 245050, // ₹2,450.50
        };

        insert_transaction(&conn, &tx1).unwrap();
        insert_transaction(&conn, &tx2).unwrap();

        // Fetch all transactions
        let all = fetch_transactions(&conn, None).unwrap();
        assert_eq!(all.len(), 2);
        // Ordered by date DESC
        assert_eq!(all[0].id, "tx-test-2");
        assert_eq!(all[0].amount_paise, 245050);
        assert_eq!(all[0].tags, vec!["#Food".to_string()]);

        // Month filter matching
        let oct = fetch_transactions(&conn, Some("2026-10")).unwrap();
        assert_eq!(oct.len(), 2);

        // Month filter non-matching
        let nov = fetch_transactions(&conn, Some("2026-11")).unwrap();
        assert_eq!(nov.len(), 0);

        // Delete transaction
        let deleted = remove_transaction(&conn, "tx-test-1").unwrap();
        assert!(deleted);
        let remaining = fetch_transactions(&conn, None).unwrap();
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].id, "tx-test-2");

        // Delete non-existent transaction
        let not_found = remove_transaction(&conn, "non-existent-id").unwrap();
        assert!(!not_found);
    }

    #[test]
    fn test_sql_injection_resistance() {
        let conn = setup_test_db();

        let malicious_tx = Transaction {
            id: "tx-inject-1".to_string(),
            date: "2026-10-20".to_string(),
            flow_type: "expense".to_string(),
            account_id: "acc-hdfc'; DROP TABLE accounts; --".to_string(),
            category: "Groceries' OR '1'='1".to_string(),
            notes: "Robert'); DROP TABLE transactions; --".to_string(),
            tags: vec!["' OR 1=1 --".to_string(), "\"; DELETE FROM categories; --".to_string()],
            is_recurring: false,
            amount_paise: 99900,
        };

        // Insert must succeed safely without executing SQL injections
        insert_transaction(&conn, &malicious_tx).unwrap();

        // Verify accounts table still exists and intact
        let accounts = fetch_accounts(&conn).unwrap();
        assert_eq!(accounts.len(), 1);

        // Verify malicious tx was stored literally
        let txs = fetch_transactions(&conn, None).unwrap();
        assert_eq!(txs.len(), 1);
        assert_eq!(txs[0].notes, "Robert'); DROP TABLE transactions; --");
        assert_eq!(txs[0].account_id, "acc-hdfc'; DROP TABLE accounts; --");
        assert_eq!(txs[0].category, "Groceries' OR '1'='1");
    }

    #[test]
    fn test_unicode_emojis_and_long_notes() {
        let conn = setup_test_db();

        let long_notes = "A".repeat(2000) + " 🛒 ₹99.99 🇮🇳 \nLine 2 with \t tabs & \"quotes\" and 'single' quotes! 日本語 / हिंदी";

        let unicode_tx = Transaction {
            id: "tx-unicode-1".to_string(),
            date: "2026-02-29".to_string(), // Leap day string test
            flow_type: "expense".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Other".to_string(),
            notes: long_notes.clone(),
            tags: vec!["#दैनिक".to_string(), "#🛒Market".to_string()],
            is_recurring: true,
            amount_paise: 100000000, // ₹10,00,000.00
        };

        insert_transaction(&conn, &unicode_tx).unwrap();

        let fetched = fetch_transactions(&conn, None).unwrap();
        assert_eq!(fetched.len(), 1);
        assert_eq!(fetched[0].notes, long_notes);
        assert_eq!(fetched[0].tags, vec!["#दैनिक".to_string(), "#🛒Market".to_string()]);
    }

    #[test]
    fn test_monthly_summary_calculation_and_edge_cases() {
        let conn = setup_test_db();

        // 1. Inflow: ₹1,00,000.00 (10000000 paise)
        insert_transaction(&conn, &Transaction {
            id: "inc-1".to_string(),
            date: "2026-10-01".to_string(),
            flow_type: "income".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Salary".to_string(),
            notes: "Salary".to_string(),
            tags: vec![],
            is_recurring: true,
            amount_paise: 10000000,
        }).unwrap();

        // 2. Normal Outflow: ₹30,000.00 (3000000 paise)
        insert_transaction(&conn, &Transaction {
            id: "exp-1".to_string(),
            date: "2026-10-05".to_string(),
            flow_type: "expense".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Rent".to_string(),
            notes: "Rent".to_string(),
            tags: vec![],
            is_recurring: true,
            amount_paise: 3000000,
        }).unwrap();

        // 3. Recurring Outflow: ₹10,000.00 (1000000 paise)
        insert_transaction(&conn, &Transaction {
            id: "exp-2".to_string(),
            date: "2026-10-10".to_string(),
            flow_type: "expense".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Utilities".to_string(),
            notes: "Wifi".to_string(),
            tags: vec![],
            is_recurring: true,
            amount_paise: 1000000,
        }).unwrap();

        // 4. Non-recurring Outflow: ₹5,000.00 (500000 paise)
        insert_transaction(&conn, &Transaction {
            id: "exp-3".to_string(),
            date: "2026-10-12".to_string(),
            flow_type: "expense".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Groceries".to_string(),
            notes: "Groceries".to_string(),
            tags: vec![],
            is_recurring: false,
            amount_paise: 500000,
        }).unwrap();

        // Total Inflow: 10,000,000
        // Total Outflow: 3,000,000 + 1,000,000 + 500,000 = 4,500,000
        // Net Savings: 5,500,000
        // Savings Rate: (5,500,000 / 10,000,000) * 100 = 55.0%
        // Recurring: 3,000,000 + 1,000,000 = 4,000,000
        let summary = calculate_monthly_summary(&conn, "2026-10").unwrap();
        assert_eq!(summary.total_inflow_paise, 10000000);
        assert_eq!(summary.total_outflow_paise, 4500000);
        assert_eq!(summary.net_savings_paise, 5500000);
        assert!((summary.savings_rate_percentage - 55.0).abs() < 0.0001);
        assert_eq!(summary.recurring_commitment_paise, 4000000);

        // Edge case: Month with zero transactions
        let empty_summary = calculate_monthly_summary(&conn, "2025-01").unwrap();
        assert_eq!(empty_summary.total_inflow_paise, 0);
        assert_eq!(empty_summary.total_outflow_paise, 0);
        assert_eq!(empty_summary.net_savings_paise, 0);
        assert_eq!(empty_summary.savings_rate_percentage, 0.0);
        assert_eq!(empty_summary.recurring_commitment_paise, 0);
    }

    #[test]
    fn test_budget_upsert_logic() {
        let conn = setup_test_db();

        let updated_budget = CategoryBudget {
            category: "Groceries".to_string(),
            limit_paise: 1500000, // Updated from 1000000 to 1500000
            color: "#059669".to_string(),
        };

        save_budget_limit(&conn, &updated_budget).unwrap();

        let budgets = fetch_budgets(&conn).unwrap();
        let groceries = budgets.iter().find(|b| b.category == "Groceries").unwrap();
        assert_eq!(groceries.limit_paise, 1500000);
        assert_eq!(groceries.color, "#059669");

        // Insert brand new budget category
        let new_budget = CategoryBudget {
            category: "Travel".to_string(),
            limit_paise: 5000000,
            color: "#6366f1".to_string(),
        };
        save_budget_limit(&conn, &new_budget).unwrap();
        let budgets_after = fetch_budgets(&conn).unwrap();
        assert_eq!(budgets_after.len(), 7);
    }

    #[test]
    fn test_vacuum_backup_snapshot() {
        let conn = setup_test_db();

        // Insert a transaction before backing up
        insert_transaction(&conn, &Transaction {
            id: "tx-backup-1".to_string(),
            date: "2026-10-20".to_string(),
            flow_type: "income".to_string(),
            account_id: "acc-primary".to_string(),
            category: "Salary".to_string(),
            notes: "Pre-backup check".to_string(),
            tags: vec![],
            is_recurring: false,
            amount_paise: 5000000,
        }).unwrap();

        let temp_dir = std::env::temp_dir();
        let backup_file = temp_dir.join(format!("nest_test_backup_{}.db", Uuid::new_v4()));

        // Perform VACUUM INTO
        vacuum_into_backup(&conn, &backup_file).expect("VACUUM INTO backup failed");
        assert!(backup_file.exists());

        // Open backed up file and verify integrity
        let backup_conn = Connection::open(&backup_file).expect("Failed to open backup SQLite file");
        let accounts = fetch_accounts(&backup_conn).unwrap();
        assert_eq!(accounts.len(), 1);

        let txs = fetch_transactions(&backup_conn, None).unwrap();
        assert_eq!(txs.len(), 1);
        assert_eq!(txs[0].id, "tx-backup-1");

        // Clean up temp file
        let _ = std::fs::remove_file(backup_file);
    }

    #[test]
    fn test_trip_crud_and_expenses() {
        let conn = setup_test_db();

        // 1. Verify Seeded Trip
        let trips = fetch_trips(&conn).unwrap();
        assert_eq!(trips.len(), 1);
        assert_eq!(trips[0].id, "trip-goa-2026");
        assert_eq!(trips[0].budget_paise, 6000000); // ₹60,000

        // 2. Verify Seeded Expenses for Goa Trip
        let expenses = fetch_trip_expenses(&conn, Some("trip-goa-2026")).unwrap();
        assert_eq!(expenses.len(), 6);

        // 3. Insert New Trip
        let new_trip = Trip {
            id: "trip-manali-2027".to_string(),
            name: "Manali Trek & Snow Adventure".to_string(),
            destination: "Manali, Himachal Pradesh".to_string(),
            start_date: "2027-01-10".to_string(),
            end_date: "2027-01-16".to_string(),
            budget_paise: 5000000,
            members: vec!["Me".to_string(), "Kabir".to_string()],
            cover_color: "#8b5cf6".to_string(),
            created_at: "2026-10-27".to_string(),
        };
        insert_trip(&conn, &new_trip).unwrap();

        let all_trips = fetch_trips(&conn).unwrap();
        assert_eq!(all_trips.len(), 2);

        // 4. Insert New Trip Expense (with itemized breakdown)
        let sample_items = vec![
            crate::models::ExpenseItem {
                id: "item-ski-1".to_string(),
                name: "Full-day Ski Gear Rental (Me)".to_string(),
                quantity: 1,
                price_paise: 200000,
                total_paise: 200000,
                is_mine: true,
                is_shared: false,
                shared_with: None,
                my_consumed_quantity: Some(1),
            },
            crate::models::ExpenseItem {
                id: "item-ski-2".to_string(),
                name: "Instructor Group Pass (Shared)".to_string(),
                quantity: 1,
                price_paise: 150000,
                total_paise: 150000,
                is_mine: true,
                is_shared: true,
                shared_with: Some(vec!["Me".to_string(), "Kabir".to_string()]),
                my_consumed_quantity: None,
            },
        ];

        let new_exp = TripExpense {
            id: "texp-manali-1".to_string(),
            trip_id: "trip-manali-2027".to_string(),
            date: "2027-01-11".to_string(),
            title: "Skiing Lesson & Gear Rental".to_string(),
            category: "activities".to_string(),
            amount_paise: 350000,
            paid_by: "Me".to_string(),
            split_type: "itemized".to_string(),
            split_members: vec!["Me".to_string(), "Kabir".to_string()],
            my_share_paise: 275000, // 200000 personal + 75000 (half of shared)
            notes: Some("Solang Valley instructor fees & itemized gear".to_string()),
            items: Some(sample_items),
            receipt_image: None,
        };
        insert_trip_expense(&conn, &new_exp).unwrap();

        let manali_expenses = fetch_trip_expenses(&conn, Some("trip-manali-2027")).unwrap();
        assert_eq!(manali_expenses.len(), 1);
        assert_eq!(manali_expenses[0].amount_paise, 350000);
        assert_eq!(manali_expenses[0].my_share_paise, 275000);
        assert_eq!(manali_expenses[0].split_type, "itemized");
        assert!(manali_expenses[0].items.is_some());
        assert_eq!(manali_expenses[0].items.as_ref().unwrap().len(), 2);
        assert_eq!(manali_expenses[0].items.as_ref().unwrap()[0].name, "Full-day Ski Gear Rental (Me)");

        // 5. Delete Trip Expense
        let deleted = remove_trip_expense(&conn, "texp-manali-1").unwrap();
        assert!(deleted);
        let remaining = fetch_trip_expenses(&conn, Some("trip-manali-2027")).unwrap();
        assert_eq!(remaining.len(), 0);

        // 6. Delete Trip
        let trip_deleted = remove_trip(&conn, "trip-manali-2027").unwrap();
        assert!(trip_deleted);
        let trips_after = fetch_trips(&conn).unwrap();
        assert_eq!(trips_after.len(), 1);
    }
}

