<script lang="ts">
  import type { Expense, Currency, Category } from "$lib/types";
  import { getCategoryById } from "$lib/utils/categories";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table";
  import {
    Plus,
    Settings,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Download,
  } from "lucide-svelte";
  import { parseDate } from "@internationalized/date";
  import type { DateValue } from "@internationalized/date";
  import ExpenseInlineForm from "./ExpenseInlineForm.svelte";
  import ExpenseRow from "./ExpenseRow.svelte";
  import CategoryManager from "./CategoryManager.svelte";
  import type { Budget } from "$lib/types";

  let {
    budget,
    expenses,
    categories,
    currency,
    onAdd,
    onEdit,
    onDelete,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
  }: {
    budget: Budget;
    expenses: Expense[];
    categories: Category[];
    currency: Currency;
    onAdd: (expense: Expense) => void;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
    onDeleteCategory: (categoryId: string) => void;
  } = $props();

  let showNewExpenseRow = $state(false);
  let editingExpenseId = $state<string | null>(null);
  let showCategoryManager = $state(false);
  let showMobileDialog = $state(false);
  let mobileDialogMode = $state<"new" | "edit">("new");
  let editingExpenseIdForMobile = $state<string>("");

  // Sorting state
  type SortColumn = "category" | "date" | "amount";
  type SortDirection = "asc" | "desc";
  let sortColumn = $state<SortColumn>("date");
  let sortDirection = $state<SortDirection>("desc");

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
    [...expenses].sort((a, b) => {
      if (sortColumn === "date") {
        const comparison =
          new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDirection === "asc" ? comparison : -comparison;
      } else if (sortColumn === "amount") {
        const comparison = a.amount - b.amount;
        return sortDirection === "asc" ? comparison : -comparison;
      } else if (sortColumn === "category") {
        const catA = getCategoryById(categories, a.categoryId);
        const catB = getCategoryById(categories, b.categoryId);
        const nameA = catA?.name || "";
        const nameB = catB?.name || "";
        const comparison = nameA.localeCompare(nameB);
        return sortDirection === "asc" ? comparison : -comparison;
      }
      return 0;
    })
  );

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      // Toggle direction
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      // New column, default to ascending
      sortColumn = column;
      sortDirection = "asc";
    }
  }

  function getSortIcon(column: SortColumn) {
    if (sortColumn !== column) return ArrowUpDown;
    return sortDirection === "asc" ? ArrowUp : ArrowDown;
  }

  function handleExport() {
    const dataStr = JSON.stringify(
      { budgets: [budget], activeBudgetId: budget.id },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${budget.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleAddNew() {
    showNewExpenseRow = true;
    editingExpenseId = null;
    // Reset form
    newExpenseDate = parseDate(new Date().toISOString().split("T")[0]);
    newExpenseCategoryId = "";
    newExpenseAmount = "";
    newExpenseNote = "";

    // For mobile, open dialog
    if (window.innerWidth < 640) {
      mobileDialogMode = "new";
      showMobileDialog = true;
      showNewExpenseRow = false;
    }
  }

  function handleCancelNew() {
    showNewExpenseRow = false;
    showMobileDialog = false;
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
    showMobileDialog = false;
  }

  function handleStartEdit(expense: Expense) {
    editingExpenseId = expense.id;
    showNewExpenseRow = false;
    // Handle both date-only strings (YYYY-MM-DD) and ISO timestamps
    const dateString = expense.date.includes("T")
      ? expense.date.split("T")[0]
      : expense.date;
    editExpenseDate = parseDate(dateString);
    editExpenseCategoryId = expense.categoryId;
    editExpenseAmount = expense.amount.toString();
    editExpenseNote = expense.note;

    // For mobile, open dialog
    if (window.innerWidth < 640) {
      mobileDialogMode = "edit";
      showMobileDialog = true;
      editingExpenseIdForMobile = expense.id;
      editingExpenseId = null; // Don't show inline on mobile
    }
  }

  function handleCancelEdit() {
    editingExpenseId = null;
    showMobileDialog = false;
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
    showMobileDialog = false;
  }

  function handleDuplicate(expense: Expense) {
    const duplicatedExpense: Expense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0], // Today's date
      categoryId: expense.categoryId,
      amount: expense.amount,
      note: expense.note,
    };

    onAdd(duplicatedExpense);
  }
</script>

<!-- Mobile Dialog for Add/Edit -->
<Dialog.Root bind:open={showMobileDialog}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {mobileDialogMode === "new" ? "Add Expense" : "Edit Expense"}
      </Dialog.Title>
    </Dialog.Header>
    <div class="py-4">
      {#if mobileDialogMode === "new"}
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
      {:else}
        <ExpenseInlineForm
          mode="edit"
          {categories}
          {currency}
          bind:date={editExpenseDate}
          bind:categoryId={editExpenseCategoryId}
          bind:amount={editExpenseAmount}
          bind:note={editExpenseNote}
          onSave={() => handleSaveEdit(editingExpenseIdForMobile)}
          onCancel={handleCancelEdit}
          variant="card"
        />
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Header (Fixed) -->
<div class="flex items-center justify-between mb-4">
  <h2 class="text-2xl font-bold">Expenses</h2>
  <div class="flex gap-2">
    <Button variant="outline" size="sm" onclick={handleExport}>
      <Download class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">Export</span>
    </Button>
    <Button
      variant="outline"
      size="sm"
      onclick={() => (showCategoryManager = true)}
    >
      <Settings class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">Edit Categories</span>
    </Button>
    <Button size="sm" onclick={handleAddNew} disabled={showNewExpenseRow}>
      <Plus class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">Add New</span>
    </Button>
  </div>
</div>

<!-- Category Manager Dialog -->
<CategoryManager
  {categories}
  {expenses}
  bind:open={showCategoryManager}
  onAdd={onAddCategory}
  onUpdate={onUpdateCategory}
  onDelete={onDeleteCategory}
/>

<!-- Scrollable Content -->
<div class="flex-1 overflow-auto">
  {#if sortedExpenses.length === 0 && !showNewExpenseRow}
    <div class="py-8 text-center text-muted-foreground">
      <p>No expenses yet. Click "Add New" to get started!</p>
    </div>
  {:else}
    <!-- Mobile View -->
    <div class="block sm:hidden">
      <!-- Expenses List (Mobile) - No inline forms anymore -->
      <div class="divide-y">
        {#each sortedExpenses as expense (expense.id)}
          {@const category = getCategoryById(categories, expense.categoryId)}
          <!-- View Mode (Mobile) -->
          <ExpenseRow
            {expense}
            {category}
            {currency}
            dateFormat={budget.dateFormat}
            onEdit={() => handleStartEdit(expense)}
            onDelete={() => onDelete(expense.id)}
            onDuplicate={() => handleDuplicate(expense)}
            disabled={false}
            variant="card"
          />
        {/each}
      </div>
    </div>

    <!-- Desktop View -->
    <div class="hidden sm:block">
      <Table>
        <TableHeader class="sticky top-0 z-10 bg-background">
          <TableRow>
            {@const CategoryIcon = getSortIcon("category")}
            {@const DateIcon = getSortIcon("date")}
            {@const AmountIcon = getSortIcon("amount")}
            <TableHead>
              <button
                onclick={() => handleSort("category")}
                class="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                Category
                <CategoryIcon class="h-4 w-4" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onclick={() => handleSort("date")}
                class="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                Date
                <DateIcon class="h-4 w-4" />
              </button>
            </TableHead>
            <TableHead>Note</TableHead>
            <TableHead class="text-right">
              <button
                onclick={() => handleSort("amount")}
                class="flex items-center gap-1 hover:text-foreground transition-colors ml-auto cursor-pointer"
              >
                Amount
                <AmountIcon class="h-4 w-4" />
              </button>
            </TableHead>
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
              <TableRow class="h-12">
                <ExpenseRow
                  {expense}
                  {category}
                  {currency}
                  dateFormat={budget.dateFormat}
                  onEdit={() => handleStartEdit(expense)}
                  onDelete={() => onDelete(expense.id)}
                  onDuplicate={() => handleDuplicate(expense)}
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
