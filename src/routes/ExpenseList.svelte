<script lang="ts">
  import type { Expense, Currency, Category } from "$lib/types";
  import { getCategoryById } from "$lib/utils/categories";
  import { Button } from "$lib/components/ui/button";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table";
  import { Plus } from "lucide-svelte";
  import { parseDate } from "@internationalized/date";
  import type { DateValue } from "@internationalized/date";
  import ExpenseInlineForm from "./ExpenseInlineForm.svelte";
  import ExpenseRow from "./ExpenseRow.svelte";

  let {
    expenses,
    categories,
    currency,
    onAdd,
    onEdit,
    onDelete,
  }: {
    expenses: Expense[];
    categories: Category[];
    currency: Currency;
    onAdd: (expense: Expense) => void;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
  } = $props();

  let showNewExpenseRow = $state(false);
  let editingExpenseId = $state<string | null>(null);

  // Form state for new expense
  let newExpenseDate = $state<DateValue | undefined>(
    parseDate(new Date().toISOString().split("T")[0])
  );
  let newExpenseCategoryId = $state<string>("");
  let newExpenseAmount = $state<string>("");
  let newExpenseNote = $state<string>("");

  // Form state for editing expense
  let editExpenseDate = $state<DateValue | undefined>(undefined);
  let editExpenseCategoryId = $state<string>("");
  let editExpenseAmount = $state<string>("");
  let editExpenseNote = $state<string>("");

  // Sort expenses by date (newest first)
  let sortedExpenses = $derived(
    [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  function handleAddNew() {
    showNewExpenseRow = true;
    editingExpenseId = null;
    // Reset form
    newExpenseDate = parseDate(new Date().toISOString().split("T")[0]);
    newExpenseCategoryId = "";
    newExpenseAmount = "";
    newExpenseNote = "";
  }

  function handleCancelNew() {
    showNewExpenseRow = false;
  }

  function handleSaveNew() {
    if (!newExpenseCategoryId || !newExpenseAmount || !newExpenseDate) {
      alert("Please fill in date, category and amount");
      return;
    }

    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      date: newExpenseDate.toString(),
      categoryId: newExpenseCategoryId,
      amount,
      note: newExpenseNote.trim(),
    };

    onAdd(expense);
    showNewExpenseRow = false;
  }

  function handleStartEdit(expense: Expense) {
    editingExpenseId = expense.id;
    showNewExpenseRow = false;
    editExpenseDate = parseDate(expense.date);
    editExpenseCategoryId = expense.categoryId;
    editExpenseAmount = expense.amount.toString();
    editExpenseNote = expense.note;
  }

  function handleCancelEdit() {
    editingExpenseId = null;
  }

  function handleSaveEdit(expenseId: string) {
    if (!editExpenseCategoryId || !editExpenseAmount || !editExpenseDate) {
      alert("Please fill in date, category and amount");
      return;
    }

    const amount = parseFloat(editExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const expense: Expense = {
      id: expenseId,
      date: editExpenseDate.toString(),
      categoryId: editExpenseCategoryId,
      amount,
      note: editExpenseNote.trim(),
    };

    onEdit(expense);
    editingExpenseId = null;
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold">Expenses</h2>
    <Button size="sm" onclick={handleAddNew} disabled={showNewExpenseRow}>
      <Plus class="mr-2 h-4 w-4" />
      Add New
    </Button>
  </div>

  {#if sortedExpenses.length === 0 && !showNewExpenseRow}
    <div class="py-8 text-center text-muted-foreground">
      <p>No expenses yet. Click "Add New" to get started!</p>
    </div>
  {:else}
    <!-- Mobile View -->
    <div class="block sm:hidden">
      <!-- New Expense Form (Mobile) -->
      {#if showNewExpenseRow}
        <div class="mb-4 pb-4 border-b">
          <ExpenseInlineForm
            mode="new"
            {categories}
            {currency}
            bind:date={newExpenseDate}
            bind:categoryId={newExpenseCategoryId}
            bind:amount={newExpenseAmount}
            bind:note={newExpenseNote}
            onSave={handleSaveNew}
            onCancel={handleCancelNew}
            variant="card"
          />
        </div>
      {/if}

      <!-- Expenses List (Mobile) -->
      <div class="divide-y">
        {#each sortedExpenses as expense (expense.id)}
          {@const category = getCategoryById(categories, expense.categoryId)}

          {#if editingExpenseId === expense.id}
            <!-- Edit Mode (Mobile) -->
            <div class="py-4">
              <ExpenseInlineForm
                mode="edit"
                {categories}
                {currency}
                bind:date={editExpenseDate}
                bind:categoryId={editExpenseCategoryId}
                bind:amount={editExpenseAmount}
                bind:note={editExpenseNote}
                onSave={() => handleSaveEdit(expense.id)}
                onCancel={handleCancelEdit}
                variant="card"
              />
            </div>
          {:else}
            <!-- View Mode (Mobile) -->
            <ExpenseRow
              {expense}
              {category}
              {currency}
              onEdit={() => handleStartEdit(expense)}
              onDelete={() => onDelete(expense.id)}
              disabled={showNewExpenseRow}
              variant="card"
            />
          {/if}
        {/each}
      </div>
    </div>

    <!-- Desktop View -->
    <div class="hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Note</TableHead>
            <TableHead class="text-right">Amount</TableHead>
            <TableHead class="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- New Expense Row -->
          {#if showNewExpenseRow}
            <TableRow class="bg-muted/30">
              <ExpenseInlineForm
                mode="new"
                {categories}
                {currency}
                bind:date={newExpenseDate}
                bind:categoryId={newExpenseCategoryId}
                bind:amount={newExpenseAmount}
                bind:note={newExpenseNote}
                onSave={handleSaveNew}
                onCancel={handleCancelNew}
                variant="table"
              />
            </TableRow>
          {/if}

          <!-- Existing Expenses -->
          {#each sortedExpenses as expense (expense.id)}
            {@const category = getCategoryById(categories, expense.categoryId)}

            {#if editingExpenseId === expense.id}
              <!-- Edit Mode -->
              <TableRow class="bg-muted/30">
                <ExpenseInlineForm
                  mode="edit"
                  {categories}
                  {currency}
                  bind:date={editExpenseDate}
                  bind:categoryId={editExpenseCategoryId}
                  bind:amount={editExpenseAmount}
                  bind:note={editExpenseNote}
                  onSave={() => handleSaveEdit(expense.id)}
                  onCancel={handleCancelEdit}
                  variant="table"
                />
              </TableRow>
            {:else}
              <!-- View Mode -->
              <TableRow>
                <ExpenseRow
                  {expense}
                  {category}
                  {currency}
                  onEdit={() => handleStartEdit(expense)}
                  onDelete={() => onDelete(expense.id)}
                  disabled={showNewExpenseRow}
                  variant="table"
                />
              </TableRow>
            {/if}
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>
