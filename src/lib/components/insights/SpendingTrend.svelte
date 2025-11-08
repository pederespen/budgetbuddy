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

  let hoveredIndex = $state<number | null>(null);

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

  // Round to nice numbers for Y-axis with better spacing
  function roundToNice(value: number): number {
    if (value === 0) return 0;

    // Add just a small padding (5%) to the max value
    const paddedValue = value * 1.05;

    // Find the appropriate step size
    const magnitude = Math.pow(10, Math.floor(Math.log10(paddedValue)));

    // Try different nice intervals: 1000, 2000, 2500, 5000
    const steps = [1, 2, 2.5, 5, 10];

    for (const step of steps) {
      const stepValue = step * magnitude;
      const rounded = Math.ceil(paddedValue / stepValue) * stepValue;
      // Use this if it's not too much overhead (less than 20% extra space)
      if (rounded <= value * 1.2) {
        return rounded;
      }
    }

    // Fallback
    return Math.ceil(paddedValue / (magnitude * 10)) * (magnitude * 10);
  }

  const maxValueRounded = $derived(roundToNice(maxValue));

  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  // Create smooth curve path using cubic bezier curves
  function createSmoothPath(
    data: Array<{ date: Date; amount: number; cumulative: number }>,
    width: number,
    height: number,
    maxValue: number
  ) {
    if (data.length === 0) return "";

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - (d.cumulative / maxValue) * height,
    }));

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlPointX = current.x + (next.x - current.x) / 2;

      path += ` C ${controlPointX} ${current.y}, ${controlPointX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
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
              <div>
                {budget.currency}
                {Math.round(maxValueRounded * (1 - tick)).toLocaleString()}
              </div>
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
              {#if chartData().length > 0}
                {@const svgWidth = 1000}
                {@const svgHeight = 300}
                {@const smoothPath = createSmoothPath(
                  chartData(),
                  svgWidth,
                  svgHeight,
                  maxValueRounded
                )}
                {@const columnWidth = svgWidth / chartData().length}

                <svg
                  viewBox="0 0 {svgWidth} {svgHeight}"
                  class="absolute inset-0 w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
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
                        style="stop-color: #10b981; stop-opacity: 0.4"
                      />
                      <stop
                        offset="100%"
                        style="stop-color: #10b981; stop-opacity: 0.05"
                      />
                    </linearGradient>
                  </defs>

                  <!-- Area fill -->
                  <path
                    d="{smoothPath} L {svgWidth} {svgHeight} L 0 {svgHeight} Z"
                    fill="url(#areaGradient)"
                    class="transition-all"
                  />

                  <!-- Smooth line -->
                  <path
                    d={smoothPath}
                    fill="none"
                    stroke="#10b981"
                    stroke-width="3"
                    class="transition-all"
                  />

                  <!-- Invisible hover columns for data points -->
                  {#each chartData() as point, i}
                    {@const x = (i / (chartData().length - 1)) * svgWidth}
                    {@const columnX = i * columnWidth}

                    <!-- Hover column -->
                    <rect
                      x={columnX}
                      y="0"
                      width={columnWidth}
                      height={svgHeight}
                      fill="transparent"
                      class="cursor-pointer"
                      role="button"
                      tabindex="0"
                      onmouseenter={() => (hoveredIndex = i)}
                      onmouseleave={() => (hoveredIndex = null)}
                      onclick={() => (hoveredIndex = hoveredIndex === i ? null : i)}
                      onkeydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          hoveredIndex = hoveredIndex === i ? null : i;
                        }
                      }}
                    />
                  {/each}
                </svg>
              {/if}

              <!-- Perfectly round data point overlay -->
              {#if hoveredIndex !== null && chartData()[hoveredIndex]}
                {@const xPercent =
                  (hoveredIndex / (chartData().length - 1)) * 100}
                {@const yPercent =
                  (1 - chartData()[hoveredIndex].cumulative / maxValueRounded) *
                  100}
                <div
                  class="absolute w-2 h-2 rounded-full pointer-events-none transition-all z-10"
                  style="
                    left: {xPercent}%; 
                    top: {yPercent}%; 
                    transform: translate(-50%, -50%);
                    background: black;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  "
                ></div>
              {/if}

              <!-- Tooltip -->
              {#if hoveredIndex !== null && chartData()[hoveredIndex]}
                {@const point = chartData()[hoveredIndex]}
                {@const x = (hoveredIndex / (chartData().length - 1)) * 100}
                {@const y = (1 - point.cumulative / maxValueRounded) * 100}
                <div
                  class="absolute bg-popover text-popover-foreground shadow-md rounded border px-2 py-1 pointer-events-none z-10 text-xs"
                  style="left: {x}%; top: {y}%; transform: translate(-50%, calc(-100% - 12px))"
                >
                  <div
                    class="text-[10px] text-muted-foreground whitespace-nowrap mb-0.5"
                  >
                    {formatDate(point.date)}
                  </div>
                  <div class="font-semibold whitespace-nowrap leading-tight">
                    {budget.currency}
                    {point.cumulative.toFixed(2)}
                  </div>
                  <div
                    class="text-[10px] text-muted-foreground whitespace-nowrap"
                  >
                    +{budget.currency}
                    {point.amount.toFixed(2)}
                  </div>
                </div>
              {/if}
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
