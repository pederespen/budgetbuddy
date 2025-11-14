<script lang="ts">
  import type { Budget, Transaction, Category } from "$lib/types";
  import { budgetStore } from "$lib/stores/budget";
  import { dateRangeStore } from "$lib/stores/dateRange";
  import {
    formatCurrency,
    filterTransactionsByDateRange,
  } from "$lib/utils/format";
  import { Home, Receipt, TrendingUp, Settings, Wallet } from "lucide-svelte";
  import { activeTabStore } from "$lib/stores/navigation";
  import TransactionList from "../transaction/TransactionList.svelte";
  import RecentActivity from "./RecentActivity.svelte";
  import CategoryStats from "./CategoryStats.svelte";
  import SpendingByCategory from "../insights/SpendingByCategory.svelte";
  import SpendingTrend from "../insights/SpendingTrend.svelte";
  import SpendingByDayOfWeek from "../insights/SpendingByDayOfWeek.svelte";
  import TopCategories from "../insights/TopCategories.svelte";
  import MetricCard from "./MetricCard.svelte";
  import SettingsSection from "./SettingsSection.svelte";

  let { budget }: { budget: Budget } = $props();

  let activeTab = $derived.by(() => $activeTabStore);
  let dateRange = $derived.by(() => $dateRangeStore);

  $effect(() => {
    activeTabStore.set(activeTab);
  });

  let filteredEntries = $derived(
    filterTransactionsByDateRange(
      budget.entries,
      dateRange.startDate?.toISOString() || null,
      dateRange.endDate?.toISOString() || null
    )
  );

  let expenses = $derived(
    filteredEntries.filter((entry) => entry.type === "expense")
  );
  let incomes = $derived(
    filteredEntries.filter((entry) => entry.type === "income")
  );

  let totalExpenses = $derived(
    expenses.reduce((sum, entry) => sum + entry.amount, 0)
  );
  let totalIncome = $derived(
    incomes.reduce((sum, entry) => sum + entry.amount, 0)
  );
  let netAmount = $derived(totalIncome - totalExpenses);

  let filteredBudget = $derived({
    ...budget,
    entries: expenses,
  });

  function handleAddTransaction(transaction: Transaction) {
    budgetStore.addTransaction(budget.id, transaction);
  }

  function handleUpdateTransaction(transaction: Transaction) {
    budgetStore.updateTransaction(budget.id, transaction.id, transaction);
  }

  function handleDeleteTransaction(transactionId: string) {
    budgetStore.deleteTransaction(budget.id, transactionId);
  }

  function handleAddCategory(category: Category) {
    budgetStore.addCategory(budget.id, category);
  }

  function handleUpdateCategory(
    categoryId: string,
    updates: Partial<Category>
  ) {
    budgetStore.updateCategory(budget.id, categoryId, updates);
  }

  function handleDeleteCategory(categoryId: string) {
    budgetStore.deleteCategory(budget.id, categoryId);
  }
</script>

<div class="h-full flex flex-col">
  <!-- Content Area -->
  <div class="flex-1 overflow-y-auto pb-24">
    {#if activeTab === "overview"}
      <!-- Overview Content -->
      <div class="space-y-3 py-3">
        <!-- Key Metrics - Single Row Layout -->
        <div class="grid grid-cols-2 gap-2">
          <MetricCard
            icon={Wallet}
            iconColor="text-emerald-600 dark:text-emerald-500"
            label="Income"
            value={formatCurrency(totalIncome, budget.currency)}
            subtitle="{incomes.length} transaction{incomes.length === 1
              ? ''
              : 's'}"
            variant="compact"
          />

          <MetricCard
            icon={Receipt}
            iconColor="text-rose-600 dark:text-rose-500"
            label="Expenses"
            value={formatCurrency(totalExpenses, budget.currency)}
            subtitle="{expenses.length} transaction{expenses.length === 1
              ? ''
              : 's'}"
            variant="compact"
          />
        </div>

        <!-- Net Balance - Prominent Card -->
        <div class="bg-card rounded-lg border p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <TrendingUp
                class={`h-5 w-5 ${netAmount >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}
              />
              <span class="text-sm font-medium text-muted-foreground"
                >Net Balance</span
              >
            </div>
            <div
              class={`text-2xl font-bold ${netAmount >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}
            >
              {formatCurrency(netAmount, budget.currency)}
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <RecentActivity
          transactions={filteredEntries}
          categories={budget.categories}
          currency={budget.currency}
          dateFormat={budget.dateFormat}
          onAddClick={() => (activeTab = "transactions")}
        />

        <!-- Category Stats -->
        <CategoryStats
          {budget}
          filteredTransactions={expenses}
          onViewInsights={() => (activeTab = "insights")}
        />
      </div>
    {:else if activeTab === "transactions"}
      <!-- Transactions Content -->
      <div class="h-full flex flex-col p-1">
        <TransactionList
          {budget}
          transactions={filteredEntries}
          categories={budget.categories}
          currency={budget.currency}
          onAdd={handleAddTransaction}
          onEdit={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    {:else if activeTab === "insights"}
      <!-- Insights Content -->
      <div class="py-3">
        {#if filteredEntries.length === 0}
          <div class="text-center py-12 text-muted-foreground">
            <TrendingUp class="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p class="text-sm">No transactions yet</p>
            <p class="text-xs mt-2">Add transactions to see insights</p>
          </div>
        {:else}
          <div class="space-y-4">
            <SpendingTrend budget={filteredBudget} />
            <SpendingByCategory budget={filteredBudget} />
            <SpendingByDayOfWeek budget={filteredBudget} />
            <TopCategories budget={filteredBudget} />
          </div>
        {/if}
      </div>
    {:else if activeTab === "settings"}
      <!-- Settings Content -->
      <div class="p-4">
        <SettingsSection {budget} />
      </div>
    {/if}
  </div>

  <!-- Bottom Navigation -->
  <nav
    class="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around items-center h-16 px-2"
    style="padding-bottom: max(0px, env(safe-area-inset-bottom));"
  >
    <button
      onclick={() => (activeTab = "overview")}
      class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
      class:text-primary={activeTab === "overview"}
      class:text-muted-foreground={activeTab !== "overview"}
    >
      <Home class="h-5 w-5" />
      <span class="text-xs">Overview</span>
    </button>
    <button
      onclick={() => (activeTab = "transactions")}
      class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
      class:text-primary={activeTab === "transactions"}
      class:text-muted-foreground={activeTab !== "transactions"}
    >
      <Receipt class="h-5 w-5" />
      <span class="text-xs">Transactions</span>
    </button>
    <button
      onclick={() => (activeTab = "insights")}
      class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
      class:text-primary={activeTab === "insights"}
      class:text-muted-foreground={activeTab !== "insights"}
    >
      <TrendingUp class="h-5 w-5" />
      <span class="text-xs">Insights</span>
    </button>
    <button
      onclick={() => (activeTab = "settings")}
      class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
      class:text-primary={activeTab === "settings"}
      class:text-muted-foreground={activeTab !== "settings"}
    >
      <Settings class="h-5 w-5" />
      <span class="text-xs">Settings</span>
    </button>
  </nav>
</div>
