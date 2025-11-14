<script lang="ts">
  import type { Budget, Transaction, Category } from "$lib/types";
  import { budgetStore } from "$lib/stores/budget";
  import { dateRangeStore } from "$lib/stores/dateRange";
  import {
    formatCurrency,
    filterTransactionsByDateRange,
  } from "$lib/utils/format";
  import { Wallet, Receipt, TrendingUp } from "lucide-svelte";
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

<div class="h-full flex flex-col overflow-hidden">
  <!-- Content based on active tab -->
  <div class="flex-1 overflow-auto">
    {#if activeTab === "overview"}
      <div class="space-y-4 py-4">
        <!-- Key Metrics - Clean Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <MetricCard
            icon={Wallet}
            iconColor="text-emerald-600 dark:text-emerald-500"
            label="Income"
            value={formatCurrency(totalIncome, budget.currency)}
            subtitle="{incomes.length} transaction{incomes.length === 1
              ? ''
              : 's'}"
          />

          <MetricCard
            icon={Receipt}
            iconColor="text-rose-600 dark:text-rose-500"
            label="Expenses"
            value={formatCurrency(totalExpenses, budget.currency)}
            subtitle="{expenses.length} transaction{expenses.length === 1
              ? ''
              : 's'}"
          />

          <MetricCard
            icon={TrendingUp}
            iconColor={netAmount >= 0
              ? "text-emerald-600 dark:text-emerald-500"
              : "text-rose-600 dark:text-rose-500"}
            label="Net Balance"
            value={formatCurrency(netAmount, budget.currency)}
            subtitle={netAmount >= 0 ? "Positive balance" : "Negative balance"}
          />
        </div>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Recent Activity -->
          <RecentActivity
            transactions={filteredEntries}
            categories={budget.categories}
            currency={budget.currency}
            dateFormat={budget.dateFormat}
            onAddClick={() => (activeTab = "transactions")}
          />

          <!-- Category Stats (expenses only) -->
          <CategoryStats
            {budget}
            filteredTransactions={expenses}
            onViewInsights={() => (activeTab = "insights")}
          />
        </div>
      </div>
    {:else if activeTab === "transactions"}
      <!-- Transactions Tab -->
      <div class="h-full flex flex-col p-4">
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
      <!-- Insights Tab -->
      <div class="py-4 flex-1 overflow-auto">
        {#if filteredEntries.length === 0}
          <div class="text-center py-12 text-muted-foreground">
            <TrendingUp class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p class="text-lg">No transactions yet</p>
            <p class="text-sm mt-2">
              Add some transactions to see insights and analytics
            </p>
          </div>
        {:else}
          <div class="space-y-6 pb-6">
            <!-- Charts Grid -->
            <div class="grid gap-4 md:grid-cols-2">
              <SpendingTrend budget={filteredBudget} />
              <SpendingByCategory budget={filteredBudget} />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <SpendingByDayOfWeek budget={filteredBudget} />
              <TopCategories budget={filteredBudget} />
            </div>
          </div>
        {/if}
      </div>
    {:else if activeTab === "settings"}
      <!-- Settings Tab -->
      <div class="py-4 flex-1 overflow-auto">
        <div class="max-w-2xl mx-auto">
          <SettingsSection {budget} />
        </div>
      </div>
    {/if}
  </div>
</div>
