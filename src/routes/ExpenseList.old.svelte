<script lang="ts">
  import type { Expense, Currency, Category } from "$lib/types";
  import { formatCurrency, formatDate } from "$lib/utils/format";
  import { getCategoryById } from "$lib/utils/categories";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table";
  import * as Select from "$lib/components/ui/select";
  import * as Popover from "$lib/components/ui/popover";
  import { Calendar } from "$lib/components/ui/calendar";
  import { Pencil, Trash2, Plus, Check, X, CalendarIcon } from "lucide-svelte";
  import * as LucideIcons from "lucide-svelte";
  import { cn } from "$lib/utils";
  import {
    DateFormatter,
    type DateValue,
    parseDate,
    getLocalTimeZone,
  } from "@internationalized/date";

  let {
    expenses,
    categories,
    currency,
    onEdit,
    onDelete,
    onAdd,
  }: {
    expenses: Expense[];
    categories: Category[];
    currency: Currency;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    onAdd: (expense: Expense) => void;
  } = $props();

  const df = new DateFormatter("en-US", {
    dateStyle: "short",
  });

  let showNewExpenseRow = $state(false);
  let editingExpenseId = $state<string | null>(null);
  
  // Separate calendar state for mobile and desktop views
  let newCalendarOpenMobile = $state(false);
  let newCalendarOpenDesktop = $state(false);
  let editCalendarOpenMobile = $state(false);
  let editCalendarOpenDesktop = $state(false);

  // Debug logging
  $effect(() => {
    console.log('Mobile - newCalendarOpen:', newCalendarOpenMobile);
  });

  $effect(() => {
    console.log('Desktop - newCalendarOpen:', newCalendarOpenDesktop);
  });

  $effect(() => {
    console.log('Mobile - editCalendarOpen:', editCalendarOpenMobile);
  });

  $effect(() => {
    console.log('Desktop - editCalendarOpen:', editCalendarOpenDesktop);
  });

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

  // Close calendar when date is selected
  $effect(() => {
    if (newExpenseDate) {
      newCalendarOpenMobile = false;
      newCalendarOpenDesktop = false;
    }
  });

  $effect(() => {
    if (editExpenseDate) {
      editCalendarOpenMobile = false;
      editCalendarOpenDesktop = false;
    }
  });

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

<Card>
  <CardHeader class="flex flex-row items-center justify-between">
    <CardTitle>Recent Expenses</CardTitle>
    <Button size="sm" onclick={handleAddNew} disabled={showNewExpenseRow}>
      <Plus class="mr-2 h-4 w-4" />
      Add New
    </Button>
  </CardHeader>
  <CardContent>
    {#if sortedExpenses.length === 0 && !showNewExpenseRow}
      <div class="py-8 text-center text-muted-foreground">
        <p>No expenses yet. Click "Add New" to get started!</p>
      </div>
    {:else}
      <!-- Mobile View -->
      <div class="block sm:hidden space-y-3">
        <!-- New Expense Card (Mobile) -->
        {#if showNewExpenseRow}
          <div class="rounded-lg border border-primary/50 bg-muted/30 p-3 space-y-3">
            <div class="font-medium text-sm">New Expense</div>
            
            <div class="space-y-2">
              <Popover.Root bind:open={newCalendarOpenMobile}>
                <Popover.Trigger
                  class={cn(
                    "w-full justify-start text-left font-normal flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm",
                    !newExpenseDate && "text-muted-foreground"
                  )}
                >
                  {newExpenseDate
                    ? df.format(newExpenseDate.toDate(getLocalTimeZone()))
                    : "Pick date"}
                  <CalendarIcon class="ml-2 h-4 w-4" />
                </Popover.Trigger>
                <Popover.Content class="w-auto p-0" align="start">
                  <Calendar bind:value={newExpenseDate} initialFocus />
                </Popover.Content>
              </Popover.Root>

              <Select.Root type="single" bind:value={newExpenseCategoryId}>
                <Select.Trigger class="h-9">
                  {#if newExpenseCategoryId}
                    {@const cat = getCategoryById(categories, newExpenseCategoryId)}
                    {@const Icon = cat ? (LucideIcons as any)[cat.icon] : null}
                    {#if cat}
                      <div class="flex items-center gap-2">
                        <Icon class="w-4 h-4" style="color: {cat.color}" />
                        <span>{cat.name}</span>
                      </div>
                    {:else}
                      <span>Select category</span>
                    {/if}
                  {:else}
                    <span>Select category</span>
                  {/if}
                </Select.Trigger>
                <Select.Content class="max-h-[200px]">
                  {#each categories as category}
                    {@const Icon = (LucideIcons as any)[category.icon]}
                    <Select.Item value={category.id} label={category.name}>
                      <div class="flex items-center gap-2">
                        <Icon class="w-4 h-4" style="color: {category.color}" />
                        <span>{category.name}</span>
                      </div>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>

              <Input
                type="number"
                step="0.01"
                min="0.01"
                bind:value={newExpenseAmount}
                placeholder="Amount"
                class="h-9"
              />

              <Input
                type="text"
                bind:value={newExpenseNote}
                placeholder="Note (optional)"
                class="h-9"
              />
            </div>

            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onclick={handleCancelNew}
                class="flex-1"
              >
                <X class="mr-1 h-3 w-3" />
                Cancel
              </Button>
              <Button
                size="sm"
                onclick={handleSaveNew}
                class="flex-1"
              >
                <Check class="mr-1 h-3 w-3" />
                Save
              </Button>
            </div>
          </div>
        {/if}

        <!-- Existing Expenses (Mobile) -->
        {#each sortedExpenses as expense (expense.id)}
          {@const category = getCategoryById(categories, expense.categoryId)}
          {@const Icon = category ? (LucideIcons as any)[category.icon] : null}
          
          {#if editingExpenseId === expense.id}
            <!-- Edit Mode (Mobile) -->
            <div class="rounded-lg border border-primary/50 bg-muted/30 p-3 space-y-3">
              <div class="font-medium text-sm">Edit Expense</div>
              
              <div class="space-y-2">
                <Popover.Root bind:open={editCalendarOpenMobile}>
                  <Popover.Trigger
                    class={cn(
                      "w-full justify-start text-left font-normal flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm",
                      !editExpenseDate && "text-muted-foreground"
                    )}
                  >
                    {editExpenseDate
                      ? df.format(editExpenseDate.toDate(getLocalTimeZone()))
                      : "Pick date"}
                    <CalendarIcon class="ml-2 h-4 w-4" />
                  </Popover.Trigger>
                  <Popover.Content class="w-auto p-0" align="start">
                    <Calendar bind:value={editExpenseDate} initialFocus />
                  </Popover.Content>
                </Popover.Root>

                <Select.Root type="single" bind:value={editExpenseCategoryId}>
                  <Select.Trigger class="h-9">
                    {#if editExpenseCategoryId}
                      {@const cat = getCategoryById(categories, editExpenseCategoryId)}
                      {@const EditIcon = cat ? (LucideIcons as any)[cat.icon] : null}
                      {#if cat}
                        <div class="flex items-center gap-2">
                          <EditIcon class="w-4 h-4" style="color: {cat.color}" />
                          <span>{cat.name}</span>
                        </div>
                      {:else}
                        <span>Select category</span>
                      {/if}
                    {:else}
                      <span>Select category</span>
                    {/if}
                  </Select.Trigger>
                  <Select.Content class="max-h-[200px]">
                    {#each categories as category}
                      {@const Icon = (LucideIcons as any)[category.icon]}
                      <Select.Item value={category.id} label={category.name}>
                        <div class="flex items-center gap-2">
                          <Icon class="w-4 h-4" style="color: {category.color}" />
                          <span>{category.name}</span>
                        </div>
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>

                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  bind:value={editExpenseAmount}
                  placeholder="Amount"
                  class="h-9"
                />

                <Input
                  type="text"
                  bind:value={editExpenseNote}
                  placeholder="Note (optional)"
                  class="h-9"
                />
              </div>

              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={handleCancelEdit}
                  class="flex-1"
                >
                  <X class="mr-1 h-3 w-3" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onclick={() => handleSaveEdit(expense.id)}
                  class="flex-1"
                >
                  <Check class="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>
            </div>
          {:else}
            <!-- View Mode (Mobile) -->
            <div class="rounded-lg border p-3 space-y-2">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 font-medium">
                    {#if category}
                      <Icon
                        class="w-5 h-5 flex-shrink-0"
                        style="color: {category.color}"
                      />
                    {/if}
                    <span>{category?.name || "Unknown"}</span>
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {formatDate(expense.date)}
                  </div>
                  {#if expense.note}
                    <div class="mt-1 text-sm text-muted-foreground">
                      {expense.note}
                    </div>
                  {/if}
                </div>
                <div class="text-right">
                  <div class="font-semibold">
                    {formatCurrency(expense.amount, currency)}
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => handleStartEdit(expense)}
                  disabled={showNewExpenseRow}
                  class="flex-1"
                >
                  <Pencil class="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => onDelete(expense.id)}
                  class="flex-1"
                >
                  <Trash2 class="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Desktop View -->
      <div class="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Note</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- New Expense Row -->
            {#if showNewExpenseRow}
              <TableRow class="bg-muted/30">
                <TableCell>
                  <Popover.Root bind:open={newCalendarOpenDesktop}>
                    <Popover.Trigger
                      class={cn(
                        "w-full justify-start text-left font-normal flex h-8 items-center rounded-md border border-input bg-background px-2 py-1 text-xs",
                        !newExpenseDate && "text-muted-foreground"
                      )}
                    >
                      {newExpenseDate
                        ? df.format(newExpenseDate.toDate(getLocalTimeZone()))
                        : "Pick date"}
                      <CalendarIcon class="ml-1 h-3 w-3" />
                    </Popover.Trigger>
                    <Popover.Content class="w-auto p-0" align="start">
                      <Calendar bind:value={newExpenseDate} initialFocus />
                    </Popover.Content>
                  </Popover.Root>
                </TableCell>
                <TableCell>
                  <Select.Root type="single" bind:value={newExpenseCategoryId}>
                    <Select.Trigger class="h-8 text-xs">
                      {#if newExpenseCategoryId}
                        {@const cat = getCategoryById(categories, newExpenseCategoryId)}
                        {@const Icon = cat ? (LucideIcons as any)[cat.icon] : null}
                        {#if cat}
                          <div class="flex items-center gap-1.5">
                            <Icon class="w-4 h-4" style="color: {cat.color}" />
                            <span>{cat.name}</span>
                          </div>
                        {:else}
                          <span>Select</span>
                        {/if}
                      {:else}
                        <span>Select</span>
                      {/if}
                    </Select.Trigger>
                    <Select.Content class="max-h-[200px]">
                      {#each categories as category}
                        {@const Icon = (LucideIcons as any)[category.icon]}
                        <Select.Item value={category.id} label={category.name}>
                          <div class="flex items-center gap-2">
                            <Icon class="w-4 h-4" style="color: {category.color}" />
                            <span>{category.name}</span>
                          </div>
                        </Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    bind:value={newExpenseNote}
                    placeholder="Note (optional)"
                    class="h-8 text-xs"
                  />
                </TableCell>
                <TableCell class="text-right">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    bind:value={newExpenseAmount}
                    placeholder="0.00"
                    class="h-8 text-xs text-right"
                  />
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={handleSaveNew}
                      class="h-8 w-8 p-0"
                    >
                      <Check class="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={handleCancelNew}
                      class="h-8 w-8 p-0"
                    >
                      <X class="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            {/if}

            <!-- Existing Expenses -->
            {#each sortedExpenses as expense (expense.id)}
              {@const category = getCategoryById(categories, expense.categoryId)}
              {@const Icon = category ? (LucideIcons as any)[category.icon] : null}
              
              {#if editingExpenseId === expense.id}
                <!-- Edit Mode -->
                <TableRow class="bg-muted/30">
                  <TableCell>
                    <Popover.Root bind:open={editCalendarOpenDesktop}>
                      <Popover.Trigger
                        class={cn(
                          "w-full justify-start text-left font-normal flex h-8 items-center rounded-md border border-input bg-background px-2 py-1 text-xs",
                          !editExpenseDate && "text-muted-foreground"
                        )}
                      >
                        {editExpenseDate
                          ? df.format(editExpenseDate.toDate(getLocalTimeZone()))
                          : "Pick date"}
                        <CalendarIcon class="ml-1 h-3 w-3" />
                      </Popover.Trigger>
                      <Popover.Content class="w-auto p-0" align="start">
                        <Calendar bind:value={editExpenseDate} initialFocus />
                      </Popover.Content>
                    </Popover.Root>
                  </TableCell>
                  <TableCell>
                    <Select.Root type="single" bind:value={editExpenseCategoryId}>
                      <Select.Trigger class="h-8 text-xs">
                        {#if editExpenseCategoryId}
                          {@const cat = getCategoryById(categories, editExpenseCategoryId)}
                          {@const EditIcon = cat ? (LucideIcons as any)[cat.icon] : null}
                          {#if cat}
                            <div class="flex items-center gap-1.5">
                              <EditIcon class="w-4 h-4" style="color: {cat.color}" />
                              <span>{cat.name}</span>
                            </div>
                          {:else}
                            <span>Select</span>
                          {/if}
                        {:else}
                          <span>Select</span>
                        {/if}
                      </Select.Trigger>
                      <Select.Content class="max-h-[200px]">
                        {#each categories as category}
                          {@const Icon = (LucideIcons as any)[category.icon]}
                          <Select.Item value={category.id} label={category.name}>
                            <div class="flex items-center gap-2">
                              <Icon class="w-4 h-4" style="color: {category.color}" />
                              <span>{category.name}</span>
                            </div>
                          </Select.Item>
                        {/each}
                      </Select.Content>
                    </Select.Root>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      bind:value={editExpenseNote}
                      placeholder="Note (optional)"
                      class="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell class="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      bind:value={editExpenseAmount}
                      placeholder="0.00"
                      class="h-8 text-xs text-right"
                    />
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => handleSaveEdit(expense.id)}
                        class="h-8 w-8 p-0"
                      >
                        <Check class="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={handleCancelEdit}
                        class="h-8 w-8 p-0"
                      >
                        <X class="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              {:else}
                <!-- View Mode -->
                <TableRow>
                  <TableCell class="font-medium">{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      {#if category}
                        <Icon class="w-5 h-5" style="color: {category.color}" />
                      {/if}
                      <span>{category?.name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell class="max-w-xs truncate">
                    {expense.note || "-"}
                  </TableCell>
                  <TableCell class="text-right font-semibold">
                    {formatCurrency(expense.amount, currency)}
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => handleStartEdit(expense)}
                        disabled={showNewExpenseRow}
                      >
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => onDelete(expense.id)}
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              {/if}
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </CardContent>
</Card>
