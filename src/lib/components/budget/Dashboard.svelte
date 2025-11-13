<script lang="ts">
  import type {
    Budget,
    Transaction,
    Category,
    Currency,
    DateFormat,
  } from "$lib/types";
  import { budgetStore } from "$lib/stores/budget";
  import { dateRangeStore } from "$lib/stores/dateRange";
  import {
    formatCurrency,
    currencyShortLabels,
    dateFormatLabels,
    filterTransactionsByDateRange,
  } from "$lib/utils/format";
  import * as Select from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import TransactionList from "../transaction/TransactionList.svelte";
  import RecentActivity from "./RecentActivity.svelte";
  import CategoryStats from "./CategoryStats.svelte";
  import SpendingByCategory from "../insights/SpendingByCategory.svelte";
  import SpendingTrend from "../insights/SpendingTrend.svelte";
  import SpendingByDayOfWeek from "../insights/SpendingByDayOfWeek.svelte";
  import TopCategories from "../insights/TopCategories.svelte";
  import {
    Home,
    Receipt,
    TrendingUp,
    Settings,
    Pencil,
    Check,
    X,
    Wallet,
    FileJson,
    FileText,
    FileSpreadsheet,
  } from "lucide-svelte";
  import { activeTabStore } from "$lib/stores/navigation";
  import { exportAsJSON, exportAsCSV, exportAsXLSX } from "$lib/utils/export";

  let { budget }: { budget: Budget } = $props();

  let activeTab = $derived.by(() => $activeTabStore);
  let dateRange = $derived.by(() => $dateRangeStore);

  $effect(() => {
    activeTabStore.set(activeTab);
  });

  // Local state for settings
  let selectedCurrency = $state<Currency>(budget.currency);
  let selectedDateFormat = $state<DateFormat>(budget.dateFormat);
  let isConvertingCurrency = $state(false);

  // Budget name editing
  let isEditingName = $state(false);
  let editedName = $state(budget.name);

  // Sync local state with budget changes
  $effect(() => {
    selectedCurrency = budget.currency;
    selectedDateFormat = budget.dateFormat;
    editedName = budget.name;
  });

  // Filter transactions based on date range
  let filteredEntries = $derived(
    filterTransactionsByDateRange(
      budget.entries,
      dateRange.startDate?.toISOString() || null,
      dateRange.endDate?.toISOString() || null
    )
  );

  // Separate income and expenses
  let expenses = $derived(
    filteredEntries.filter((entry) => entry.type === "expense")
  );

  let incomes = $derived(
    filteredEntries.filter((entry) => entry.type === "income")
  );

  // Calculate totals
  let totalExpenses = $derived(
    expenses.reduce((sum, entry) => sum + entry.amount, 0)
  );

  let totalIncome = $derived(
    incomes.reduce((sum, entry) => sum + entry.amount, 0)
  );

  let netAmount = $derived(totalIncome - totalExpenses);

  // Create a budget object with filtered expenses for child components (insights should show expenses only)
  let filteredBudget = $derived({
    ...budget,
    entries: expenses,
  });

  async function getExchangeRate(
    from: Currency,
    to: Currency
  ): Promise<number> {
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      const data = await response.json();
      return data.rates[to] || 1;
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      return 1;
    }
  }

  async function handleCurrencyChange() {
    if (selectedCurrency === budget.currency) return;

    isConvertingCurrency = true;
    const fromCurrency = budget.currency; // Capture original currency
    const toCurrency = selectedCurrency;

    try {
      // Get exchange rate
      const rate = await getExchangeRate(fromCurrency, toCurrency);

      // Convert all transaction amounts
      const convertedEntries = budget.entries.map((entry) => ({
        ...entry,
        amount: entry.amount * rate,
      }));

      // Convert budget limits
      const convertedBudgetLimits: { [key: string]: number } = {};
      for (const [categoryId, limit] of Object.entries(budget.budgetLimits)) {
        convertedBudgetLimits[categoryId] = limit * rate;
      }

      // Update budget with converted values
      budgetStore.updateBudget(budget.id, {
        currency: toCurrency,
        entries: convertedEntries,
        budgetLimits: convertedBudgetLimits,
      });
    } catch (error) {
      console.error("Currency conversion error:", error);
      // Reset to original currency
      selectedCurrency = budget.currency;
    } finally {
      isConvertingCurrency = false;
    }
  }

  function handleDateFormatChange() {
    budgetStore.updateBudget(budget.id, { dateFormat: selectedDateFormat });
  }

  function handleStartEditName() {
    isEditingName = true;
    editedName = budget.name;
  }

  function handleSaveName() {
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      return;
    }
    budgetStore.updateBudget(budget.id, { name: trimmedName });
    isEditingName = false;
  }

  function handleCancelEditName() {
    isEditingName = false;
    editedName = budget.name;
  }

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

<!-- Mobile View -->
<div class="sm:hidden h-full flex flex-col overflow-hidden">
  <!-- Content Area -->
  <div class="flex-1 overflow-auto pb-20">
    {#if activeTab === "overview"}
      <!-- Overview Content -->
      <div class="space-y-3 py-3">
        <!-- Key Metrics - Single Row Layout -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Income Card -->
          <div class="bg-card rounded-lg border p-3">
            <div class="flex items-center gap-2 mb-2">
              <Wallet class="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <span class="text-xs font-medium text-muted-foreground"
                >Income</span
              >
            </div>
            <div class="text-xl font-bold">
              {formatCurrency(totalIncome, budget.currency)}
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              {incomes.length} transaction{incomes.length === 1 ? "" : "s"}
            </div>
          </div>

          <!-- Expenses Card -->
          <div class="bg-card rounded-lg border p-3">
            <div class="flex items-center gap-2 mb-2">
              <Receipt class="h-4 w-4 text-rose-600 dark:text-rose-500" />
              <span class="text-xs font-medium text-muted-foreground"
                >Expenses</span
              >
            </div>
            <div class="text-xl font-bold">
              {formatCurrency(totalExpenses, budget.currency)}
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              {expenses.length} transaction{expenses.length === 1 ? "" : "s"}
            </div>
          </div>
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
            <!-- Charts -->
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
        <div class="space-y-8">
          <!-- Budget Information Section -->
          <div class="space-y-3">
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="budget-name-mobile">Budget Name</Label>
                {#if isEditingName}
                  <div class="flex gap-2">
                    <Input
                      id="budget-name-mobile"
                      type="text"
                      bind:value={editedName}
                      class="flex-1"
                      placeholder="Budget name"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onclick={handleSaveName}
                      aria-label="Save name"
                    >
                      <Check class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onclick={handleCancelEditName}
                      aria-label="Cancel"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                {:else}
                  <div class="flex items-center gap-2">
                    <p class="text-sm flex-1">{budget.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onclick={handleStartEditName}
                      aria-label="Edit name"
                    >
                      <Pencil class="h-4 w-4" />
                    </Button>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Display Settings Section -->
          <div class="space-y-3">
            <h3
              class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
            >
              Display Settings
            </h3>
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="currency-mobile">Currency</Label>
                <Select.Root
                  type="single"
                  bind:value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                  disabled={isConvertingCurrency}
                >
                  <Select.Trigger
                    id="currency-mobile"
                    class="w-full"
                    disabled={isConvertingCurrency}
                  >
                    <span>{currencyShortLabels[selectedCurrency]}</span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="NOK" label="NOK (kr)"
                      >NOK (kr)</Select.Item
                    >
                    <Select.Item value="USD" label="USD ($)"
                      >USD ($)</Select.Item
                    >
                    <Select.Item value="EUR" label="EUR (€)"
                      >EUR (€)</Select.Item
                    >
                    <Select.Item value="GBP" label="GBP (£)"
                      >GBP (£)</Select.Item
                    >
                    <Select.Item value="SEK" label="SEK (kr)"
                      >SEK (kr)</Select.Item
                    >
                    <Select.Item value="DKK" label="DKK (kr)"
                      >DKK (kr)</Select.Item
                    >
                  </Select.Content>
                </Select.Root>
                <p class="text-xs text-muted-foreground">
                  {#if isConvertingCurrency}
                    Converting all amounts using live exchange rates...
                  {:else}
                    Changing currency will convert all amounts using live
                    exchange rates
                  {/if}
                </p>
              </div>

              <div class="space-y-2">
                <Label for="dateformat-mobile">Date Format</Label>
                <Select.Root
                  type="single"
                  bind:value={selectedDateFormat}
                  onValueChange={handleDateFormatChange}
                >
                  <Select.Trigger id="dateformat-mobile" class="w-full">
                    <span>{dateFormatLabels[selectedDateFormat]}</span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="DD/MM/YYYY" label="DD/MM/YYYY"
                      >DD/MM/YYYY</Select.Item
                    >
                    <Select.Item value="MM/DD/YYYY" label="MM/DD/YYYY"
                      >MM/DD/YYYY</Select.Item
                    >
                    <Select.Item value="YYYY-MM-DD" label="YYYY-MM-DD"
                      >YYYY-MM-DD</Select.Item
                    >
                    <Select.Item value="DD.MM.YYYY" label="DD.MM.YYYY"
                      >DD.MM.YYYY</Select.Item
                    >
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
          </div>

          <!-- Export Section -->
          <div class="space-y-3">
            <h3
              class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
            >
              Export Data
            </h3>
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                Download your budget data in different formats
              </p>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  onclick={() => exportAsJSON(budget)}
                  class="flex-1 justify-start bg-card"
                >
                  <FileJson class="mr-2 h-4 w-4" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  onclick={() => exportAsCSV(budget)}
                  class="flex-1 justify-start bg-card"
                >
                  <FileText class="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onclick={() => exportAsXLSX(budget)}
                  class="flex-1 justify-start bg-card"
                >
                  <FileSpreadsheet class="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Bottom Navigation -->
  <nav
    class="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around items-center h-16 px-2"
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

<!-- Desktop View -->
<div class="hidden sm:flex h-full flex-col overflow-hidden">
  <!-- Content based on active tab -->
  <div class="flex-1 overflow-auto">
    {#if activeTab === "overview"}
      <div class="space-y-4 py-4">
        <!-- Key Metrics - Clean Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <!-- Income Card -->
          <div
            class="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-2 mb-3">
              <div class="p-2 rounded-lg bg-emerald-500/10">
                <Wallet
                  class="h-5 w-5 text-emerald-600 dark:text-emerald-500"
                />
              </div>
              <span class="text-sm font-medium text-muted-foreground"
                >Income</span
              >
            </div>
            <div class="text-2xl font-bold mb-1">
              {formatCurrency(totalIncome, budget.currency)}
            </div>
            <div class="text-sm text-muted-foreground">
              {incomes.length} transaction{incomes.length === 1 ? "" : "s"}
            </div>
          </div>

          <!-- Expenses Card -->
          <div
            class="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-2 mb-3">
              <div class="p-2 rounded-lg bg-rose-500/10">
                <Receipt class="h-5 w-5 text-rose-600 dark:text-rose-500" />
              </div>
              <span class="text-sm font-medium text-muted-foreground"
                >Expenses</span
              >
            </div>
            <div class="text-2xl font-bold mb-1">
              {formatCurrency(totalExpenses, budget.currency)}
            </div>
            <div class="text-sm text-muted-foreground">
              {expenses.length} transaction{expenses.length === 1 ? "" : "s"}
            </div>
          </div>

          <!-- Net Balance Card -->
          <div
            class="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-2 mb-3">
              <div
                class={`p-2 rounded-lg ${netAmount >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}
              >
                <TrendingUp
                  class={`h-5 w-5 ${netAmount >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}
                />
              </div>
              <span class="text-sm font-medium text-muted-foreground"
                >Net Balance</span
              >
            </div>
            <div
              class={`text-2xl font-bold mb-1 ${netAmount >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}
            >
              {formatCurrency(netAmount, budget.currency)}
            </div>
            <div class="text-sm text-muted-foreground">
              {netAmount >= 0 ? "Positive" : "Negative"} balance
            </div>
          </div>
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
        <div class="max-w-2xl mx-auto space-y-8">
          <!-- Budget Information Section -->
          <div class="space-y-4">
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="budget-name">Budget Name</Label>
                {#if isEditingName}
                  <div class="flex gap-2 max-w-xs">
                    <Input
                      id="budget-name"
                      type="text"
                      bind:value={editedName}
                      class="flex-1"
                      placeholder="Budget name"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onclick={handleSaveName}
                      title="Save"
                    >
                      <Check class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onclick={handleCancelEditName}
                      title="Cancel"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                {:else}
                  <div class="flex items-center gap-2 max-w-xs">
                    <p class="text-sm flex-1">{budget.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onclick={handleStartEditName}
                      title="Edit name"
                    >
                      <Pencil class="h-4 w-4" />
                    </Button>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t"></div>

          <!-- Display Settings Section -->
          <div class="space-y-4">
            <h3
              class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
            >
              Display Settings
            </h3>
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="currency-desktop">Currency</Label>
                <Select.Root
                  type="single"
                  bind:value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                  disabled={isConvertingCurrency}
                >
                  <Select.Trigger
                    id="currency-desktop"
                    class="w-full max-w-xs"
                    disabled={isConvertingCurrency}
                  >
                    <span>{currencyShortLabels[selectedCurrency]}</span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="NOK" label="NOK (kr)"
                      >NOK (kr)</Select.Item
                    >
                    <Select.Item value="USD" label="USD ($)"
                      >USD ($)</Select.Item
                    >
                    <Select.Item value="EUR" label="EUR (€)"
                      >EUR (€)</Select.Item
                    >
                    <Select.Item value="GBP" label="GBP (£)"
                      >GBP (£)</Select.Item
                    >
                    <Select.Item value="SEK" label="SEK (kr)"
                      >SEK (kr)</Select.Item
                    >
                    <Select.Item value="DKK" label="DKK (kr)"
                      >DKK (kr)</Select.Item
                    >
                  </Select.Content>
                </Select.Root>
                <p class="text-xs text-muted-foreground">
                  {#if isConvertingCurrency}
                    Converting all amounts using live exchange rates...
                  {:else}
                    Changing currency will convert all amounts using live
                    exchange rates
                  {/if}
                </p>
              </div>

              <div class="space-y-2">
                <Label for="dateformat-desktop">Date Format</Label>
                <Select.Root
                  type="single"
                  bind:value={selectedDateFormat}
                  onValueChange={handleDateFormatChange}
                >
                  <Select.Trigger
                    id="dateformat-desktop"
                    class="w-full max-w-xs"
                  >
                    <span>{dateFormatLabels[selectedDateFormat]}</span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="DD/MM/YYYY" label="DD/MM/YYYY"
                      >DD/MM/YYYY</Select.Item
                    >
                    <Select.Item value="MM/DD/YYYY" label="MM/DD/YYYY"
                      >MM/DD/YYYY</Select.Item
                    >
                    <Select.Item value="YYYY-MM-DD" label="YYYY-MM-DD"
                      >YYYY-MM-DD</Select.Item
                    >
                    <Select.Item value="DD.MM.YYYY" label="DD.MM.YYYY"
                      >DD.MM.YYYY</Select.Item
                    >
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
          </div>

          <!-- Export Section -->
          <div class="space-y-3">
            <h3
              class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
            >
              Export Data
            </h3>
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                Download your budget data in different formats
              </p>
              <div class="flex gap-2 max-w-xs">
                <Button
                  variant="outline"
                  onclick={() => exportAsJSON(budget)}
                  class="flex-1 justify-start bg-card"
                >
                  <FileJson class="mr-2 h-4 w-4" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  onclick={() => exportAsCSV(budget)}
                  class="flex-1 justify-start bg-card"
                >
                  <FileText class="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onclick={() => exportAsXLSX(budget)}
                  class="flex-1 justify-start bg-card"
                >
                  <FileSpreadsheet class="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
