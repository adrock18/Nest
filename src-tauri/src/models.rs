use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String, // "bank", "credit", "cash"
    pub starting_balance_paise: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub id: String,
    pub date: String, // Strict YYYY-MM-DD
    #[serde(rename = "type")]
    pub flow_type: String, // "income" or "expense"
    pub account_id: String,
    pub category: String,
    pub notes: String,
    pub tags: Vec<String>,
    pub is_recurring: bool,
    pub amount_paise: i64, // Exact positive integer paise
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub color: String,
    pub is_income: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryBudget {
    pub category: String,
    pub limit_paise: i64,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlySummary {
    pub total_inflow_paise: i64,
    pub total_outflow_paise: i64,
    pub net_savings_paise: i64,
    pub savings_rate_percentage: f64,
    pub recurring_commitment_paise: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trip {
    pub id: String,
    pub name: String,
    pub destination: String,
    pub start_date: String,
    pub end_date: String,
    pub budget_paise: i64,
    pub members: Vec<String>,
    pub cover_color: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseItem {
    pub id: String,
    pub name: String,
    pub quantity: i32,
    pub price_paise: i64,
    pub total_paise: i64,
    pub is_mine: bool,
    pub is_shared: bool,
    #[serde(default)]
    pub shared_with: Option<Vec<String>>,
    #[serde(default)]
    pub my_consumed_quantity: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripExpense {
    pub id: String,
    pub trip_id: String,
    pub date: String,
    pub title: String,
    pub category: String,
    pub amount_paise: i64,
    pub paid_by: String,
    pub split_type: String,
    pub split_members: Vec<String>,
    pub my_share_paise: i64,
    pub notes: Option<String>,
    #[serde(default)]
    pub items: Option<Vec<ExpenseItem>>,
    #[serde(default)]
    pub receipt_image: Option<String>,
}
