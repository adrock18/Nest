# Ideas Backlog: Nest

This document captures potential features and ideas outside the committed roadmap.
An idea is moved into `README.md` only when deliberately scheduled for a specific release.

## 1. Financial Capabilities
- **Savings Goals**: Track progress toward targets (emergency fund, travel, electronics) with milestones.
- **Debt Payoff Engine**: Visual loan and credit card repayment strategies (snowball vs. avalanche methods).
- **Net Worth Tracking**: Assets minus liabilities over time with historical progression.
- **Cash Flow Analytics**: Detailed month-over-month inflow vs. outflow forecasting.
- **Multi-Currency Support**: Exchange rates pinned per transaction for international travel.

## 2. Ingestion & Input Workflows
- **Receipt Attachments**: Link original image/PDF receipts to transactions with atomic backup preservation.
- **Indian E-Invoice QR Reader**: Instant local parsing of standard B2C/B2B QR codes before falling back to OCR.
- **Receipt OCR Drafts**: Local OCR that extracts merchant, date, items, and total into a draft requiring human confirmation.
- **Bank SMS Parser**: Paste or forward bank transaction alerts; match to existing transactions or generate drafts without duplicates.
- **Merchant & Price History**: Track where specific goods were bought and historical item price inflation.

## 3. Automation & Reminders
- **Recurring Transactions**: Scheduled template generator for monthly rent, utility bills, and salaries.
- **Subscription Tracker**: Monitor recurring SaaS and service renewals with price change alerts.
- **Local Desktop Reminders**: Native OS notifications for upcoming payment due dates.

## 4. Local AI (On-Device LLM / SLM)
- **Natural Language Query**: "How much did I spend on dining out between October and December?"
- **Scenario Modeling**: "If I reduce discretionary food spending by 25%, what will my year-end savings be?"
- **Automated Monthly Executive Summary**: Plain-language narrative generated from committed monthly SQLite metrics.

## 5. UI, Visualization & Platform
- **Visual Spend Map**: Optional geotagging per transaction with local offline map rendering.
- **Advanced Themes**: Dark mode, high contrast, and custom financial dashboards.
- **LAN / Local Network Companion**: Secure local network pairing to view read-only dashboards from a tablet on the same Wi-Fi.
- **Mobile Companion App**: Standalone or synced mobile capture client (to be designed post-1.4.0).
