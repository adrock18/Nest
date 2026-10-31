use std::sync::Mutex;
use std::path::PathBuf;
use rusqlite::Connection;
use tauri::State;
use crate::models::{Account, CategoryBudget, MonthlySummary, Transaction, Trip, TripExpense};
use crate::db;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[tauri::command]
pub fn get_database_path() -> String {
    db::get_db_path().to_string_lossy().to_string()
}

#[tauri::command]
pub fn get_accounts(state: State<'_, AppState>) -> Result<Vec<Account>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::fetch_accounts(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transactions(
    state: State<'_, AppState>,
    month_prefix: Option<String>,
) -> Result<Vec<Transaction>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::fetch_transactions(&conn, month_prefix.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_transaction(
    state: State<'_, AppState>,
    transaction: Transaction,
) -> Result<Transaction, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::insert_transaction(&conn, &transaction).map_err(|e| e.to_string())?;
    Ok(transaction)
}

#[tauri::command]
pub fn delete_transaction(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::remove_transaction(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_budgets(state: State<'_, AppState>) -> Result<Vec<CategoryBudget>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::fetch_budgets(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_budget(
    state: State<'_, AppState>,
    budget: CategoryBudget,
) -> Result<CategoryBudget, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::save_budget_limit(&conn, &budget).map_err(|e| e.to_string())?;
    Ok(budget)
}

#[tauri::command]
pub fn get_monthly_summary(
    state: State<'_, AppState>,
    month_prefix: String,
) -> Result<MonthlySummary, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::calculate_monthly_summary(&conn, &month_prefix).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn backup_database(
    state: State<'_, AppState>,
    target_path: String,
) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let target = PathBuf::from(&target_path);
    db::vacuum_into_backup(&conn, &target).map_err(|e| e.to_string())?;
    Ok(target_path)
}

// Travel & Trip Expenses Commands
#[tauri::command]
pub fn get_trips(state: State<'_, AppState>) -> Result<Vec<Trip>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::fetch_trips(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_trip(
    state: State<'_, AppState>,
    trip: Trip,
) -> Result<Trip, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::insert_trip(&conn, &trip).map_err(|e| e.to_string())?;
    Ok(trip)
}

#[tauri::command]
pub fn delete_trip(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::remove_trip(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_trip_expenses(
    state: State<'_, AppState>,
    trip_id: Option<String>,
) -> Result<Vec<TripExpense>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::fetch_trip_expenses(&conn, trip_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_trip_expense(
    state: State<'_, AppState>,
    expense: TripExpense,
) -> Result<TripExpense, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::insert_trip_expense(&conn, &expense).map_err(|e| e.to_string())?;
    Ok(expense)
}

#[tauri::command]
pub fn delete_trip_expense(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::remove_trip_expense(&conn, &id).map_err(|e| e.to_string())
}
