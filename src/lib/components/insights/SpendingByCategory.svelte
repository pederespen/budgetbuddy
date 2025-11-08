<script lang="ts">
  import type { Budget } from "$lib/types";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

  type Props = {
    budget: Budget;
  };

  let { budget }: Props = $props();

  const chartData = $derived(() => {
    const categoryTotals = new Map<string, number>();

    budget.entries.forEach((expense) => {
      const current = categoryTotals.get(expense.categoryId) || 0;
      categoryTotals.set(expense.categoryId, current + expense.amount);
    });

    const total = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);

    return Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const category = budget.categories.find((c) => c.id === categoryId);
        return {
          name: category?.name || "Unknown",
          value: amount,
          color: category?.color || "#94a3b8",
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  });

  const total = $derived(chartData().reduce((sum, d) => sum + d.value, 0));
</script>

<Card>
  <CardHeader>
    <CardTitle>Spending by Category</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#if chartData().length > 0}
        <!-- Donut Chart -->
        <div class="flex items-center justify-center">
          <div class="relative w-64 h-64">
            <svg viewBox="0 0 200 200" class="transform -rotate-90">
              {#each chartData() as category, i}
                {@const startAngle = chartData()
                  .slice(0, i)
                  .reduce((sum, c) => sum + (c.percentage * 3.6), 0)}
                {@const endAngle = startAngle + (category.percentage * 3.6)}
                {@const largeArc = category.percentage > 50 ? 1 : 0}
                {@const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180)}
                {@const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180)}
                {@const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180)}
                {@const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180)}
                {@const x3 = 100 + 50 * Math.cos((Math.PI * endAngle) / 180)}
                {@const y3 = 100 + 50 * Math.sin((Math.PI * endAngle) / 180)}
                {@const x4 = 100 + 50 * Math.cos((Math.PI * startAngle) / 180)}
                {@const y4 = 100 + 50 * Math.sin((Math.PI * startAngle) / 180)}
                
                <path
                  d="M {x1} {y1} A 80 80 0 {largeArc} 1 {x2} {y2} L {x3} {y3} A 50 50 0 {largeArc} 0 {x4} {y4} Z"
                  fill={category.color}
                  class="transition-opacity hover:opacity-80 cursor-pointer"
                  stroke="hsl(var(--background))"
                  stroke-width="2"
                >
                  <title>{category.name}: {budget.currency} {category.value.toFixed(2)} ({category.percentage.toFixed(1)}%)</title>
                </path>
              {/each}
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-2xl font-bold">{budget.currency}</div>
              <div class="text-3xl font-bold">{total.toFixed(0)}</div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="grid grid-cols-2 gap-3">
          {#each chartData() as category}
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-sm flex-shrink-0" style="background-color: {category.color}"></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{category.name}</div>
                <div class="text-xs text-muted-foreground">
                  {category.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="flex items-center justify-center py-12 text-muted-foreground">
          No spending data available
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
