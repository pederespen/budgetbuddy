<script lang="ts">
  import type {
    Budget,
    Expense,
    Category,
    Currency,
    DateFormat,
  } from "$lib/types";
  import { budgetStore } from "$lib/stores/budget";
  import {
    formatCurrency,
    currencyShortLabels,
    dateFormatLabels,
  } from "$lib/utils/format";
  import { getCategoryById } from "$lib/utils/categories";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Select from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import ExpenseList from "../expense/ExpenseList.svelte";
  import StatCard from "./StatCard.svelte";
  import RecentActivity from "./RecentActivity.svelte";
  import CategoryStats from "./CategoryStats.svelte";
  import SpendingByCategory from "../insights/SpendingByCategory.svelte";
  import SpendingTrend from "../insights/SpendingTrend.svelte";
  import BudgetProgress from "../insights/BudgetProgress.svelte";
  import TopCategories from "../insights/TopCategories.svelte";
  import { toast } from "svelte-sonner";
  import {
    Home,
    Receipt,
    TrendingUp,
    Settings,
    Pencil,
    Check,
    X,
    Wallet,
    CreditCard,
    ListOrdered,
  } from "lucide-svelte";

  let { budget }: { budget: Budget } = $props();

  let activeTab = $state("overview");

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

  // Calculate total spending
  let totalSpent = $derived(
    budget.entries.reduce((sum, entry) => sum + entry.amount, 0)
  );

  // Calculate remaining balance
  let remainingBalance = $derived(
    budget.startingBalance ? budget.startingBalance - totalSpent : null
  );

  // Determine if over budget (spent more than starting balance)
  let isOverBudget = $derived(
    budget.startingBalance ? totalSpent > budget.startingBalance : false
  );

  // Calculate largest single expense
  let largestExpense = $derived(
    budget.entries.length > 0
      ? Math.max(...budget.entries.map((e) => e.amount))
      : 0
  );

  // Calculate average expense
  let averageExpense = $derived(
    budget.entries.length > 0 ? totalSpent / budget.entries.length : 0
  );

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
      toast.error("Currency conversion failed", {
        description: "Using rate of 1.0. Please try again later.",
      });
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

      // Convert all expense amounts
      const convertedEntries = budget.entries.map((entry) => ({
        ...entry,
        amount: entry.amount * rate,
      }));

      // Convert starting balance if it exists
      const convertedStartingBalance = budget.startingBalance
        ? budget.startingBalance * rate
        : undefined;

      // Convert budget limits
      const convertedBudgetLimits: { [key: string]: number } = {};
      for (const [categoryId, limit] of Object.entries(budget.budgetLimits)) {
        convertedBudgetLimits[categoryId] = limit * rate;
      }

      // Update budget with converted values
      budgetStore.updateBudget(budget.id, {
        currency: toCurrency,
        entries: convertedEntries,
        startingBalance: convertedStartingBalance,
        budgetLimits: convertedBudgetLimits,
      });

      toast.success("Currency converted", {
        description: `All amounts converted from ${fromCurrency} to ${toCurrency}`,
      });
    } catch (error) {
      console.error("Currency conversion error:", error);
      toast.error("Conversion failed", {
        description: "Please try again",
      });
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
      toast.error("Budget name cannot be empty");
      return;
    }
    budgetStore.updateBudget(budget.id, { name: trimmedName });
    isEditingName = false;
    toast.success("Budget name updated");
  }

  function handleCancelEditName() {
    isEditingName = false;
    editedName = budget.name;
  }

  function handleAddExpense(expense: Expense) {
    const category = getCategoryById(budget.categories, expense.categoryId);
    const categoryName = category?.name || "Unknown";

    budgetStore.addExpense(budget.id, expense);
    toast.success("Expense added", {
      description: `${formatCurrency(expense.amount, budget.currency)} for ${categoryName}`,
    });
  }

  function handleEditExpense(expense: Expense) {
    const category = getCategoryById(budget.categories, expense.categoryId);
    const categoryName = category?.name || "Unknown";

    budgetStore.updateExpense(budget.id, expense.id, expense);
    toast.success("Expense updated", {
      description: `${formatCurrency(expense.amount, budget.currency)} for ${categoryName}`,
    });
  }

  function handleDeleteExpense(expenseId: string) {
    const expense = budget.entries.find((e) => e.id === expenseId);
    const category = expense
      ? getCategoryById(budget.categories, expense.categoryId)
      : null;
    const categoryName = category?.name || "Unknown";

    budgetStore.deleteExpense(budget.id, expenseId);
    if (expense) {
      toast.success("Expense deleted", {
        description: `${formatCurrency(expense.amount, budget.currency)} for ${categoryName}`,
      });
    }
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
      <div class="space-y-3 p-3">
        <!-- Key Metrics Grid -->
        <div class="grid grid-cols-2 gap-2">
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent, budget.currency)}
            variant={isOverBudget ? "danger" : "default"}
          >
            {#snippet icon()}
              <Wallet class="h-4 w-4 text-muted-foreground" />
            {/snippet}
          </StatCard>

          {#if budget.startingBalance}
            <StatCard
              title="Remaining"
              value={formatCurrency(
                Math.max(0, budget.startingBalance - totalSpent),
                budget.currency
              )}
              subtitle={isOverBudget
                ? `${formatCurrency(totalSpent - budget.startingBalance, budget.currency)} over`
                : `of ${formatCurrency(budget.startingBalance, budget.currency)}`}
              variant={isOverBudget
                ? "danger"
                : remainingBalance &&
                    remainingBalance < budget.startingBalance * 0.2
                  ? "warning"
                  : "success"}
            >
              {#snippet icon()}
                <CreditCard class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
          {:else}
            <StatCard
              title="Transactions"
              value={budget.entries.length.toString()}
              subtitle={budget.entries.length === 1 ? "expense" : "expenses"}
            >
              {#snippet icon()}
                <Receipt class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
          {/if}

          <StatCard
            title="Largest Expense"
            value={formatCurrency(largestExpense, budget.currency)}
            subtitle={budget.entries.length > 0
              ? "single transaction"
              : "no expenses yet"}
          >
            {#snippet icon()}
              <TrendingUp class="h-4 w-4 text-muted-foreground" />
            {/snippet}
          </StatCard>

          <StatCard
            title="Avg. Expense"
            value={formatCurrency(averageExpense, budget.currency)}
            subtitle={budget.entries.length > 0 ? "per transaction" : "no data"}
          >
            {#snippet icon()}
              <ListOrdered class="h-4 w-4 text-muted-foreground" />
            {/snippet}
          </StatCard>
        </div>

        <!-- Recent Activity -->
        <RecentActivity
          expenses={budget.entries}
          categories={budget.categories}
          currency={budget.currency}
          dateFormat={budget.dateFormat}
          onAddClick={() => (activeTab = "expenses")}
        />

        <!-- Category Stats -->
        <CategoryStats
          {budget}
          onViewInsights={() => (activeTab = "insights")}
        />
      </div>
    {:else if activeTab === "expenses"}
      <!-- Expenses Content -->
      <div class="h-full flex flex-col p-1">
        <ExpenseList
          {budget}
          expenses={budget.entries}
          categories={budget.categories}
          currency={budget.currency}
          onAdd={handleAddExpense}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    {:else if activeTab === "insights"}
      <!-- Insights Content -->
      <div class="p-1">
        <div class="text-center py-12 text-muted-foreground">
          <TrendingUp class="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Insights coming soon...</p>
        </div>
      </div>
    {:else if activeTab === "settings"}
      <!-- Settings Content -->
      <div class="p-4">
        <div class="space-y-8">
          <!-- Budget Information Section -->
          <div class="space-y-3">
            <h3
              class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
            >
              Budget Information
            </h3>
            <div class="space-y-4">
              <div class="space-y-2">
                <div class="text-sm font-medium">Budget Name</div>
                <p class="text-sm text-muted-foreground">{budget.name}</p>
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
      onclick={() => (activeTab = "expenses")}
      class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
      class:text-primary={activeTab === "expenses"}
      class:text-muted-foreground={activeTab !== "expenses"}
    >
      <Receipt class="h-5 w-5" />
      <span class="text-xs">Expenses</span>
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
  <!-- Tabs Navigation -->
  <Tabs.Root
    bind:value={activeTab}
    class="flex flex-col flex-1 overflow-hidden"
  >
    <Tabs.List class="grid w-full grid-cols-4 max-w-2xl flex-shrink-0 mx-auto">
      <Tabs.Trigger value="overview" class="cursor-pointer"
        >Overview</Tabs.Trigger
      >
      <Tabs.Trigger value="expenses" class="cursor-pointer"
        >Expenses</Tabs.Trigger
      >
      <Tabs.Trigger value="insights" class="cursor-pointer"
        >Insights</Tabs.Trigger
      >
      <Tabs.Trigger value="settings" class="cursor-pointer"
        >Settings</Tabs.Trigger
      >
    </Tabs.List>

    <!-- Overview Tab -->
    <Tabs.Content value="overview" class="mt-4 flex-1 overflow-auto">
      <div class="space-y-4 max-w-6xl mx-auto px-4 pb-4">
        <!-- Key Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent, budget.currency)}
            variant={isOverBudget ? "danger" : "default"}
          >
            {#snippet icon()}
              <Wallet class="h-4 w-4 text-muted-foreground" />
            {/snippet}
          </StatCard>

          {#if budget.startingBalance}
            <StatCard
              title="Remaining"
              value={formatCurrency(
                Math.max(0, budget.startingBalance - totalSpent),
                budget.currency
              )}
              subtitle={isOverBudget
                ? `${formatCurrency(totalSpent - budget.startingBalance, budget.currency)} over`
                : `of ${formatCurrency(budget.startingBalance, budget.currency)}`}
              variant={isOverBudget
                ? "danger"
                : remainingBalance &&
                    remainingBalance < budget.startingBalance * 0.2
                  ? "warning"
                  : "success"}
            >
              {#snippet icon()}
                <CreditCard class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
          {:else}
            <StatCard
              title="Transactions"
              value={budget.entries.length.toString()}
              subtitle={budget.entries.length === 1 ? "expense" : "expenses"}
            >
              {#snippet icon()}
                <Receipt class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
          {/if}

          <StatCard
            title="Largest Expense"
            value={formatCurrency(largestExpense, budget.currency)}
            subtitle={budget.entries.length > 0
              ? "single transaction"
              : "no expenses yet"}
          >
            {#snippet icon()}
              <TrendingUp class="h-4 w-4 text-muted-foreground" />
            {/snippet}
          </StatCard>

          <StatCard
            title="Avg. Expense"
            value={formatCurrency(averageExpense, budget.currency)}
            subtitle={budget.entries.length > 0 ? "per transaction" : "no data"}
          >
            {#snippet icon()}
              <ListOrdered class="h-4 w-4 text-muted-foreground" />
            {/snippet}
          </StatCard>
        </div>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Recent Activity -->
          <RecentActivity
            expenses={budget.entries}
            categories={budget.categories}
            currency={budget.currency}
            dateFormat={budget.dateFormat}
            onAddClick={() => (activeTab = "expenses")}
          />

          <!-- Category Stats -->
          <CategoryStats
            {budget}
            onViewInsights={() => (activeTab = "insights")}
          />
        </div>
      </div>
    </Tabs.Content>

    <!-- Expenses Tab -->
    <Tabs.Content
      value="expenses"
      class="mt-6 flex-1 overflow-hidden flex flex-col"
    >
      <ExpenseList
        {budget}
        expenses={budget.entries}
        categories={budget.categories}
        currency={budget.currency}
        onAdd={handleAddExpense}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </Tabs.Content>

    <!-- Insights Tab -->
    <Tabs.Content value="insights" class="mt-6 flex-1 overflow-auto">
      {#if budget.entries.length === 0}
        <div class="text-center py-12 text-muted-foreground">
          <TrendingUp class="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p class="text-lg">No expenses yet</p>
          <p class="text-sm mt-2">
            Add some expenses to see insights and analytics
          </p>
        </div>
      {:else}
        <div class="space-y-6 pb-6">
          <!-- Overview Cards -->
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Spending"
              value={formatCurrency(totalSpent, budget.currency)}
              subtitle="{budget.entries.length} transactions"
            >
              {#snippet icon()}
                <Receipt class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
            <StatCard
              title="Active Categories"
              value={new Set(
                budget.entries.map((e) => e.categoryId)
              ).size.toString()}
              subtitle="Out of {budget.categories.length} total"
            >
              {#snippet icon()}
                <ListOrdered class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
            <StatCard
              title="Largest Expense"
              value={formatCurrency(largestExpense, budget.currency)}
              subtitle="Single transaction"
            >
              {#snippet icon()}
                <TrendingUp class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
            <StatCard
              title="Avg. Transaction"
              value={formatCurrency(averageExpense, budget.currency)}
              subtitle="Per expense"
            >
              {#snippet icon()}
                <Wallet class="h-4 w-4 text-muted-foreground" />
              {/snippet}
            </StatCard>
          </div>

          <!-- Charts Grid -->
          <div class="grid gap-4 md:grid-cols-2">
            <SpendingTrend {budget} />
            <SpendingByCategory {budget} />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <BudgetProgress {budget} />
            <TopCategories {budget} />
          </div>
        </div>
      {/if}
    </Tabs.Content>

    <!-- Settings Tab -->
    <Tabs.Content value="settings" class="mt-6 flex-1 overflow-auto">
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Budget Information Section -->
        <div class="space-y-4">
          <h3
            class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            Budget Information
          </h3>
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
                  <Select.Item value="USD" label="USD ($)">USD ($)</Select.Item>
                  <Select.Item value="EUR" label="EUR (€)">EUR (€)</Select.Item>
                  <Select.Item value="GBP" label="GBP (£)">GBP (£)</Select.Item>
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
                  Changing currency will convert all amounts using live exchange
                  rates
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
                <Select.Trigger id="dateformat-desktop" class="w-full max-w-xs">
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
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
