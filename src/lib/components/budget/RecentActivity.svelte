<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Plus } from "lucide-svelte";
  import * as LucideIcons from "lucide-svelte";
  import { formatCurrency } from "$lib/utils/format";
  import { formatDate } from "$lib/utils/format";
  import { getCategoryById } from "$lib/utils/categories";
  import type { Transaction, Category, Currency, DateFormat } from "$lib/types";

  let {
    transactions,
    categories,
    currency,
    dateFormat,
    onAddClick,
  }: {
    transactions: Transaction[];
    categories: Category[];
    currency: Currency;
    dateFormat: DateFormat;
    onAddClick: () => void;
  } = $props();

  // Get the 5 most recent transactions
  let recentTransactions = $derived(
    [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );
</script>

<Card>
  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle class="text-base font-semibold">Recent Activity</CardTitle>
    <Button size="sm" onclick={onAddClick}>
      <Plus class="h-3 w-3 mr-1" />
      Add
    </Button>
  </CardHeader>
  <CardContent class="pb-3">
    {#if recentTransactions.length === 0}
      <div class="text-center py-6 text-muted-foreground text-sm">
        <p>No transactions yet</p>
        <p class="text-xs mt-1">Add your first transaction to get started</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each recentTransactions as transaction (transaction.id)}
          {@const category = getCategoryById(
            categories,
            transaction.categoryId
          )}
          {@const Icon = category ? (LucideIcons as any)[category.icon] : null}
          <div
            class="flex items-center justify-between py-1.5 border-b last:border-0"
          >
            <div class="flex items-center gap-2 flex-1 min-w-0">
              {#if category}
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style="background-color: {category.color}20;"
                >
                  {#if Icon}
                    <Icon class="w-4 h-4" style="color: {category.color}" />
                  {/if}
                </div>
              {/if}
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">
                  {transaction.note || category?.name || "No description"}
                </div>
                <div class="text-sm text-muted-foreground">
                  {formatDate(transaction.date, dateFormat)}
                </div>
              </div>
            </div>
            <div class="font-semibold text-sm flex-shrink-0 ml-2">
              {formatCurrency(transaction.amount, currency)}
            </div>
          </div>
        {/each}
      </div>
      {#if transactions.length > 5}
        <div class="text-center mt-3">
          <Button
            variant="ghost"
            size="sm"
            class="text-xs h-7"
            onclick={onAddClick}
          >
            View all {transactions.length} transactions
          </Button>
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
