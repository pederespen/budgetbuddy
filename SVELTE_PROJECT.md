# BudgetBuddy - Svelte Version

## Project Overview
Privacy-focused personal budget tracker where all data stays local on the user's device.

## Core Features
- **Add/Edit/Delete Expenses** - Track daily spending with date, category, amount, and notes
- **Categories Management** - Customizable expense categories (Food, Transport, Entertainment, etc.)
- **Multi-Currency Support** - NOK, USD, EUR, GBP, SEK, DKK with proper formatting
- **Budget Limits** - Set spending limits per category with progress visualization
- **Data Visualization**
  - Pie chart: spending distribution by category
  - Bar chart: spending by category
  - Line chart: monthly spending trends
  - Progress bars: budget vs actual spending
- **Date Filtering** - View expenses by time period (This Month, Last Month, Custom Range)
- **Data Import/Export**
  - Export to JSON (for backup/restore)
  - Export to CSV (for spreadsheets)
  - Import from JSON
- **Demo Mode** - Load sample data to explore features

## Technical Requirements

### Data Storage
- **Client-side only** - Use browser localStorage or IndexedDB
- **No backend** - Everything runs in the browser
- **Privacy-first** - Data never leaves the user's device

### Data Structure
```javascript
{
  currency: "NOK",
  categories: ["Food & Groceries", "Transportation", ...],
  entries: [
    {
      id: "uuid",
      date: "2025-11-05",
      category: "Food & Groceries",
      amount: 150.50,
      note: "Grocery shopping"
    }
  ],
  budget_limits: {
    "Food & Groceries": 5000,
    "Transportation": 2000
  }
}
```

### UI Components Needed
1. **Welcome Screen** - Upload data, load demo, or create new budget
2. **Main Dashboard** - Overview with quick stats
3. **Expense Form** - Add/edit expenses
4. **Expense List** - Table with filtering and actions
5. **Category Manager** - Add/remove categories
6. **Charts Section** - All visualizations
7. **Budget Settings** - Set limits per category
8. **Export/Download** - Save data as JSON/CSV

### Libraries to Consider
- **SvelteKit** - Framework
- **Chart.js** or **Recharts** - For visualizations
- **date-fns** - Date formatting/manipulation
- **Papa Parse** - CSV export
- **DaisyUI** or **Skeleton UI** - Component library (optional)

## Design Notes
- Clean, modern interface
- Green/blue color scheme (like logo)
- Responsive (mobile-friendly)
- Show logo prominently

## Getting Started
```bash
npm create svelte@latest budgetbuddy-svelte
cd budgetbuddy-svelte
npm install
npm run dev
```

## Deployment
Can be deployed as static site to:
- GitHub Pages
- Netlify
- Vercel
- Any static host
