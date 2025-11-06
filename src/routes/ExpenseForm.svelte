<script lang="ts">
  import type { Budget, Expense, Category } from "$lib/types";
  import { getCategoryById } from "$lib/utils/categories";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import * as Popover from "$lib/components/ui/popover";
  import { Calendar } from "$lib/components/ui/calendar";
  import { CalendarIcon } from "lucide-svelte";
  import * as LucideIcons from "lucide-svelte";
  import { cn } from "$lib/utils";
  import {
    DateFormatter,
    type DateValue,
    parseDate,
    today,
    getLocalTimeZone,
  } from "@internationalized/date";

  let {
    budget,
    expense = null,
    onSave,
    onClose,
  }: {
    budget: Budget;
    expense: Expense | null;
    onSave: (expense: Expense) => void;
    onClose: () => void;
  } = $props();

  const df = new DateFormatter("en-US", {
    dateStyle: "long",
  });

  // Convert date string to DateValue
  const initialDateString =
    expense?.date || new Date().toISOString().split("T")[0];
  let selectedDate = $state<DateValue | undefined>(
    parseDate(initialDateString)
  );

  let formData = $state({
    date: initialDateString,
    categoryId: expense?.categoryId || "",
    amount: expense?.amount?.toString() || "",
    note: expense?.note || "",
  });

  let selectedCategoryId = $state<string>(expense?.categoryId || "");

  // Update formData.date when selectedDate changes
  $effect(() => {
    if (selectedDate) {
      formData.date = selectedDate.toString();
    }
  });

  // Watch for changes to selectedCategoryId
  $effect(() => {
    if (selectedCategoryId) {
      formData.categoryId = selectedCategoryId;
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();

    if (!selectedCategoryId) {
      alert("Please select a category");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const expenseData: Expense = {
      id: expense?.id || crypto.randomUUID(),
      date: formData.date,
      categoryId: selectedCategoryId,
      amount: amount,
      note: formData.note.trim(),
    };

    onSave(expenseData);
  }
</script>

<Dialog open={true} onOpenChange={onClose}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
      <DialogDescription>
        {expense
          ? "Update the expense details below."
          : "Enter the details for your new expense."}
      </DialogDescription>
    </DialogHeader>

    <form onsubmit={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <Label>Date</Label>
        <Popover.Root>
          <Popover.Trigger
            class={cn(
              "w-full justify-between text-left font-normal flex h-9 items-center rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow]",
              !selectedDate && "text-muted-foreground"
            )}
          >
            {selectedDate
              ? df.format(selectedDate.toDate(getLocalTimeZone()))
              : "Pick a date"}
            <CalendarIcon class="ml-2 h-4 w-4" />
          </Popover.Trigger>
          <Popover.Content class="w-auto p-0" align="start">
            <Calendar bind:value={selectedDate} initialFocus />
          </Popover.Content>
        </Popover.Root>
      </div>

      <div class="space-y-2">
        <Label for="category">Category</Label>
        <Select.Root type="single" bind:value={selectedCategoryId}>
          <Select.Trigger id="category" class="w-full">
            <div class="flex items-center gap-2">
              {#if selectedCategoryId}
                {@const cat = getCategoryById(
                  budget.categories,
                  selectedCategoryId
                )}
                {#if cat}
                  <svelte:component
                    this={LucideIcons[cat.icon]}
                    class="w-5 h-5"
                    style="color: {cat.color}"
                  />
                  <span>{cat.name}</span>
                {:else}
                  <span>Select category</span>
                {/if}
              {:else}
                <span>Select category</span>
              {/if}
            </div>
          </Select.Trigger>
          <Select.Content class="max-h-[300px]">
            {#each budget.categories as category}
              <Select.Item value={category.id} label={category.name}>
                <div class="flex items-center gap-2">
                  <svelte:component
                    this={LucideIcons[category.icon]}
                    class="w-5 h-5 flex-shrink-0"
                    style="color: {category.color}"
                  />
                  <span>{category.name}</span>
                </div>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <Label for="amount">Amount ({budget.currency})</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          bind:value={formData.amount}
          placeholder="0.00"
          required
        />
      </div>

      <div class="space-y-2">
        <Label for="note">Note (optional)</Label>
        <Input
          id="note"
          type="text"
          bind:value={formData.note}
          placeholder="What was this for?"
        />
      </div>

      <div class="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onclick={onClose}
          class="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" class="flex-1">
          {expense ? "Update" : "Add"} Expense
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
