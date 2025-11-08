<script lang="ts">
  console.log("🚀🚀🚀 INSIGHTS PAGE LOADED - NEW VERSION! 🚀🚀🚀");

  import { budgetStore } from "$lib/stores/budget";
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
  const activeBudget = $derived(
    state.budgets.find((b) => b.id === state.activeBudgetId)
  );

  const hasData = $derived(activeBudget && activeBudget.entries.length > 0);

  // Debug
  $effect(() => {
    console.log("Active Budget:", activeBudget);
    console.log("Has Data:", hasData);
    console.log("Entries:", activeBudget?.entries.length);
  });
</script>

<div class="container mx-auto p-6 space-y-6">
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
            Create a budget to start tracking your expenses and see insights.
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
          <h3 class="text-lg font-semibold mb-2">No Expenses Yet</h3>
          <p class="text-muted-foreground max-w-sm">
            Add some expenses to see your spending insights and analytics.
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
          <CardTitle class="text-sm font-medium">Total Spending</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {activeBudget.currency}
            {activeBudget.entries
              .reduce((sum, e) => sum + e.amount, 0)
              .toFixed(2)}
          </div>
          <p class="text-xs text-muted-foreground">
            Across {activeBudget.entries.length} transactions
          </p>
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
            {new Set(activeBudget.entries.map((e) => e.categoryId)).size}
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
              const totalSpent = activeBudget.entries.reduce(
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
            {(
              activeBudget.entries.reduce((sum, e) => sum + e.amount, 0) /
              activeBudget.entries.length
            ).toFixed(2)}
          </div>
          <p class="text-xs text-muted-foreground">Per expense</p>
        </CardContent>
      </Card>
    </div>

    <!-- Charts Grid -->
    <div class="grid gap-4 md:grid-cols-2">
      <SpendingByCategory budget={activeBudget} />
      <BudgetProgress budget={activeBudget} />
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="md:col-span-2">
        <SpendingTrend budget={activeBudget} />
      </div>
      <div class="md:col-span-1">
        <TopCategories budget={activeBudget} />
      </div>
    </div>
  {/if}
</div>
