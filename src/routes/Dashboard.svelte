<script lang="ts">
  import type { Budget, Expense } from "$lib/types";
  import { budgetStore } from "$lib/stores/budget";
  import { formatCurrency } from "$lib/utils/format";
  import { getCategoryById } from "$lib/utils/categories";
  import * as Tabs from "$lib/components/ui/tabs";
  import ExpenseList from "./ExpenseList.svelte";
  import { toast } from "svelte-sonner";

  let { budget }: { budget: Budget } = $props();

  let activeTab = $state("overview");

  // Calculate total spending
  let totalSpent = $derived(
    budget.entries.reduce((sum, entry) => sum + entry.amount, 0)
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
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-3xl font-bold">{budget.name}</h1>
    <p class="text-muted-foreground">
      Track your expenses and manage your budget
    </p>
  </div>

  <!-- Tabs Navigation -->
  <Tabs.Root bind:value={activeTab}>
    <Tabs.List class="grid w-full grid-cols-2 max-w-md">
      <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
      <Tabs.Trigger value="expenses">Expenses</Tabs.Trigger>
    </Tabs.List>

    <!-- Overview Tab -->
    <Tabs.Content value="overview" class="mt-6">
      <div class="space-y-6">
        <div class="text-center py-12">
          <div class="text-5xl font-bold mb-2">
            {formatCurrency(totalSpent, budget.currency)}
          </div>
          <p class="text-muted-foreground text-lg">Total Spent</p>
          <p class="text-sm text-muted-foreground mt-4">
            {budget.entries.length} {budget.entries.length === 1 ? "expense" : "expenses"} • {budget.categories.length} {budget.categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
      </div>
    </Tabs.Content>

    <!-- Expenses Tab -->
    <Tabs.Content value="expenses" class="mt-6">
      <ExpenseList
        expenses={budget.entries}
        categories={budget.categories}
        currency={budget.currency}
        onAdd={handleAddExpense}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />
    </Tabs.Content>
  </Tabs.Root>
</div>
