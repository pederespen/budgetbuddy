<script lang="ts">
  import type {
    Transaction,
    Currency,
    Category,
    TransactionType,
  } from "$lib/types";
  import { getCategoryById } from "$lib/utils/categories";
  import { exportAsJSON, exportAsCSV, exportAsXLSX } from "$lib/utils/export";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Select from "$lib/components/ui/select";
  import * as Tabs from "$lib/components/ui/tabs";
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
    Tags,
  } from "lucide-svelte";
  import { parseDate } from "@internationalized/date";
  import type { DateValue } from "@internationalized/date";
  import TransactionForm from "./TransactionForm.svelte";
  import TransactionRow from "./TransactionRow.svelte";
  import CategoryManager from "../budget/CategoryManager.svelte";
  import type { Budget } from "$lib/types";

  let {
    budget,
    transactions,
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
    transactions: Transaction[];
    categories: Category[];
    currency: Currency;
    onAdd: (transaction: Transaction) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
    onDeleteCategory: (categoryId: string) => void;
  } = $props();

  let showNewTransactionRow = $state(false);
  let editingTransactionId = $state<string | null>(null);
  let showCategoryManager = $state(false);
  let showMobileDialog = $state(false);
  let mobileDialogMode = $state<"new" | "edit">("new");
  let editingTransactionIdForMobile = $state<string>("");

  // Sorting state
  type SortColumn = "category" | "date" | "amount";
  type SortDirection = "asc" | "desc";
  let sortColumn = $state<SortColumn>("date");
  let sortDirection = $state<SortDirection>("desc");

  // Filter and search state
  let searchQuery = $state("");
  let filterCategory = $state<string>("all");
  let filterTransactionType = $state<"all" | TransactionType>("all");
  let showFilters = $state(false);

  // Form state for new transaction
  let newTransactionDate = $state<DateValue | undefined>(
    parseDate(new Date().toISOString().split("T")[0])
  );
  let newTransactionCategoryId = $state<string>("");
  let newTransactionAmount = $state<string>("");
  let newTransactionNote = $state<string>("");
  let newTransactionType = $state<TransactionType>("expense");

  // Form state for editing transaction
  let editTransactionDate = $state<DateValue | undefined>(undefined);
  let editTransactionCategoryId = $state<string>("");
  let editTransactionAmount = $state<string>("");
  let editTransactionNote = $state<string>("");
  let editTransactionType = $state<TransactionType>("expense");

  // Filter and sort transactions
  let filteredAndSortedTransactions = $derived(() => {
    let filtered = transactions;

    // Apply transaction type filter
    if (filterTransactionType !== "all") {
      filtered = filtered.filter((t) => t.type === filterTransactionType);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((transaction) => {
        const category = getCategoryById(categories, transaction.categoryId);
        const categoryName = category?.name.toLowerCase() || "";
        const note = transaction.note.toLowerCase();
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

  function handleDuplicate(transaction: Transaction) {
    const duplicatedTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0], // Today's date
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      note: transaction.note,
      type: transaction.type,
    };

    onAdd(duplicatedTransaction);
  }

  function handleAddNew() {
    showNewTransactionRow = true;
    editingTransactionId = null;
    // Reset form
    newTransactionDate = parseDate(new Date().toISOString().split("T")[0]);
    newTransactionCategoryId = "";
    newTransactionAmount = "";
    newTransactionNote = "";

    // For mobile, open dialog
    if (window.innerWidth < 640) {
      mobileDialogMode = "new";
      showMobileDialog = true;
      showNewTransactionRow = false;
    }
  }

  function handleCancelNew() {
    showNewTransactionRow = false;
    showMobileDialog = false;
  }

  function handleSaveNew() {
    if (
      !newTransactionCategoryId ||
      !newTransactionAmount ||
      !newTransactionDate
    ) {
      alert("Please fill in date, category and amount");
      return;
    }

    const amount = parseFloat(newTransactionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: newTransactionDate.toString(),
      categoryId: newTransactionCategoryId,
      amount,
      note: newTransactionNote.trim(),
      type: newTransactionType,
    };

    onAdd(transaction);
    showNewTransactionRow = false;
    showMobileDialog = false;
  }

  function handleStartEdit(transaction: Transaction) {
    editingTransactionId = transaction.id;
    showNewTransactionRow = false;
    // Handle both date-only strings (YYYY-MM-DD) and ISO timestamps
    const dateString = transaction.date.includes("T")
      ? transaction.date.split("T")[0]
      : transaction.date;
    editTransactionDate = parseDate(dateString);
    editTransactionCategoryId = transaction.categoryId;
    editTransactionAmount = transaction.amount.toString();
    editTransactionNote = transaction.note;
    editTransactionType = transaction.type;

    // For mobile, open dialog
    if (window.innerWidth < 640) {
      mobileDialogMode = "edit";
      showMobileDialog = true;
      editingTransactionIdForMobile = transaction.id;
      editingTransactionId = null; // Don't show inline on mobile
    }
  }

  function handleCancelEdit() {
    editingTransactionId = null;
    showMobileDialog = false;
  }

  function handleSaveEdit(transactionId: string) {
    if (
      !editTransactionCategoryId ||
      !editTransactionAmount ||
      !editTransactionDate
    ) {
      alert("Please fill in date, category and amount");
      return;
    }

    const amount = parseFloat(editTransactionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const transaction: Transaction = {
      id: transactionId,
      date: editTransactionDate.toString(),
      categoryId: editTransactionCategoryId,
      amount,
      note: editTransactionNote.trim(),
      type: editTransactionType,
    };

    onEdit(transaction);
    editingTransactionId = null;
    showMobileDialog = false;
  }
</script>

<!-- Mobile Dialog for Add/Edit -->
<Dialog.Root bind:open={showMobileDialog}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {mobileDialogMode === "new" ? "Add Transaction" : "Edit Transaction"}
      </Dialog.Title>
    </Dialog.Header>
    <div class="py-4">
      {#if mobileDialogMode === "new"}
        <TransactionForm
          mode="new"
          {categories}
          {currency}
          bind:date={newTransactionDate}
          bind:categoryId={newTransactionCategoryId}
          bind:amount={newTransactionAmount}
          bind:note={newTransactionNote}
          bind:transactionType={newTransactionType}
          onSave={handleSaveNew}
          onCancel={handleCancelNew}
          variant="card"
        />
      {:else}
        <TransactionForm
          mode="edit"
          {categories}
          {currency}
          bind:date={editTransactionDate}
          bind:categoryId={editTransactionCategoryId}
          bind:amount={editTransactionAmount}
          bind:note={editTransactionNote}
          bind:transactionType={editTransactionType}
          onSave={() => handleSaveEdit(editingTransactionIdForMobile)}
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
    <h2 class="text-2xl font-bold">Transactions</h2>

    <div class="flex items-center gap-2">
      <!-- Desktop: Inline Filters -->
      {#if showFilters}
        <div class="hidden sm:flex items-center gap-2">
          <!-- Search -->
          <div class="w-[140px] relative">
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

          <!-- Transaction Type Filter -->
          <div class="w-[110px]">
            <Select.Root type="single" bind:value={filterTransactionType}>
              <Select.Trigger class="w-full !h-8 text-sm !py-1 bg-background">
                <span class="truncate">
                  {filterTransactionType === "all"
                    ? "All Types"
                    : filterTransactionType === "income"
                      ? "Income"
                      : "Expenses"}
                </span>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all" label="All Types">
                  All Types
                </Select.Item>
                <Select.Item value="income" label="Income">Income</Select.Item>
                <Select.Item value="expense" label="Expenses">
                  Expenses
                </Select.Item>
              </Select.Content>
            </Select.Root>
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

      <Button
        variant="outline"
        size="sm"
        onclick={() => (showCategoryManager = true)}
      >
        <Tags class="h-4 w-4 sm:mr-2" />
        <span class="hidden sm:inline">Edit Categories</span>
      </Button>
      <Button size="sm" onclick={handleAddNew} disabled={showNewTransactionRow}>
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
          placeholder="Search transactions..."
          bind:value={searchQuery}
          class="pl-9"
        />
      </div>

      <!-- Transaction Type Filter -->
      <Select.Root type="single" bind:value={filterTransactionType}>
        <Select.Trigger class="w-full">
          <span>
            {filterTransactionType === "all"
              ? "All Types"
              : filterTransactionType === "income"
                ? "Income"
                : "Expenses"}
          </span>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all" label="All Types">All Types</Select.Item>
          <Select.Item value="income" label="Income">Income</Select.Item>
          <Select.Item value="expense" label="Expenses">Expenses</Select.Item>
        </Select.Content>
      </Select.Root>

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
  {transactions}
  bind:open={showCategoryManager}
  onAdd={onAddCategory}
  onUpdate={onUpdateCategory}
  onDelete={onDeleteCategory}
/>

<!-- Scrollable Content -->
<div class="flex-1 overflow-auto">
  {#if filteredAndSortedTransactions().length === 0 && !showNewTransactionRow}
    <div class="py-8 text-center text-muted-foreground">
      {#if activeFiltersCount() > 0}
        <p>No transactions match your filters.</p>
        <Button variant="link" onclick={clearFilters} class="mt-2">
          Clear filters
        </Button>
      {:else}
        <p>No transactions yet. Click "Add New" to get started!</p>
      {/if}
    </div>
  {:else}
    <!-- Mobile View -->
    <div class="block sm:hidden">
      <!-- Transactions List (Mobile) - No inline forms anymore -->
      <div class="divide-y">
        {#each filteredAndSortedTransactions() as transaction (transaction.id)}
          {@const category = getCategoryById(
            categories,
            transaction.categoryId
          )}
          <!-- View Mode (Mobile) -->
          <TransactionRow
            {transaction}
            {category}
            {currency}
            dateFormat={budget.dateFormat}
            onEdit={() => handleStartEdit(transaction)}
            onDelete={() => onDelete(transaction.id)}
            onDuplicate={() => handleDuplicate(transaction)}
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
            <TableHead class="w-[100px]">Type</TableHead>
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
          <!-- New Transaction Row -->
          {#if showNewTransactionRow}
            <TableRow class="bg-muted/30">
              <TransactionForm
                mode="new"
                {categories}
                {currency}
                bind:date={newTransactionDate}
                bind:categoryId={newTransactionCategoryId}
                bind:amount={newTransactionAmount}
                bind:note={newTransactionNote}
                bind:transactionType={newTransactionType}
                onSave={handleSaveNew}
                onCancel={handleCancelNew}
                variant="table"
              />
            </TableRow>
          {/if}

          <!-- Existing Transactions -->
          {#each filteredAndSortedTransactions() as transaction (transaction.id)}
            {@const category = getCategoryById(
              categories,
              transaction.categoryId
            )}

            {#if editingTransactionId === transaction.id}
              <!-- Edit Mode -->
              <TableRow class="bg-muted/30">
                <TransactionForm
                  mode="edit"
                  {categories}
                  {currency}
                  bind:date={editTransactionDate}
                  bind:categoryId={editTransactionCategoryId}
                  bind:amount={editTransactionAmount}
                  bind:note={editTransactionNote}
                  bind:transactionType={editTransactionType}
                  onSave={() => handleSaveEdit(transaction.id)}
                  onCancel={handleCancelEdit}
                  variant="table"
                />
              </TableRow>
            {:else}
              <!-- View Mode -->
              <TableRow class="h-12">
                <TransactionRow
                  {transaction}
                  {category}
                  {currency}
                  dateFormat={budget.dateFormat}
                  onEdit={() => handleStartEdit(transaction)}
                  onDelete={() => onDelete(transaction.id)}
                  onDuplicate={() => handleDuplicate(transaction)}
                  disabled={showNewTransactionRow}
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
