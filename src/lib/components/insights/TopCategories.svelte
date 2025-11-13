<script lang="ts">
  import type { Budget } from "$lib/types";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";

  type Props = {
    budget: Budget;
  };

  let { budget }: Props = $props();

  const topCategories = $derived(() => {
    const categoryTotals = new Map<string, number>();

    // Only count expense transactions
    budget.entries.forEach((transaction) => {
      if (transaction.type === "expense") {
        const current = categoryTotals.get(transaction.categoryId) || 0;
        categoryTotals.set(
          transaction.categoryId,
          current + transaction.amount
        );
      }
    });

    const total = Array.from(categoryTotals.values()).reduce(
      (sum, val) => sum + val,
      0
    );

    return Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const category = budget.categories.find((c) => c.id === categoryId);
        const percentage = total > 0 ? (amount / total) * 100 : 0;

        return {
          ...category!,
          amount,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });
</script>

<Card>
  <CardHeader>
    <CardTitle>Top Expense Categories</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#if topCategories().length > 0}
        {#each topCategories() as category, index (category.id)}
          <div class="flex items-center gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style="background-color: {category.color}20; color: {category.color}"
            >
              {index + 1}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm truncate">{category.name}</span
                >
                <span class="text-sm font-semibold">
                  {budget.currency}
                  {category.amount.toFixed(2)}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    style="width: {category.percentage}%; background-color: {category.color}"
                  ></div>
                </div>
                <span class="text-xs text-muted-foreground w-12 text-right">
                  {category.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div
          class="flex items-center justify-center py-8 text-muted-foreground text-sm"
        >
          No expenses yet
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
