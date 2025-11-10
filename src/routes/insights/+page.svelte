<script lang="ts">
  import { budgetStore } from "$lib/stores/budget";
  import { dateRangeStore } from "$lib/stores/dateRange";
  import { filterTransactionsByDateRange } from "$lib/utils/format";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import SpendingByCategory from "$lib/components/insights/SpendingByCategory.svelte";
  import SpendingTrend from "$lib/components/insights/SpendingTrend.svelte";
  import BudgetProgress from "$lib/components/insights/BudgetProgress.svelte";
  import TopCategories from "$lib/components/insights/TopCategories.svelte";
  import { TrendingUp, PieChart, Target, BarChart3 } from "lucide-svelte";

  const state = $derived($budgetStore);
  const dateRange = $derived($dateRangeStore);

  const activeBudget = $derived(
    state.budgets.find((b) => b.id === state.activeBudgetId)
  );

  // Filter transactions based on date range
  const filteredEntries = $derived(
    activeBudget
      ? filterTransactionsByDateRange(
          activeBudget.entries,
          dateRange.startDate,
          dateRange.endDate
        )
      : []
  );

  // Separate expenses and income
  const expenses = $derived(
    filteredEntries.filter((e) => e.type === "expense")
  );

  const incomes = $derived(filteredEntries.filter((e) => e.type === "income"));

  const totalExpenses = $derived(
    expenses.reduce((sum, e) => sum + e.amount, 0)
  );

  const totalIncome = $derived(incomes.reduce((sum, e) => sum + e.amount, 0));

  const netAmount = $derived(totalIncome - totalExpenses);

  // Create filtered budget for child components (with expenses only for charts)
  const filteredBudget = $derived(
    activeBudget
      ? {
          ...activeBudget,
          entries: expenses,
        }
      : undefined
  );

  const hasData = $derived(filteredEntries.length > 0);
</script>

<div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
  <div class="flex flex-col gap-2">
    <h1 class="text-3xl font-bold tracking-tight">Insights</h1>
    <p class="text-muted-foreground">
      Analyze your spending patterns and track your budget progress
    </p>
  </div>

  {#if !activeBudget}
    <Card>
      <CardContent class="pt-6">
        <div
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <PieChart class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No Active Budget</h3>
          <p class="text-muted-foreground max-w-sm">
            Create a budget to start tracking your transactions and see
            insights.
          </p>
        </div>
      </CardContent>
    </Card>
  {:else if !hasData}
    <Card>
      <CardContent class="pt-6">
        <div
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <BarChart3 class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No Transactions Yet</h3>
          <p class="text-muted-foreground max-w-sm">
            Add some transactions to see your spending insights and analytics.
          </p>
        </div>
      </CardContent>
    </Card>
  {:else}
    <!-- Overview Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {activeBudget.currency}
            {totalExpenses.toFixed(2)}
          </div>
          <p class="text-xs text-muted-foreground">
            Across {expenses.length} expense transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {activeBudget.currency}
            {totalIncome.toFixed(2)}
          </div>
          <p class="text-xs text-muted-foreground">
            Across {incomes.length} income transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Net</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            class="text-2xl font-bold"
            class:text-destructive={netAmount < 0}
          >
            {activeBudget.currency}
            {netAmount.toFixed(2)}
          </div>
          <p class="text-xs text-muted-foreground">Income - Expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Active Categories</CardTitle>
          <PieChart class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {new Set(filteredEntries.map((e) => e.categoryId)).size}
          </div>
          <p class="text-xs text-muted-foreground">
            Out of {activeBudget.categories.length} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Budget Usage</CardTitle>
          <Target class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {(() => {
              const totalBudget = Object.values(
                activeBudget.budgetLimits
              ).reduce((sum, limit) => sum + limit, 0);
              const totalSpent = filteredEntries.reduce(
                (sum, e) => sum + e.amount,
                0
              );
              return totalBudget > 0
                ? Math.round((totalSpent / totalBudget) * 100)
                : 0;
            })()}%
          </div>
          <p class="text-xs text-muted-foreground">Of total budget</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Avg. Transaction</CardTitle>
          <BarChart3 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {activeBudget.currency}
            {expenses.length > 0
              ? (totalExpenses / expenses.length).toFixed(2)
              : "0.00"}
          </div>
          <p class="text-xs text-muted-foreground">Per expense</p>
        </CardContent>
      </Card>
    </div>

    <!-- Charts Grid -->
    <div class="grid gap-4 md:grid-cols-2">
      {#if filteredBudget}
        <SpendingByCategory budget={filteredBudget} />
        <BudgetProgress budget={filteredBudget} />
      {/if}
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      {#if filteredBudget}
        <div class="md:col-span-2">
          <SpendingTrend budget={filteredBudget} />
        </div>
        <div class="md:col-span-1">
          <TopCategories budget={filteredBudget} />
        </div>
      {/if}
    </div>
  {/if}
</div>
