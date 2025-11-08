<script lang="ts">
  import type { Budget, Expense, Category } from "$lib/types";
  import { budgetStore } from "$lib/stores/budget";
  import { formatCurrency } from "$lib/utils/format";
  import { getCategoryById } from "$lib/utils/categories";
  import * as Tabs from "$lib/components/ui/tabs";
  import ExpenseList from "./ExpenseList.svelte";
  import { toast } from "svelte-sonner";
  import { Home, Receipt, TrendingUp, Settings } from "lucide-svelte";

  let { budget }: { budget: Budget } = $props();

  let activeTab = $state("overview");

  // Calculate total spending
  let totalSpent = $derived(
    budget.entries.reduce((sum, entry) => sum + entry.amount, 0)
  );

  // Determine if over budget
  let isOverBudget = $derived(
    budget.totalLimit ? totalSpent > budget.totalLimit : false
  );

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
      <div class="space-y-6 p-4">
        <div class="text-center py-8">
          <div class="text-4xl font-bold mb-2">
            {formatCurrency(totalSpent, budget.currency)}
          </div>
          <p class="text-muted-foreground">Total Spent</p>

          {#if budget.totalLimit}
            <div class="mt-6">
              <p class="text-sm" class:text-destructive={isOverBudget}>
                {formatCurrency(totalSpent, budget.currency)} of {formatCurrency(
                  budget.totalLimit,
                  budget.currency
                )}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                {#if isOverBudget}
                  {formatCurrency(
                    totalSpent - budget.totalLimit,
                    budget.currency
                  )} over budget
                {:else}
                  {formatCurrency(
                    budget.totalLimit - totalSpent,
                    budget.currency
                  )} remaining
                {/if}
              </p>
            </div>
          {/if}

          <p class="text-sm text-muted-foreground mt-4">
            {budget.entries.length}
            {budget.entries.length === 1 ? "expense" : "expenses"} • {budget
              .categories.length}
            {budget.categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
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
        <h2 class="text-2xl font-bold mb-4">Insights</h2>
        <div class="text-center py-12 text-muted-foreground">
          <TrendingUp class="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Insights coming soon...</p>
        </div>
      </div>
    {:else if activeTab === "settings"}
      <!-- Settings Content -->
      <div class="p-1">
        <h2 class="text-2xl font-bold mb-4">Settings</h2>
        <div class="space-y-4">
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">Budget Name</h3>
            <p class="text-sm text-muted-foreground">{budget.name}</p>
          </div>
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">Currency</h3>
            <p class="text-sm text-muted-foreground">{budget.currency}</p>
          </div>
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">About</h3>
            <p class="text-sm text-muted-foreground">
              BudgetBuddy helps you track expenses and manage your budget
              efficiently.
            </p>
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
    <Tabs.List class="grid w-full grid-cols-4 max-w-2xl flex-shrink-0">
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
    <Tabs.Content value="overview" class="mt-6 flex-1 overflow-auto">
      <div class="space-y-6">
        <div class="text-center py-12">
          <div class="text-5xl font-bold mb-2">
            {formatCurrency(totalSpent, budget.currency)}
          </div>
          <p class="text-muted-foreground text-lg">Total Spent</p>

          {#if budget.totalLimit}
            <div class="mt-6 max-w-md mx-auto">
              <p class="text-sm" class:text-destructive={isOverBudget}>
                {formatCurrency(totalSpent, budget.currency)} of {formatCurrency(
                  budget.totalLimit,
                  budget.currency
                )}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                {#if isOverBudget}
                  {formatCurrency(
                    totalSpent - budget.totalLimit,
                    budget.currency
                  )} over budget
                {:else}
                  {formatCurrency(
                    budget.totalLimit - totalSpent,
                    budget.currency
                  )} remaining
                {/if}
              </p>
            </div>
          {/if}

          <p class="text-sm text-muted-foreground mt-4">
            {budget.entries.length}
            {budget.entries.length === 1 ? "expense" : "expenses"} • {budget
              .categories.length}
            {budget.categories.length === 1 ? "category" : "categories"}
          </p>
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
      <div class="text-center py-12 text-muted-foreground">
        <TrendingUp class="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p class="text-lg">Insights coming soon...</p>
      </div>
    </Tabs.Content>

    <!-- Settings Tab -->
    <Tabs.Content value="settings" class="mt-6 flex-1 overflow-auto">
      <div class="max-w-2xl mx-auto space-y-4">
        <div class="border rounded-lg p-6">
          <h3 class="font-semibold mb-2">Budget Name</h3>
          <p class="text-sm text-muted-foreground">{budget.name}</p>
        </div>
        <div class="border rounded-lg p-6">
          <h3 class="font-semibold mb-2">Currency</h3>
          <p class="text-sm text-muted-foreground">{budget.currency}</p>
        </div>
        <div class="border rounded-lg p-6">
          <h3 class="font-semibold mb-2">About</h3>
          <p class="text-sm text-muted-foreground">
            BudgetBuddy helps you track expenses and manage your budget
            efficiently.
          </p>
        </div>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
