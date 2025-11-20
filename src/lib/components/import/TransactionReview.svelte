<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Category } from "$lib/types";
  import * as Select from "$lib/components/ui/select";
  import { formatCurrency } from "$lib/utils/format";
  import {
    Calendar,
    TrendingUp,
    TrendingDown,
    HelpCircle,
  } from "lucide-svelte";

  export let transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    isIncome: boolean;
    suggestedCategory: Category | null;
    selectedCategory: Category | null;
    matchedPattern: string | null;
    note: string;
  }>;
  export let categories: Category[];

  const dispatch = createEventDispatcher<{
    categoryChange: { transactionId: string; category: Category };
  }>();

  // Group transactions by suggested category
  $: groupedTransactions = transactions.reduce(
    (acc, t) => {
      const key = t.suggestedCategory?.name || "Uncategorized";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(t);
      return acc;
    },
    {} as Record<string, typeof transactions>
  );

  // Sort groups: categorized first, uncategorized last
  $: sortedGroups = Object.entries(groupedTransactions).sort(([a], [b]) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  function handleCategoryChange(transactionId: string, value: string) {
    const category = categories.find((c) => c.id === value);
    if (category) {
      dispatch("categoryChange", { transactionId, category });
    }
  }

  function getCategoryColor(category: Category | null): string {
    return category?.color || "#95a5a6";
  }
</script>

<div class="space-y-4">
  {#each sortedGroups as [groupName, groupTransactions]}
    <div class="border rounded-lg overflow-hidden">
      <div class="bg-muted px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-3 h-3 rounded-full"
            style="background-color: {getCategoryColor(
              groupTransactions[0].suggestedCategory
            )}"
          ></div>
          <h3 class="font-medium">{groupName}</h3>
          <span class="text-xs px-2 py-1 rounded-full bg-muted-foreground/10">
            {groupTransactions.length} transaction{groupTransactions.length !==
            1
              ? "s"
              : ""}
          </span>
        </div>
        <div class="text-sm text-muted-foreground">
          Total: {formatCurrency(
            groupTransactions.reduce((sum, t) => sum + t.amount, 0),
            "NOK"
          )}
        </div>
      </div>

      <div class="divide-y">
        {#each groupTransactions as transaction}
          <div class="p-4 hover:bg-muted/50 transition-colors">
            <div class="flex items-start gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <Calendar
                    class="w-4 h-4 text-muted-foreground flex-shrink-0"
                  />
                  <span class="text-sm text-muted-foreground"
                    >{transaction.date}</span
                  >
                  {#if transaction.isIncome}
                    <TrendingUp class="w-4 h-4 text-green-600" />
                  {:else}
                    <TrendingDown class="w-4 h-4 text-red-600" />
                  {/if}
                </div>

                <p class="font-medium truncate" title={transaction.note}>
                  {transaction.note}
                </p>

                {#if transaction.matchedPattern}
                  <p class="text-xs text-muted-foreground mt-1">
                    Matched pattern: "{transaction.matchedPattern}"
                  </p>
                {:else}
                  <div
                    class="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 mt-1"
                  >
                    <HelpCircle class="w-3 h-3" />
                    <span>No pattern match - please categorize manually</span>
                  </div>
                {/if}
              </div>

              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p
                    class="font-semibold {transaction.isIncome
                      ? 'text-green-600'
                      : 'text-red-600'}"
                  >
                    {transaction.isIncome ? "+" : "-"}{formatCurrency(
                      transaction.amount,
                      "NOK"
                    )}
                  </p>
                </div>
                <div class="w-48">
                  <Select.Root
                    type="single"
                    value={transaction.selectedCategory?.id || ""}
                    onValueChange={(v: string | undefined) =>
                      v && handleCategoryChange(transaction.id, v)}
                  >
                    <Select.Trigger class="w-full">
                      <span
                        >{transaction.selectedCategory?.name ||
                          "Select category..."}</span
                      >
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Label>Income</Select.Label>
                        {#each categories.filter((c) => c.type === "income") as category}
                          <Select.Item value={category.id}>
                            <div class="flex items-center gap-2">
                              <div
                                class="w-3 h-3 rounded-full"
                                style="background-color: {category.color}"
                              ></div>
                              {category.name}
                            </div>
                          </Select.Item>
                        {/each}
                      </Select.Group>
                      <Select.Group>
                        <Select.Label>Expenses</Select.Label>
                        {#each categories.filter((c) => c.type === "expense") as category}
                          <Select.Item value={category.id}>
                            <div class="flex items-center gap-2">
                              <div
                                class="w-3 h-3 rounded-full"
                                style="background-color: {category.color}"
                              ></div>
                              {category.name}
                            </div>
                          </Select.Item>
                        {/each}
                      </Select.Group>
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
