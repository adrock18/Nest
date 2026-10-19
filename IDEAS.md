# Ideas & Feature Backlog: Nest

This document is the **feature freezer and parking lot** for Nest. 
To prevent scope creep, **Version 1 is kept strictly focused on core budgeting and tracking**. 
Once Version 1 is built, tested, and in daily use, we will pull candidate features from this document into subsequent releases.

---

## 1. AI Assistance & Conversational Intelligence (From Project Discovery)

### A. Natural Language Query Engine ("Ask Your Budget")
- **Plain-Language Q&A in Dashboard**: A search/chat bar where you ask questions in natural language:
  - *"How much did we spend on vegetables and groceries last month?"*
  - *"What was our total expenditure on dining out versus cooking at home in September?"*
  - *"Show all subscriptions renewing this week."*
  - *"Who paid the electricity bill last month?"*
- **Text-to-SQL Architecture**: The AI translates your query into a safe, parameterized SQLite read query, executes it locally against your private database, and returns both the exact figure and a breakdown card.
- **Privacy Guarantee**: All queries run locally or with private, zero-data-retention endpoints; your personal transaction numbers are never used to train public models.

### B. Proactive Financial Coach & Predictive Burn Rate
- **Pace & Burn Rate Warnings**: By mid-month, predicts month-end standing: *"You have spent 82% of your dining budget in the first 14 days. If this continues, you will overshoot by ₹3,500 by month-end."*
- **Silent Leak & Anomaly Detection**: Flags unusual spikes or repeated charges (e.g., *"Netflix charged twice this month"* or *"Electricity bill is 40% higher than your 3-month average"*).
- **Weekly Executive Summaries**: Generates a bite-sized 3-bullet recap every Sunday evening summarizing top spending categories and budget health.

---

## 2. Smart Multi-Modal Receipt Scanning & Ingestion

### C. Vision AI Receipt & Invoice Parser
- **Instant Photo Extraction**: Drag-and-drop or snapshot a receipt image/PDF.
- **Field Extraction**:
  - Merchant / Store name
  - Store location / address
  - Date and time
  - Itemized line items (e.g. vegetables, milk, pantry items)
  - Tax / GST breakdown
  - Payment mode (UPI, Credit Card, Debit Card, Cash)
  - Payer attribution (who paid)
- **Review & Confirm UI**: Extracted data is presented in an editable side-by-side draft; nothing commits to your database until you review and confirm.
- **Indian E-Invoice & QR Parsing**: Fast-path instant reading of B2C/B2B QR codes on Indian tax invoices before falling back to optical OCR.

### D. Bank Alert & SMS Parser
- Forward or paste bank debit SMS messages or UPI push notifications.
- Automatically parses amount, merchant name, and date into a draft transaction without creating duplicates.

---

## 3. Geospatial Spending & Mobility Analytics ("The Spending Map")

### E. Interactive Location Intelligence
- **Geocoded Outings**: Tag transactions with merchant location (e.g., "Indiranagar, Bangalore").
- **Spending Heatmap**: Interactive map view showing where your money physically flows.
- **Frequent Outings & Transit Correlation**:
  - Identify your top spending "gravity centers" (cafes, malls, grocery hubs).
  - Correlate fuel / cab costs with specific destinations.

---

## 4. Household & Multi-Member Family Dynamics

### F. Shared Family Hub
- **Payer Attribution**: Tag transactions with who paid (e.g., Self, Partner, Parent) and whom it benefited (Personal, Household, Kids).
- **Split & Shared Expenses**: Track shared grocery and utility bills with automated monthly settlement calculations ("Who owes what").
- **Multi-Account Tracking**: Track individual bank accounts, cash in hand, and joint credit cards under one household umbrella.

---

## 5. Automation & Long-Term Extensions

### G. Recurring Subscriptions & Bill Reminders
- Automatic tracking of monthly fixed commitments (Rent, Wi-Fi, Water, OTT subscriptions).
- Local OS reminders 3 days before recurring bills are due.

### H. Multi-Device & Mobile Client
- Companion mobile capture client (Android/iOS) designed for quick receipt snapshots on the go, with local LAN sync to your desktop database.
