pub mod models;
pub mod db;
pub mod commands;

use std::sync::Mutex;
use rusqlite::Connection;
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = db::get_db_path();
    let mut conn = Connection::open(&db_path).expect("Failed to open SQLite database");
    db::init_database(&mut conn).expect("Failed to initialize database schema");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Mutex::new(conn),
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_database_path,
            commands::get_accounts,
            commands::get_transactions,
            commands::create_transaction,
            commands::delete_transaction,
            commands::get_budgets,
            commands::set_budget,
            commands::get_monthly_summary,
            commands::backup_database,
            commands::get_trips,
            commands::create_trip,
            commands::delete_trip,
            commands::get_trip_expenses,
            commands::create_trip_expense,
            commands::delete_trip_expense
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
