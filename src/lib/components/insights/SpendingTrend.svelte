<script lang="ts">
  import type { Budget } from "$lib/types";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";

  type Props = {
    budget: Budget;
  };

  let { budget }: Props = $props();

  let hoveredIndex = $state<number | null>(null);
  let viewMode = $state<"daily" | "cumulative">("daily");

  // Generate a unique ID for this instance
  const uniqueId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  const chartData = $derived(() => {
    // Group expense transactions by day (filter out income)
    const dailyTotals: Record<string, number> = {};

    budget.entries.forEach((transaction) => {
      if (transaction.type === "expense") {
        const date = transaction.date.split("T")[0]; // Get just the date part
        dailyTotals[date] = (dailyTotals[date] || 0) + transaction.amount;
      }
    });

    // Convert to array and sort by date
    const data = Object.entries(dailyTotals)
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

  // Use daily amounts or cumulative based on view mode
  const maxValue = $derived(
    viewMode === "daily"
      ? Math.max(...chartData().map((d) => d.amount), 100)
      : Math.max(...chartData().map((d) => d.cumulative), 100)
  );

  // Round to nice numbers for Y-axis with better spacing
  function roundToNice(value: number): number {
    if (value === 0) return 0;

    // Add 10% padding to the max value
    const paddedValue = value * 1.1;

    // Find the order of magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(paddedValue)));

    // Try nice step sizes relative to magnitude
    const steps = [1, 2, 2.5, 5];

    for (const step of steps) {
      const stepValue = step * magnitude;
      const rounded = Math.ceil(paddedValue / stepValue) * stepValue;
      return rounded; // Return the first one that works
    }

    // Fallback (shouldn't reach here)
    return Math.ceil(paddedValue);
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
      y: height - ((viewMode === "daily" ? d.amount : d.cumulative) / maxValue) * height,
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
  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
    <CardTitle>Spending Trend</CardTitle>
    <div class="flex gap-1">
      <Button
        variant={viewMode === "daily" ? "default" : "outline"}
        size="sm"
        class="h-7 text-xs"
        onclick={() => (viewMode = "daily")}
      >
        Daily
      </Button>
      <Button
        variant={viewMode === "cumulative" ? "default" : "outline"}
        size="sm"
        class="h-7 text-xs"
        onclick={() => (viewMode = "cumulative")}
      >
        Cumulative
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    <div class="h-[300px]">
      {#if chartData().length > 0}
        <div class="relative h-full w-full pt-4 pb-8 px-2">
          <!-- Y-axis labels -->
          <div
            class="absolute left-0 top-4 bottom-8 flex flex-col justify-between text-xs text-muted-foreground"
          >
            {#each [0, 0.25, 0.5, 0.75, 1] as tick (tick)}
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
              {#each [0, 0.25, 0.5, 0.75, 1] as tick (tick)}
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
                  vector-effect="non-scaling-stroke"
                >
                  <defs>
                    <linearGradient id={uniqueId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color: #10b981; stop-opacity: 0.4" />
                      <stop offset="100%" style="stop-color: #10b981; stop-opacity: 0.05" />
                    </linearGradient>
                  </defs>

                  <!-- Area fill -->
                  <path
                    d="{smoothPath} L {svgWidth} {svgHeight} L 0 {svgHeight} Z"
                    fill="url(#{uniqueId})"
                    class="transition-all"
                  />

                  <!-- Smooth line -->
                  <path
                    d={smoothPath}
                    fill="none"
                    stroke="#10b981"
                    stroke-width="3"
                    vector-effect="non-scaling-stroke"
                    class="transition-all"
                  />

                  <!-- Invisible hover columns for data points -->
                  {#each chartData() as point, i (point.date.getTime())}
                    {@const columnX = i * columnWidth}

                    <!-- Hover column -->
                    <rect
                      x={columnX}
                      y="0"
                      width={columnWidth}
                      height={svgHeight}
                      fill="transparent"
                      class="cursor-pointer outline-none"
                      role="button"
                      tabindex="0"
                      aria-label="View data for {formatDate(point.date)}"
                      onmouseenter={() => (hoveredIndex = i)}
                      onmouseleave={() => (hoveredIndex = null)}
                      onclick={() => (hoveredIndex = hoveredIndex === i ? null : i)}
                      onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
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
                {@const xPercent = (hoveredIndex / (chartData().length - 1)) * 100}
                {@const value =
                  viewMode === "daily"
                    ? chartData()[hoveredIndex].amount
                    : chartData()[hoveredIndex].cumulative}
                {@const yPercent = (1 - value / maxValueRounded) * 100}
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
                {@const value = viewMode === "daily" ? point.amount : point.cumulative}
                {@const y = (1 - value / maxValueRounded) * 100}
                <div
                  class="absolute bg-popover text-popover-foreground shadow-md rounded border px-2 py-1 pointer-events-none z-10 text-xs"
                  style="left: {x}%; top: {y}%; transform: translate(-50%, calc(-100% - 12px))"
                >
                  <div class="text-[10px] text-muted-foreground whitespace-nowrap mb-0.5">
                    {formatDate(point.date)}
                  </div>
                  <div class="font-semibold whitespace-nowrap leading-tight">
                    {budget.currency}
                    {value.toFixed(2)}
                  </div>
                  <div class="text-[10px] text-muted-foreground whitespace-nowrap">
                    {viewMode === "daily" ? "Daily spending" : "Total so far"}
                  </div>
                </div>
              {/if}
            </div>

            <!-- X-axis labels -->
            <div class="flex justify-between mt-2 text-xs text-muted-foreground">
              {#if chartData().length > 0}
                <span>{formatDate(chartData()[0].date)}</span>
                {#if chartData().length > 1}
                  <span>{formatDate(chartData()[chartData().length - 1].date)}</span>
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-full text-muted-foreground">
          No spending data available
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
