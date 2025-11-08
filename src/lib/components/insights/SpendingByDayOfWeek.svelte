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

  const dayData = $derived(() => {
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);

    budget.entries.forEach((expense) => {
      const date = new Date(expense.date);
      const dayOfWeek = date.getDay();
      dayTotals[dayOfWeek] += expense.amount;
      dayCounts[dayOfWeek]++;
    });

    const maxAmount = Math.max(...dayTotals, 1);

    return dayNames.map((name, index) => ({
      day: name,
      total: dayTotals[index],
      count: dayCounts[index],
      percentage: (dayTotals[index] / maxAmount) * 100,
    }));
  });
</script>

<Card>
  <CardHeader>
    <CardTitle>Spending by Day</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="h-[240px]">
      {#if dayData().some((d) => d.total > 0)}
        <div class="flex items-end justify-between h-full gap-2 pb-6">
          {#each dayData() as day}
            <div class="flex-1 flex flex-col items-center gap-2 h-full">
              <!-- Bar container -->
              <div
                class="flex-1 w-full flex flex-col justify-end relative group"
              >
                <div
                  class="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all hover:from-emerald-600 hover:to-emerald-500 relative"
                  style="height: {day.percentage}%"
                >
                  <!-- Tooltip on hover -->
                  <div
                    class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  >
                    <div
                      class="bg-popover text-popover-foreground shadow-md rounded border px-2 py-1 text-xs whitespace-nowrap"
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
                </div>
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
