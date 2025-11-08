<script lang="ts">
  import type { Expense, Currency, Category } from "$lib/types";
  import { getCategoryById } from "$lib/utils/categories";
  import { exportAsJSON, exportAsCSV, exportAsXLSX } from "$lib/utils/export";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Select from "$lib/components/ui/select";
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
    FileJson,
    FileSpreadsheet,
    FileText,
    Search,
    Filter,
    X,
  } from "lucide-svelte";
  import { parseDate } from "@internationalized/date";
  import type { DateValue } from "@internationalized/date";
  import ExpenseInlineForm from "./ExpenseInlineForm.svelte";
  import ExpenseRow from "./ExpenseRow.svelte";
  import CategoryManager from "../budget/CategoryManager.svelte";
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

  // Filter and search state
  let searchQuery = $state("");
  let filterCategory = $state<string>("all");
  let showFilters = $state(false);

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

  // Filter and sort expenses
  let filteredAndSortedExpenses = $derived(() => {
    let filtered = expenses;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((expense) => {
        const category = getCategoryById(categories, expense.categoryId);
        const categoryName = category?.name.toLowerCase() || "";
        const note = expense.note.toLowerCase();
        return categoryName.includes(query) || note.includes(query);
      });
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((e) => e.categoryId === filterCategory);
    }

    // Sort
    return [...filtered].sort((a, b) => {
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
    });
  });

  // Get active filter count
  let activeFiltersCount = $derived(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (filterCategory !== "all") count++;
    return count;
  });

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

  function clearFilters() {
    searchQuery = "";
    filterCategory = "all";
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
<div class="mb-4">
  <div class="flex items-center justify-between gap-3">
    <h2 class="text-2xl font-bold">Expenses</h2>

    <div class="flex items-center gap-2">
      <!-- Desktop: Inline Filters -->
      {#if showFilters}
        <div class="hidden sm:flex items-center gap-2">
          <!-- Search -->
          <div class="w-[160px] relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Search..."
              bind:value={searchQuery}
              class="pl-8 h-8 text-sm bg-background placeholder:text-foreground/40"
            />
          </div>

          <!-- Category Filter -->
          <div class="w-[160px]">
            <Select.Root type="single" bind:value={filterCategory}>
              <Select.Trigger class="w-full !h-8 text-sm !py-1 bg-background">
                <span class="truncate">
                  {filterCategory === "all"
                    ? "All Categories"
                    : getCategoryById(categories, filterCategory)?.name ||
                      "All Categories"}
                </span>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all" label="All Categories">
                  All Categories
                </Select.Item>
                {#each categories as category}
                  <Select.Item value={category.id} label={category.name}>
                    {category.name}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      {/if}

      <!-- Filter/Clear Button -->
      {#if showFilters}
        <Button
          variant="outline"
          size="sm"
          onclick={() => {
            clearFilters();
            showFilters = false;
          }}
        >
          <X class="h-4 w-4 sm:mr-2" />
          <span class="hidden sm:inline">Clear</span>
        </Button>
      {:else}
        <Button
          variant="outline"
          size="sm"
          onclick={() => (showFilters = !showFilters)}
        >
          <Filter class="h-4 w-4 sm:mr-2" />
          <span class="hidden sm:inline">Filters</span>
        </Button>
      {/if}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="outline" size="sm">
            <Download class="h-4 w-4 sm:mr-2" />
            <span class="hidden sm:inline">Export</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item
            onclick={() => exportAsJSON(budget)}
            class="cursor-pointer"
          >
            <FileJson class="mr-2 h-4 w-4" />
            Export as JSON
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onclick={() => exportAsCSV(budget)}
            class="cursor-pointer"
          >
            <FileText class="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onclick={() => exportAsXLSX(budget)}
            class="cursor-pointer"
          >
            <FileSpreadsheet class="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
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

  <!-- Mobile: Collapsible Filters Section -->
  {#if showFilters}
    <div class="block sm:hidden p-4 bg-muted/50 rounded-lg space-y-3">
      <!-- Search -->
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Search expenses..."
          bind:value={searchQuery}
          class="pl-9"
        />
      </div>

      <!-- Category Filter -->
      <Select.Root type="single" bind:value={filterCategory}>
        <Select.Trigger class="w-full">
          <span>
            {filterCategory === "all"
              ? "All Categories"
              : getCategoryById(categories, filterCategory)?.name ||
                "All Categories"}
          </span>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all" label="All Categories">
            All Categories
          </Select.Item>
          {#each categories as category}
            <Select.Item value={category.id} label={category.name}>
              {category.name}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  {/if}
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
  {#if filteredAndSortedExpenses().length === 0 && !showNewExpenseRow}
    <div class="py-8 text-center text-muted-foreground">
      {#if activeFiltersCount() > 0}
        <p>No expenses match your filters.</p>
        <Button variant="link" onclick={clearFilters} class="mt-2">
          Clear filters
        </Button>
      {:else}
        <p>No expenses yet. Click "Add New" to get started!</p>
      {/if}
    </div>
  {:else}
    <!-- Mobile View -->
    <div class="block sm:hidden">
      <!-- Expenses List (Mobile) - No inline forms anymore -->
      <div class="divide-y">
        {#each filteredAndSortedExpenses() as expense (expense.id)}
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
          {#each filteredAndSortedExpenses() as expense (expense.id)}
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
