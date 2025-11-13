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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let activeDay = $state<number | null>(null);

  const dayData = $derived(() => {
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);

    // Only count expense transactions
    budget.entries.forEach((transaction) => {
      if (transaction.type === "expense") {
        const date = new Date(transaction.date);
        const dayOfWeek = date.getDay();
        dayTotals[dayOfWeek] += transaction.amount;
        dayCounts[dayOfWeek]++;
      }
    });

    const maxAmount = Math.max(...dayTotals, 1);

    return dayNames.map((name, index) => ({
      day: name,
      total: dayTotals[index],
      count: dayCounts[index],
      // Ensure minimum height of 8% for bars with data
      percentage:
        dayTotals[index] > 0
          ? Math.max((dayTotals[index] / maxAmount) * 100, 8)
          : 0,
    }));
  });

  function handleBarClick(index: number) {
    activeDay = activeDay === index ? null : index;
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Expenses by Day of Week</CardTitle>
  </CardHeader>
  <CardContent class="overflow-visible">
    <div class="h-[240px]">
      {#if dayData().some((d) => d.total > 0)}
        <div class="flex items-end justify-between h-full gap-2 pb-6">
          {#each dayData() as day, index (day.day)}
            <div class="flex-1 flex flex-col items-center gap-2 h-full">
              <!-- Bar container -->
              <div class="flex-1 w-full flex flex-col justify-end relative">
                <button
                  type="button"
                  class="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all hover:from-emerald-600 hover:to-emerald-500 relative cursor-pointer touch-manipulation"
                  style="height: {day.percentage}%; min-height: {day.total > 0
                    ? '20px'
                    : '0'}"
                  onclick={() => handleBarClick(index)}
                  onmouseenter={() => (activeDay = index)}
                  onmouseleave={() => (activeDay = null)}
                  aria-label="View {day.day} spending details"
                >
                  <!-- Tooltip on hover or click -->
                  {#if activeDay === index}
                    <div
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
                    >
                      <div
                        class="bg-popover text-popover-foreground shadow-lg rounded border px-3 py-2 text-xs whitespace-nowrap"
                      >
                        <div class="font-semibold">
                          {budget.currency}
                          {day.total.toFixed(0)}
                        </div>
                        <div class="text-[10px] text-muted-foreground">
                          {day.count} transaction{day.count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  {/if}
                </button>
              </div>
              <!-- Day label -->
              <div class="text-xs font-medium text-muted-foreground">
                {day.day}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="flex items-center justify-center h-full text-muted-foreground text-sm"
        >
          No expenses yet
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
