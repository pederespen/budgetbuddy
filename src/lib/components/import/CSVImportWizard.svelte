<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import {
    parseCSV,
    getCSVPreview,
    detectColumnMapping,
    type CSVPreview,
    type ColumnMapping,
    getDateRange,
    parseDate,
    parseAmount,
  } from "$lib/utils/csv-parser";
  import {
    shouldSkipTransaction,
    cleanNote,
    detectPatterns,
    getSuggestedCategoryName,
    type PatternGroup,
  } from "$lib/utils/pattern-matcher";
  import type { Category, Transaction } from "$lib/types";
  import { generateId } from "$lib/utils/id";
  import PatternReview from "./PatternReview.svelte";
  import CategoryManager from "$lib/components/budget/CategoryManager.svelte";
  import { formatCurrency } from "$lib/utils/format";
  import {
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
  } from "lucide-svelte";

  let { categories: initialCategories }: { categories: Category[] } = $props();

  const dispatch = createEventDispatcher<{
    cancel: void;
    import: { transactions: Transaction[]; categories: Category[] };
  }>();

  type Step = "upload" | "preview" | "mapping" | "internal" | "review";

  let currentStep = $state<Step>("upload");
  let categories = $state<Category[]>([...initialCategories]);
  let csvFiles = $state<File[]>([]);
  let allCsvData = $state<
    Array<{
      file: File;
      text: string;
      preview: CSVPreview;
      mapping: ColumnMapping;
    }>
  >([]);
  let columnMapping = $state<ColumnMapping | null>(null);
  let patternGroups = $state<PatternGroup[]>([]);
  let patternCategoryMap = $state<Map<string, Category | null>>(new Map());
  let previewTableContainer = $state<HTMLDivElement>();
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);
  let selectedPreviewIndex = $state(0);
  let showCategoryManager = $state(false);
  let parsedTransactions = $state<
    Array<{
      id: string;
      date: string;
      description: string;
      amountIn: number | null;
      amountOut: number | null;
      amount: number;
      isIncome: boolean;
      pattern: string;
      note: string;
      sourceFile: string;
    }>
  >([]);
  let potentialInternalTransfers = $state<
    Array<{
      id: string;
      transactions: typeof parsedTransactions;
      shouldRemove: boolean;
    }>
  >([]);
  let dateRange = $state<{ start: string; end: string } | null>(null);
  let fileInput = $state<HTMLInputElement>();

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (files.length === 0) return;

    csvFiles = files;
    processAllCSVFiles();
  }

  async function processAllCSVFiles() {
    allCsvData = [];

    for (const file of csvFiles) {
      try {
        const text = await readFileAsText(file);
        const preview = parseCSV(text);
        const mapping = detectColumnMapping(preview.headers);

        // Use detected mapping as initial suggestion, but allow user to change
        allCsvData.push({
          file,
          text,
          preview,
          mapping: mapping || {
            date: preview.headers[0] || "",
            description: preview.headers[1] || "",
            amountIn: preview.headers[2] || "",
            amountOut: preview.headers[3] || "",
          },
        });
      } catch (error) {
        alert(`Error processing ${file.name}: ${error}`);
        reset();
        return;
      }
    }

    // Use the first file's mapping as reference
    columnMapping = allCsvData[0].mapping;
    currentStep = "preview";
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file, "windows-1252");
    });
  }

  function confirmPreview() {
    if (allCsvData.length === 0 || !columnMapping) return;

    // Parse all transactions from all CSV files
    const tempTransactions = [];

    for (const csvData of allCsvData) {
      for (const row of csvData.preview.rows) {
        const description = row[csvData.mapping.description]?.trim() || "";

        if (!description) continue;

        const amountIn = parseAmount(row[csvData.mapping.amountIn] || "");
        const amountOut = parseAmount(row[csvData.mapping.amountOut] || "");

        const isIncome = amountIn !== null && amountIn > 0;
        const amount = isIncome ? amountIn : amountOut;

        if (amount === null || amount === 0) continue;

        const date = parseDate(row[csvData.mapping.date] || "");
        const cleanedNote = cleanNote(description);

        tempTransactions.push({
          id: generateId(),
          date,
          description,
          amount,
          isIncome,
          sourceFile: csvData.file.name,
        });
      }
    }

    // Detect potential internal transfers (same amount, same date)
    detectInternalTransfers(tempTransactions);

    // If potential internal transfers found, show them first
    if (potentialInternalTransfers.length > 0) {
      // Store transactions for later
      parsedTransactions = tempTransactions.map((t) => ({
        ...t,
        amountIn: t.isIncome ? t.amount : null,
        amountOut: !t.isIncome ? t.amount : null,
        pattern: "",
        note: cleanNote(t.description),
      }));

      currentStep = "internal";
      return;
    }

    // No internal transfers, proceed to pattern detection
    processTransactionsForReview(tempTransactions);
  }

  function detectInternalTransfers(
    transactions: Array<{
      id: string;
      date: string;
      amount: number;
      isIncome: boolean;
      description: string;
    }>
  ) {
    const transferGroups = new Map<string, typeof transactions>();

    // Group by date + amount
    for (const transaction of transactions) {
      const key = `${transaction.date}_${transaction.amount}`;
      if (!transferGroups.has(key)) {
        transferGroups.set(key, []);
      }
      transferGroups.get(key)!.push(transaction);
    }

    // Find groups with both income and expense (potential internal transfers)
    potentialInternalTransfers = [];
    for (const [key, group] of transferGroups) {
      if (group.length >= 2) {
        const hasIncome = group.some((t) => t.isIncome);
        const hasExpense = group.some((t) => !t.isIncome);

        // Only flag as internal transfer if it has both income and expense
        if (hasIncome && hasExpense) {
          potentialInternalTransfers.push({
            id: key,
            transactions: group as any,
            shouldRemove: true, // Default to removing
          });
        }
      }
    }
  }

  function processTransactionsForReview(
    tempTransactions: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      isIncome: boolean;
      sourceFile: string;
    }>
  ) {
    // Detect patterns from transactions
    patternGroups = detectPatterns(tempTransactions);

    // Initialize pattern-category map with suggestions
    patternCategoryMap = new Map();
    for (const group of patternGroups) {
      const suggestedName = getSuggestedCategoryName(
        group.pattern,
        group.isIncome
      );
      const suggestedCategory = suggestedName
        ? categories.find((c) => c.name === suggestedName) || null
        : null;
      patternCategoryMap.set(group.pattern, suggestedCategory);
    }

    // Store full transaction data
    parsedTransactions = tempTransactions.map((t) => ({
      ...t,
      amountIn: t.isIncome ? t.amount : null,
      amountOut: !t.isIncome ? t.amount : null,
      pattern:
        patternGroups.find((g) => g.transactionIds.includes(t.id))?.pattern ||
        "",
      note: cleanNote(t.description),
    }));

    // Get date range
    dateRange = getDateRange(
      parsedTransactions.map((t) => ({ [columnMapping!.date]: t.date })),
      columnMapping!.date
    );

    currentStep = "review";
  }

  function confirmInternalTransfers() {
    // Filter out transactions that should be removed
    const idsToRemove = new Set<string>();
    for (const group of potentialInternalTransfers) {
      if (group.shouldRemove) {
        group.transactions.forEach((t) => idsToRemove.add(t.id));
      }
    }

    const filteredTransactions = parsedTransactions.filter(
      (t) => !idsToRemove.has(t.id)
    );

    // Re-extract basic transaction info for pattern detection
    const tempTransactions = filteredTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      isIncome: t.isIncome,
      sourceFile: t.sourceFile,
    }));

    processTransactionsForReview(tempTransactions);
  }

  function handlePatternCategoryChange(
    pattern: string,
    category: Category | null
  ) {
    console.log("Pattern category change:", {
      pattern,
      category,
      currentMap: patternCategoryMap,
    });
    patternCategoryMap.set(pattern, category);
    // Force reactivity by creating a new Map
    patternCategoryMap = new Map(patternCategoryMap);
    console.log("Updated map:", patternCategoryMap);
  }

  function handleAddCategory(category: Category) {
    console.log("Adding category:", category);
    categories = [...categories, category];
    console.log("Categories after add:", categories);
  }

  function handleUpdateCategory(
    categoryId: string,
    updates: Partial<Category>
  ) {
    console.log("Updating category:", { categoryId, updates });
    categories = categories.map((c) =>
      c.id === categoryId ? { ...c, ...updates } : c
    );
    console.log("Categories after update:", categories);
  }

  function handleDeleteCategory(categoryId: string) {
    console.log("Deleting category:", categoryId);
    categories = categories.filter((c) => c.id !== categoryId);
    // Clear any pattern mappings that used this category
    patternCategoryMap.forEach((cat, pattern) => {
      if (cat?.id === categoryId) {
        patternCategoryMap.set(pattern, null);
      }
    });
    patternCategoryMap = new Map(patternCategoryMap);
    console.log("Categories after delete:", categories);
  }

  function handleImport() {
    // Convert to Transaction format
    const transactions: Transaction[] = parsedTransactions.map((t) => {
      const assignedCategory = patternCategoryMap.get(t.pattern);

      // If no category assigned, find Uncategorized for the correct type
      let categoryId = assignedCategory?.id;
      if (!categoryId) {
        const uncategorized = categories.find(
          (c) =>
            c.name === "Uncategorized" &&
            c.type === (t.isIncome ? "income" : "expense")
        );
        categoryId =
          uncategorized?.id ||
          categories.find((c) => c.type === (t.isIncome ? "income" : "expense"))
            ?.id ||
          categories[0].id;
      }

      return {
        id: t.id,
        date: t.date,
        categoryId,
        amount: t.amount,
        note: t.note,
        type: t.isIncome ? "income" : "expense",
      };
    });

    dispatch("import", { transactions, categories });
    reset();
  }

  function reset() {
    currentStep = "upload";
    csvFiles = [];
    allCsvData = [];
    columnMapping = null;
    parsedTransactions = [];
    patternGroups = [];
    patternCategoryMap = new Map();
    potentialInternalTransfers = [];
    dateRange = null;
    if (fileInput) fileInput.value = "";
  }

  function checkScrollPosition() {
    if (!previewTableContainer) return;
    const { scrollLeft, scrollWidth, clientWidth } = previewTableContainer;
    canScrollLeft = scrollLeft > 0;
    canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
  }

  function handleClose() {
    reset();
    dispatch("cancel");
  }

  let categorizedCount = $derived(
    patternGroups.filter(
      (g) =>
        patternCategoryMap.get(g.pattern) !== null &&
        patternCategoryMap.get(g.pattern) !== undefined
    ).length
  );
  let uncategorizedCount = $derived(patternGroups.length - categorizedCount);
  let totalTransactions = $derived(parsedTransactions.length);

  $effect(() => {
    if (previewTableContainer) {
      checkScrollPosition();
    }
  });

  // Sync column mapping changes to all CSV files
  $effect(() => {
    if (
      columnMapping &&
      columnMapping.date &&
      columnMapping.description &&
      columnMapping.amountIn &&
      columnMapping.amountOut
    ) {
      const mapping = columnMapping;
      allCsvData.forEach((csv) => {
        csv.mapping = {
          date: mapping.date,
          description: mapping.description,
          amountIn: mapping.amountIn,
          amountOut: mapping.amountOut,
        };
      });
    }
  });
</script>

<div class="min-h-screen bg-background">
  <div class="border-b">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" onclick={handleClose}>
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="text-2xl font-bold">Import Transactions from CSV</h1>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-4 py-8">
    {#if currentStep === "upload"}
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File(s)</CardTitle>
            <CardDescription>
              Select one or more bank statement CSV files. If you have multiple
              accounts, upload all files at once and we'll combine them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label for="csv-file">CSV File</Label>
              <input
                bind:this={fileInput}
                id="csv-file"
                type="file"
                accept=".csv"
                multiple
                onchange={handleFileSelect}
                class="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}

    {#if currentStep === "preview" && allCsvData.length > 0 && columnMapping}
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Preview & Confirm</CardTitle>
            <CardDescription>
              Review the files and data structure below.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            {#if allCsvData.length > 1}
              <div
                class="flex items-center justify-between gap-4 border-b pb-3"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onclick={() => {
                    selectedPreviewIndex = Math.max(
                      0,
                      selectedPreviewIndex - 1
                    );
                    if (previewTableContainer) {
                      checkScrollPosition();
                    }
                  }}
                  disabled={selectedPreviewIndex === 0}
                >
                  <ChevronLeft class="h-4 w-4" />
                </Button>

                <div class="text-center flex-1">
                  <p class="text-sm font-medium">
                    {allCsvData[selectedPreviewIndex].file.name}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    File {selectedPreviewIndex + 1} of {allCsvData.length}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onclick={() => {
                    selectedPreviewIndex = Math.min(
                      allCsvData.length - 1,
                      selectedPreviewIndex + 1
                    );
                    if (previewTableContainer) {
                      checkScrollPosition();
                    }
                  }}
                  disabled={selectedPreviewIndex === allCsvData.length - 1}
                >
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>
            {/if}

            <div class="grid grid-cols-2 gap-3 text-sm">
              {#if allCsvData.length === 1}
                <div>
                  <p class="text-muted-foreground">File</p>
                  <p class="font-medium">
                    {allCsvData[selectedPreviewIndex].file.name}
                  </p>
                </div>
              {/if}
              <div>
                <p class="text-muted-foreground">
                  Rows in {allCsvData.length > 1 ? "this" : ""} file
                </p>
                <p class="font-medium">
                  {allCsvData[selectedPreviewIndex].preview.totalRows}
                </p>
              </div>
            </div>

            <div class="space-y-3 border rounded-lg p-4 bg-muted/50">
              <p class="text-sm font-medium">Column Mapping</p>
              <p class="text-xs text-muted-foreground">
                Confirm which columns contain the required data:
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="space-y-1.5">
                  <Label for="date-column" class="text-xs">Date Column *</Label>
                  <Select.Root type="single" bind:value={columnMapping.date}>
                    <Select.Trigger
                      id="date-column"
                      class="text-xs bg-background"
                    >
                      <span>{columnMapping.date || "Select column"}</span>
                    </Select.Trigger>
                    <Select.Content>
                      {#each allCsvData[0].preview.headers as header}
                        <Select.Item value={header} label={header}
                          >{header}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>

                <div class="space-y-1.5">
                  <Label for="description-column" class="text-xs"
                    >Description Column *</Label
                  >
                  <Select.Root
                    type="single"
                    bind:value={columnMapping.description}
                  >
                    <Select.Trigger
                      id="description-column"
                      class="text-xs bg-background"
                    >
                      <span>{columnMapping.description || "Select column"}</span
                      >
                    </Select.Trigger>
                    <Select.Content>
                      {#each allCsvData[0].preview.headers as header}
                        <Select.Item value={header} label={header}
                          >{header}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>

                <div class="space-y-1.5">
                  <Label for="amount-in-column" class="text-xs"
                    >Amount In Column *</Label
                  >
                  <Select.Root
                    type="single"
                    bind:value={columnMapping.amountIn}
                  >
                    <Select.Trigger
                      id="amount-in-column"
                      class="text-xs bg-background"
                    >
                      <span>{columnMapping.amountIn || "Select column"}</span>
                    </Select.Trigger>
                    <Select.Content>
                      {#each allCsvData[0].preview.headers as header}
                        <Select.Item value={header} label={header}
                          >{header}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>

                <div class="space-y-1.5">
                  <Label for="amount-out-column" class="text-xs"
                    >Amount Out Column *</Label
                  >
                  <Select.Root
                    type="single"
                    bind:value={columnMapping.amountOut}
                  >
                    <Select.Trigger
                      id="amount-out-column"
                      class="text-xs bg-background"
                    >
                      <span>{columnMapping.amountOut || "Select column"}</span>
                    </Select.Trigger>
                    <Select.Content>
                      {#each allCsvData[0].preview.headers as header}
                        <Select.Item value={header} label={header}
                          >{header}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
            </div>

            <div class="relative">
              {#if canScrollLeft}
                <div
                  class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 flex items-center justify-start pointer-events-none"
                >
                  <ChevronLeft class="h-5 w-5 text-muted-foreground" />
                </div>
              {/if}
              {#if canScrollRight}
                <div
                  class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 flex items-center justify-end pointer-events-none"
                >
                  <ChevronRight class="h-5 w-5 text-muted-foreground" />
                </div>
              {/if}
              <div
                bind:this={previewTableContainer}
                onscroll={checkScrollPosition}
                class="overflow-x-auto border rounded-lg"
              >
                <table class="w-full text-sm">
                  <thead class="bg-muted">
                    <tr>
                      {#each allCsvData[selectedPreviewIndex].preview.headers as header}
                        <th
                          class="px-4 py-2 text-left font-medium text-xs whitespace-nowrap"
                          >{header}</th
                        >
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each getCSVPreview(allCsvData[selectedPreviewIndex].preview, 5).rows as row}
                      <tr class="border-t">
                        {#each allCsvData[selectedPreviewIndex].preview.headers as header}
                          <td class="px-4 py-2 text-xs whitespace-nowrap"
                            >{row[header] || ""}</td
                          >
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <Button variant="outline" onclick={reset}>Cancel</Button>
              <Button onclick={confirmPreview}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}

    {#if currentStep === "internal"}
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Review Internal Transfers</CardTitle>
            <CardDescription>
              We detected {potentialInternalTransfers.length} potential internal
              transfer{potentialInternalTransfers.length !== 1 ? "s" : ""} (matching
              amounts on the same date). Select which ones to exclude from your budget.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              {#each potentialInternalTransfers as group}
                <div class="border rounded-lg p-4">
                  <div class="flex items-start gap-3">
                    <input
                      type="checkbox"
                      bind:checked={group.shouldRemove}
                      class="mt-1"
                      id="transfer-{group.id}"
                    />
                    <label
                      for="transfer-{group.id}"
                      class="flex-1 cursor-pointer"
                    >
                      <div class="font-medium mb-2">
                        {formatCurrency(group.transactions[0].amount, "NOK")} on
                        {group.transactions[0].date}
                      </div>
                      <div class="space-y-1 text-sm text-muted-foreground">
                        {#each group.transactions as transaction}
                          <div class="flex items-center gap-2">
                            {#if transaction.isIncome}
                              <TrendingUp class="w-4 h-4 text-green-600" />
                              <span class="text-green-600">Income:</span>
                            {:else}
                              <TrendingDown class="w-4 h-4 text-red-600" />
                              <span class="text-red-600">Expense:</span>
                            {/if}
                            <span>{transaction.description}</span>
                            <span class="text-xs"
                              >({transaction.sourceFile})</span
                            >
                          </div>
                        {/each}
                      </div>
                    </label>
                  </div>
                </div>
              {/each}

              <div class="flex justify-end gap-2 pt-4">
                <Button variant="outline" onclick={reset}>Cancel</Button>
                <Button onclick={confirmInternalTransfers}>
                  Continue with {potentialInternalTransfers.filter(
                    (g) => g.shouldRemove
                  ).length} excluded
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}

    {#if currentStep === "review"}
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <div class="flex items-start justify-between">
              <div>
                <CardTitle>Review & Categorize Patterns</CardTitle>
                <CardDescription>
                  {totalTransactions} transactions found in {patternGroups.length}
                  unique patterns
                  {#if dateRange}
                    from {dateRange.start} to {dateRange.end}
                  {/if}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onclick={() => (showCategoryManager = true)}
              >
                Manage Categories
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex gap-4 text-sm">
                <div
                  class="flex-1 p-3 bg-green-50 dark:bg-green-950 rounded-lg"
                >
                  <p class="font-medium text-green-900 dark:text-green-100">
                    Categorized
                  </p>
                  <p
                    class="text-2xl font-bold text-green-600 dark:text-green-400"
                  >
                    {categorizedCount}
                  </p>
                  <p class="text-xs text-green-700 dark:text-green-300">
                    patterns assigned
                  </p>
                </div>
                <div
                  class="flex-1 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg"
                >
                  <p class="font-medium text-yellow-900 dark:text-yellow-100">
                    Uncategorized
                  </p>
                  <p
                    class="text-2xl font-bold text-yellow-600 dark:text-yellow-400"
                  >
                    {uncategorizedCount}
                  </p>
                  <p class="text-xs text-yellow-700 dark:text-yellow-300">
                    patterns remaining
                  </p>
                </div>
              </div>

              <PatternReview
                {patternGroups}
                {categories}
                {patternCategoryMap}
                on:patternCategoryChange={(e) =>
                  handlePatternCategoryChange(
                    e.detail.pattern,
                    e.detail.category
                  )}
              />

              <div class="flex justify-end gap-2 pt-4">
                <Button variant="outline" onclick={reset}>Cancel</Button>
                <Button onclick={handleImport}>
                  Import {totalTransactions} Transactions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}
  </div>
</div>

<!-- Category Manager Dialog -->
<CategoryManager
  {categories}
  transactions={[]}
  bind:open={showCategoryManager}
  onAdd={handleAddCategory}
  onUpdate={handleUpdateCategory}
  onDelete={handleDeleteCategory}
/>
