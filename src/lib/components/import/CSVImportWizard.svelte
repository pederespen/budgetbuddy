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

    // Initialize pattern-category map (empty - user must assign categories)
    patternCategoryMap = new Map();
    for (const group of patternGroups) {
      patternCategoryMap.set(group.pattern, null);
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
    patternCategoryMap.set(pattern, category);
    // Force reactivity by creating a new Map
    patternCategoryMap = new Map(patternCategoryMap);
  }

  function handleAddCategory(category: Category) {
    categories = [...categories, category];
  }

  function handleUpdateCategory(
    categoryId: string,
    updates: Partial<Category>
  ) {
    categories = categories.map((c) =>
      c.id === categoryId ? { ...c, ...updates } : c
    );
  }

  function handleDeleteCategory(categoryId: string) {
    categories = categories.filter((c) => c.id !== categoryId);
    // Clear any pattern mappings that used this category
    patternCategoryMap.forEach((cat, pattern) => {
      if (cat?.id === categoryId) {
        patternCategoryMap.set(pattern, null);
      }
    });
    patternCategoryMap = new Map(patternCategoryMap);
  }

  function handleImport() {
    // Convert to Transaction format
    const transactions: Transaction[] = parsedTransactions.map((t) => {
      const assignedCategory = patternCategoryMap.get(t.pattern);

      // If no category assigned, find Uncategorized (works for both income and expense)
      let categoryId = assignedCategory?.id;
      if (!categoryId) {
        const uncategorized = categories.find(
          (c) => c.name === "Uncategorized"
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

    // Remove duplicate categories (same name + type)
    const uniqueCategories = categories.reduce((acc, category) => {
      const isDuplicate = acc.some(
        (c) => c.name === category.name && c.type === category.type
      );
      if (!isDuplicate) {
        acc.push(category);
      }
      return acc;
    }, [] as Category[]);

    dispatch("import", { transactions, categories: uniqueCategories });
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

  function goBack() {
    if (currentStep === "preview") {
      currentStep = "upload";
    } else if (currentStep === "internal") {
      currentStep = "preview";
    } else if (currentStep === "review") {
      currentStep = "internal";
    }
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

<div class="bg-background flex flex-col" style="height: calc(100vh - 4rem);">
  <div class="border-b flex-shrink-0">
    <div class="container mx-auto px-4 py-2">
      <h1 class="text-xl font-bold">Import Transactions from CSV</h1>
    </div>
  </div>

  <div class="container mx-auto px-4 py-4 flex-1 flex flex-col overflow-hidden">
    {#if currentStep === "upload"}
      <div class="flex-1 flex items-center justify-center">
        <Card class="w-full max-w-2xl">
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
            <div class="mt-4 flex justify-start">
              <Button variant="ghost" onclick={handleClose} class="gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}

    {#if currentStep === "preview" && allCsvData.length > 0 && columnMapping}
      <div class="flex-1 flex flex-col min-h-0">
        <Card class="flex-1 flex flex-col overflow-hidden">
          <CardHeader class="pb-3 flex-shrink-0">
            <CardTitle class="text-lg">Preview & Confirm</CardTitle>
          </CardHeader>
          <CardContent
            class="flex-1 flex flex-col overflow-hidden sm:overflow-hidden overflow-y-auto sm:overflow-y-hidden"
          >
            <div
              class="flex-shrink-0 space-y-2 sm:overflow-y-auto sm:max-h-[30vh] lg:max-h-none"
            >
              <div
                class="space-y-2 sm:border sm:rounded-lg sm:p-3 sm:bg-muted/50"
              >
                <p class="text-xs font-medium">Column Mapping</p>
                <p class="text-xs text-muted-foreground">
                  Confirm which columns contain the required data:
                </p>

                <div
                  class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2"
                >
                  <div class="space-y-1">
                    <Label for="date-column" class="text-xs"
                      >Date Column *</Label
                    >
                    <Select.Root type="single" bind:value={columnMapping.date}>
                      <Select.Trigger
                        id="date-column"
                        class="text-xs bg-background h-8"
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

                  <div class="space-y-1">
                    <Label for="description-column" class="text-xs"
                      >Description Column *</Label
                    >
                    <Select.Root
                      type="single"
                      bind:value={columnMapping.description}
                    >
                      <Select.Trigger
                        id="description-column"
                        class="text-xs bg-background h-8"
                      >
                        <span
                          >{columnMapping.description || "Select column"}</span
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

                  <div class="space-y-1">
                    <Label for="amount-in-column" class="text-xs"
                      >Amount In Column *</Label
                    >
                    <Select.Root
                      type="single"
                      bind:value={columnMapping.amountIn}
                    >
                      <Select.Trigger
                        id="amount-in-column"
                        class="text-xs bg-background h-8"
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

                  <div class="space-y-1">
                    <Label for="amount-out-column" class="text-xs"
                      >Amount Out Column *</Label
                    >
                    <Select.Root
                      type="single"
                      bind:value={columnMapping.amountOut}
                    >
                      <Select.Trigger
                        id="amount-out-column"
                        class="text-xs bg-background h-8"
                      >
                        <span>{columnMapping.amountOut || "Select column"}</span
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
                </div>
              </div>

              <div class="border-t my-4"></div>

              {#if allCsvData.length > 1}
                <div class="flex items-center justify-between gap-4 pb-2 pt-2">
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

              <div class="grid grid-cols-2 gap-2 text-xs pt-2">
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
                    Showing first 8 of {allCsvData[selectedPreviewIndex].preview
                      .totalRows} rows
                    {#if allCsvData.length === 1}in file{/if}
                  </p>
                </div>
              </div>
            </div>

            <!-- Mobile: Single scrollable section with table -->
            <div class="block sm:hidden space-y-3">
              <div class="pt-3">
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
                              class="px-3 py-1.5 text-left font-medium text-xs whitespace-nowrap"
                              >{header}</th
                            >
                          {/each}
                        </tr>
                      </thead>
                      <tbody>
                        {#each getCSVPreview(allCsvData[selectedPreviewIndex].preview, 8).rows as row}
                          <tr class="border-t">
                            {#each allCsvData[selectedPreviewIndex].preview.headers as header}
                              <td class="px-3 py-1.5 text-xs whitespace-nowrap"
                                >{row[header] || ""}</td
                              >
                            {/each}
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Desktop: Separate scrollable table section -->
            <div class="relative flex-1 min-h-0 hidden sm:block">
              <div class="relative h-full">
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
                  class="overflow-x-auto overflow-y-auto border rounded-lg h-full"
                >
                  <table class="w-full text-sm">
                    <thead class="bg-muted">
                      <tr>
                        {#each allCsvData[selectedPreviewIndex].preview.headers as header}
                          <th
                            class="px-3 py-1.5 text-left font-medium text-xs whitespace-nowrap"
                            >{header}</th
                          >
                        {/each}
                      </tr>
                    </thead>
                    <tbody>
                      {#each getCSVPreview(allCsvData[selectedPreviewIndex].preview, 8).rows as row}
                        <tr class="border-t">
                          {#each allCsvData[selectedPreviewIndex].preview.headers as header}
                            <td class="px-3 py-1.5 text-xs whitespace-nowrap"
                              >{row[header] || ""}</td
                            >
                          {/each}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
          <div class="border-t px-4 pt-4 flex-shrink-0">
            <div class="flex justify-between gap-2">
              <Button variant="ghost" onclick={goBack} class="gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </Button>
              <Button onclick={confirmPreview}>Continue</Button>
            </div>
          </div>
        </Card>
      </div>
    {/if}

    {#if currentStep === "internal"}
      <div class="flex-1 flex flex-col min-h-0">
        <Card class="flex flex-col flex-1 overflow-hidden">
          <CardHeader class="pb-3 flex-shrink-0">
            <CardTitle>Review Internal Transfers</CardTitle>
            <CardDescription>
              We detected {potentialInternalTransfers.length} potential internal
              transfer{potentialInternalTransfers.length !== 1 ? "s" : ""} (matching
              amounts on the same date). Select which ones to exclude from your budget.
            </CardDescription>
          </CardHeader>
          <CardContent class="flex-1 overflow-y-auto overflow-hidden">
            <div class="space-y-3 h-full overflow-y-auto">
              {#each potentialInternalTransfers as group}
                <div class="border rounded-lg p-3 sm:p-4">
                  <div class="flex items-start gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      bind:checked={group.shouldRemove}
                      class="cursor-pointer mt-1 flex-shrink-0"
                      id="transfer-{group.id}"
                    />
                    <label
                      for="transfer-{group.id}"
                      class="flex-1 cursor-pointer min-w-0"
                    >
                      <div class="font-medium mb-2 text-sm sm:text-base">
                        {formatCurrency(group.transactions[0].amount, "NOK")} on
                        {group.transactions[0].date}
                      </div>
                      <div
                        class="space-y-1 text-xs sm:text-sm text-muted-foreground"
                      >
                        {#each group.transactions as transaction}
                          <div class="flex items-start gap-2">
                            <span
                              class="text-base sm:text-lg font-semibold flex-shrink-0 leading-tight"
                              class:text-green-600={transaction.isIncome}
                              class:text-red-600={!transaction.isIncome}
                            >
                              {transaction.isIncome ? "+" : "−"}
                            </span>
                            <div class="break-words flex-1 min-w-0">
                              <span>{transaction.description}</span>
                              <span class="text-xs block sm:inline sm:ml-1"
                                >({transaction.sourceFile})</span
                              >
                            </div>
                          </div>
                        {/each}
                      </div>
                    </label>
                  </div>
                </div>
              {/each}
            </div>
          </CardContent>
          <div class="border-t px-4 pt-4 flex-shrink-0">
            <div class="flex justify-between gap-2">
              <Button variant="ghost" onclick={goBack} class="gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </Button>
              <Button onclick={confirmInternalTransfers}>
                Continue with {potentialInternalTransfers.filter(
                  (g) => g.shouldRemove
                ).length} excluded
              </Button>
            </div>
          </div>
        </Card>
      </div>
    {/if}

    {#if currentStep === "review"}
      <div class="flex-1 flex flex-col min-h-0">
        <Card class="flex flex-col flex-1 overflow-hidden">
          <CardHeader class="pb-3 flex-shrink-0 hidden sm:block">
            <div
              class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
            >
              <div class="min-w-0 flex-1">
                <CardTitle class="text-lg sm:text-xl"
                  >Review & Categorize Patterns</CardTitle
                >
                <CardDescription class="text-xs sm:text-sm">
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
                class="flex-shrink-0 text-sm"
              >
                Manage Categories
              </Button>
            </div>
          </CardHeader>
          <CardContent
            class="flex-1 overflow-hidden flex flex-col sm:space-y-3"
          >
            <!-- Mobile: Everything scrolls together -->
            <div class="flex-1 overflow-y-auto sm:hidden space-y-3 py-3">
              <div class="flex flex-col gap-3">
                <div class="min-w-0 flex-1">
                  <CardTitle class="text-lg"
                    >Review & Categorize Patterns</CardTitle
                  >
                  <CardDescription class="text-xs">
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
                  class="flex-shrink-0 text-sm w-full"
                >
                  Manage Categories
                </Button>
              </div>

              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p
                    class="font-medium text-green-900 dark:text-green-100 text-xs"
                  >
                    Categorized
                  </p>
                  <p
                    class="text-xl font-bold text-green-600 dark:text-green-400"
                  >
                    {categorizedCount}
                  </p>
                  <p class="text-xs text-green-700 dark:text-green-300">
                    patterns assigned
                  </p>
                </div>
                <div class="p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p
                    class="font-medium text-yellow-900 dark:text-yellow-100 text-xs"
                  >
                    Uncategorized
                  </p>
                  <p
                    class="text-xl font-bold text-yellow-600 dark:text-yellow-400"
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
            </div>

            <!-- Desktop: Stats fixed, patterns scroll -->
            <div
              class="hidden sm:grid grid-cols-2 gap-2 sm:gap-3 text-sm flex-shrink-0"
            >
              <div class="p-2 sm:p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p
                  class="font-medium text-green-900 dark:text-green-100 text-xs sm:text-sm"
                >
                  Categorized
                </p>
                <p
                  class="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400"
                >
                  {categorizedCount}
                </p>
                <p class="text-xs text-green-700 dark:text-green-300">
                  patterns assigned
                </p>
              </div>
              <div
                class="p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg"
              >
                <p
                  class="font-medium text-yellow-900 dark:text-yellow-100 text-xs sm:text-sm"
                >
                  Uncategorized
                </p>
                <p
                  class="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400"
                >
                  {uncategorizedCount}
                </p>
                <p class="text-xs text-yellow-700 dark:text-yellow-300">
                  patterns remaining
                </p>
              </div>
            </div>

            <div class="hidden sm:block flex-1 overflow-y-auto min-h-0">
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
            </div>
          </CardContent>
          <div class="border-t px-4 pt-4 flex-shrink-0">
            <div class="flex justify-between gap-2">
              <Button variant="ghost" onclick={goBack} class="gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </Button>
              <Button onclick={handleImport} class="text-sm sm:text-base">
                Import {totalTransactions} Transactions
              </Button>
            </div>
          </div>
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
