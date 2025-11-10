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

  // Note: budget.entries should already be filtered to expenses only by parent component
  const chartData = $derived(() => {
    const categoryTotals = new Map<string, number>();

    // Only process expense transactions
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

  let hoveredCategory = $state<string | null>(null);
</script>

<Card>
  <CardHeader>
    <CardTitle>Expenses by Category</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#if chartData().length > 0}
        <!-- Donut Chart -->
        <div class="flex items-center justify-center relative">
          <div class="relative w-full max-w-[280px] aspect-square">
            <svg viewBox="0 0 200 200" class="transform -rotate-90">
              {#each chartData() as category, i}
                {@const startAngle = chartData()
                  .slice(0, i)
                  .reduce((sum, c) => sum + c.percentage * 3.6, 0)}
                {@const endAngle = startAngle + category.percentage * 3.6}
                {@const midAngle = (startAngle + endAngle) / 2}
                {@const largeArc = category.percentage > 50 ? 1 : 0}
                {@const isHovered = hoveredCategory === category.name}
                {@const offset = isHovered ? 5 : 0}
                {@const centerOffsetX =
                  offset * Math.cos((Math.PI * midAngle) / 180)}
                {@const centerOffsetY =
                  offset * Math.sin((Math.PI * midAngle) / 180)}
                {@const x1 =
                  100 +
                  centerOffsetX +
                  80 * Math.cos((Math.PI * startAngle) / 180)}
                {@const y1 =
                  100 +
                  centerOffsetY +
                  80 * Math.sin((Math.PI * startAngle) / 180)}
                {@const x2 =
                  100 +
                  centerOffsetX +
                  80 * Math.cos((Math.PI * endAngle) / 180)}
                {@const y2 =
                  100 +
                  centerOffsetY +
                  80 * Math.sin((Math.PI * endAngle) / 180)}
                {@const x3 =
                  100 +
                  centerOffsetX +
                  50 * Math.cos((Math.PI * endAngle) / 180)}
                {@const y3 =
                  100 +
                  centerOffsetY +
                  50 * Math.sin((Math.PI * endAngle) / 180)}
                {@const x4 =
                  100 +
                  centerOffsetX +
                  50 * Math.cos((Math.PI * startAngle) / 180)}
                {@const y4 =
                  100 +
                  centerOffsetY +
                  50 * Math.sin((Math.PI * startAngle) / 180)}

                <path
                  d="M {x1} {y1} A 80 80 0 {largeArc} 1 {x2} {y2} L {x3} {y3} A 50 50 0 {largeArc} 0 {x4} {y4} Z"
                  fill={category.color}
                  class="transition-all duration-200 cursor-pointer"
                  class:opacity-40={hoveredCategory &&
                    hoveredCategory !== category.name}
                  stroke="hsl(var(--background))"
                  stroke-width="2"
                  onmouseenter={() => (hoveredCategory = category.name)}
                  onmouseleave={() => (hoveredCategory = null)}
                  onclick={() =>
                    (hoveredCategory =
                      hoveredCategory === category.name ? null : category.name)}
                />
              {/each}
            </svg>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              {#if hoveredCategory}
                {@const hovered = chartData().find(
                  (c) => c.name === hoveredCategory
                )}
                {#if hovered}
                  <div class="text-center">
                    <div
                      class="text-sm font-medium text-muted-foreground truncate max-w-[120px]"
                    >
                      {hovered.name}
                    </div>
                    <div class="text-2xl font-bold">
                      {budget.currency}
                      {hovered.value.toFixed(0)}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {hovered.percentage.toFixed(1)}%
                    </div>
                  </div>
                {/if}
              {:else}
                <div class="text-center">
                  <div class="text-sm font-medium text-muted-foreground">
                    Total
                  </div>
                  <div class="text-2xl font-bold">{budget.currency}</div>
                  <div class="text-3xl font-bold">{total.toFixed(0)}</div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div
          class="flex items-center justify-center py-12 text-muted-foreground"
        >
          No spending data available
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
