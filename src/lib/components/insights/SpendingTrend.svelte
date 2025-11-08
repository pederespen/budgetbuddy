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

  const chartData = $derived(() => {
    // Group expenses by day
    const dailyTotals = new Map<string, number>();

    budget.entries.forEach((expense) => {
      const date = expense.date.split("T")[0]; // Get just the date part
      const current = dailyTotals.get(date) || 0;
      dailyTotals.set(date, current + expense.amount);
    });

    // Convert to array and sort by date
    const data = Array.from(dailyTotals.entries())
      .map(([date, amount]) => ({
        date: new Date(date),
        amount,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate cumulative totals
    let cumulative = 0;
    return data.map((d) => {
      cumulative += d.amount;
      return {
        date: d.date,
        amount: d.amount,
        cumulative,
      };
    });
  });

  const maxValue = $derived(
    Math.max(...chartData().map((d) => d.cumulative), 100)
  );

  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Spending Trend</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="h-[300px]">
      {#if chartData().length > 0}
        <div class="relative h-full w-full pt-4 pb-8 px-2">
          <!-- Y-axis labels -->
          <div
            class="absolute left-0 top-4 bottom-8 flex flex-col justify-between text-xs text-muted-foreground"
          >
            {#each [0, 0.25, 0.5, 0.75, 1] as tick}
              <div>{budget.currency} {(maxValue * (1 - tick)).toFixed(0)}</div>
            {/each}
          </div>

          <!-- Chart area -->
          <div class="ml-16 h-full flex flex-col">
            <!-- Grid and area chart -->
            <div class="flex-1 relative border-l border-b border-border">
              <!-- Grid lines -->
              {#each [0, 0.25, 0.5, 0.75, 1] as tick}
                <div
                  class="absolute left-0 right-0 border-t border-border/50"
                  style="top: {tick * 100}%"
                ></div>
              {/each}

              <!-- Area chart -->
              <svg class="absolute inset-0 w-full h-full overflow-visible">
                <defs>
                  <linearGradient
                    id="areaGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style="stop-color:hsl(var(--primary));stop-opacity:0.4"
                    />
                    <stop
                      offset="100%"
                      style="stop-color:hsl(var(--primary));stop-opacity:0.05"
                    />
                  </linearGradient>
                </defs>

                {#if chartData().length > 1}
                  {@const points = chartData()
                    .map((d, i) => {
                      const x = (i / (chartData().length - 1)) * 100;
                      const y = (1 - d.cumulative / maxValue) * 100;
                      return `${x},${y}`;
                    })
                    .join(" ")}

                  <!-- Area fill -->
                  <polygon
                    points="0,100 {points} 100,100"
                    fill="url(#areaGradient)"
                    class="transition-all"
                  />

                  <!-- Line -->
                  <polyline
                    {points}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    stroke-width="2"
                    class="transition-all"
                  />

                  <!-- Data points -->
                  {#each chartData() as point, i}
                    {@const x = (i / (chartData().length - 1)) * 100}
                    {@const y = (1 - point.cumulative / maxValue) * 100}
                    <circle
                      cx="{x}%"
                      cy="{y}%"
                      r="4"
                      fill="hsl(var(--background))"
                      stroke="hsl(var(--primary))"
                      stroke-width="2"
                      class="transition-all hover:r-6 cursor-pointer"
                    >
                      <title
                        >{formatDate(point.date)}: {budget.currency}
                        {point.cumulative.toFixed(2)}</title
                      >
                    </circle>
                  {/each}
                {/if}
              </svg>
            </div>

            <!-- X-axis labels -->
            <div
              class="flex justify-between mt-2 text-xs text-muted-foreground"
            >
              {#if chartData().length > 0}
                <span>{formatDate(chartData()[0].date)}</span>
                {#if chartData().length > 1}
                  <span
                    >{formatDate(
                      chartData()[chartData().length - 1].date
                    )}</span
                  >
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div
          class="flex items-center justify-center h-full text-muted-foreground"
        >
          No spending data available
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
