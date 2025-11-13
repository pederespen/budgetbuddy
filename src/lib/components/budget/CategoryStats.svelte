<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { formatCurrency } from "$lib/utils/format";
  import * as LucideIcons from "lucide-svelte";
  import type { Budget, Transaction } from "$lib/types";

  type IconComponent = (typeof LucideIcons)[keyof typeof LucideIcons];

  let {
    budget,
    filteredTransactions,
    onViewInsights,
  }: {
    budget: Budget;
    filteredTransactions?: Transaction[];
    onViewInsights: () => void;
  } = $props();

  // Use filtered transactions if provided, otherwise use all entries
  // Filter to only show expense transactions (not income)
  let transactions = $derived(
    (filteredTransactions ?? budget.entries).filter((t) => t.type === "expense")
  );

  // Filter to only expense categories
  let expenseCategories = $derived(budget.categories.filter((c) => c.type === "expense"));

  // Calculate spending per category (expenses only)
  let categoryStats = $derived(
    expenseCategories
      .map((category) => {
        const categoryTransactions = transactions.filter((t) => t.categoryId === category.id);
        const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const percentOfTotal = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;

        return {
          category,
          spent,
          percentOfTotal,
          transactionCount: categoryTransactions.length,
        };
      })
      .filter((stat) => stat.spent > 0) // Only show categories with spending
      .sort((a, b) => b.spent - a.spent) // Sort by spending, highest first
      .slice(0, 5) // Show only top 5 categories
  );

  // Count total expense categories with spending
  let totalCategoriesWithSpending = $derived(
    expenseCategories.filter((category) => {
      const spent = transactions
        .filter((e) => e.categoryId === category.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return spent > 0;
    }).length
  );
</script>

<Card>
  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle class="text-base font-semibold">Top Categories</CardTitle>
    <!-- Empty space to match RecentActivity button - sm button is h-8 -->
    <div class="h-8"></div>
  </CardHeader>
  <CardContent class="pb-3">
    {#if categoryStats.length === 0}
      <div class="text-center py-6 text-muted-foreground text-sm">
        <p>No spending recorded yet</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each categoryStats as { category, spent, percentOfTotal, transactionCount } (category.id)}
          {@const Icon = (LucideIcons as Record<string, IconComponent>)[category.icon]}
          <div class="flex items-center justify-between py-1.5 border-b last:border-0">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style="background-color: {category.color}20;"
              >
                {#if Icon}
                  <Icon class="w-4 h-4" style="color: {category.color}" />
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{category.name}</div>
                <div class="text-sm text-muted-foreground">
                  {transactionCount}
                  {transactionCount === 1 ? "transaction" : "transactions"}
                  • {percentOfTotal.toFixed(0)}% of total
                </div>
              </div>
            </div>
            <div class="font-semibold text-sm flex-shrink-0 ml-2">
              {formatCurrency(spent, budget.currency)}
            </div>
          </div>
        {/each}
      </div>
      {#if totalCategoriesWithSpending > 5}
        <div class="text-center mt-3">
          <Button variant="ghost" size="sm" class="text-xs h-7" onclick={onViewInsights}>
            View more insights
          </Button>
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
