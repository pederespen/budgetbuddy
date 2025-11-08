<script lang="ts">
  import type { Budget } from "$lib/types";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Progress } from "$lib/components/ui/progress";

  type Props = {
    budget: Budget;
  };

  let { budget }: Props = $props();

  const categoryProgress = $derived(() => {
    const categoryTotals = new Map<string, number>();

    budget.entries.forEach((expense) => {
      const current = categoryTotals.get(expense.categoryId) || 0;
      categoryTotals.set(expense.categoryId, current + expense.amount);
    });

    return budget.categories
      .map((category) => {
        const spent = categoryTotals.get(category.id) || 0;
        const limit = budget.budgetLimits[category.id] || 0;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
          ...category,
          spent,
          limit,
          percentage: Math.min(percentage, 100),
          isOverBudget: spent > limit && limit > 0,
        };
      })
      .filter((c) => c.limit > 0 || c.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  });
</script>

<Card>
  <CardHeader>
    <CardTitle>Budget Progress</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#if categoryProgress().length > 0}
        {#each categoryProgress() as category (category.id)}
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  style="background-color: {category.color}"
                ></div>
                <span class="font-medium">{category.name}</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class={category.isOverBudget
                    ? "text-destructive font-semibold"
                    : ""}
                >
                  {budget.currency}
                  {category.spent.toFixed(2)}
                </span>
                {#if category.limit > 0}
                  <span class="text-muted-foreground">
                    / {budget.currency}
                    {category.limit.toFixed(2)}
                  </span>
                {/if}
              </div>
            </div>
            {#if category.limit > 0}
              <div class="relative">
                <Progress
                  value={category.percentage}
                  class="h-2"
                  style="--progress-background: {category.color}"
                />
                {#if category.isOverBudget}
                  <div
                    class="absolute inset-0 flex items-center justify-end pr-1"
                  >
                    <span class="text-xs font-bold text-destructive">
                      {(category.percentage - 100).toFixed(0)}% over
                    </span>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="h-2 bg-muted rounded-full"></div>
            {/if}
          </div>
        {/each}
      {:else}
        <div
          class="flex items-center justify-center py-8 text-muted-foreground text-sm"
        >
          No budget limits set
        </div>
      {/if}
    </div>
  </CardContent>
</Card>

<style>
  :global([data-progress-root]) {
    background-color: hsl(var(--muted));
  }

  :global([data-progress-indicator]) {
    background-color: var(--progress-background, hsl(var(--primary)));
  }
</style>
