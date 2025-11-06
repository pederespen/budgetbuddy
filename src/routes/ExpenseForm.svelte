<script lang="ts">
  import type { Budget, Expense } from "$lib/types";
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

  let formData = $state({
    date: expense?.date || new Date().toISOString().split("T")[0],
    category: expense?.category || budget.categories[0] || "",
    amount: expense?.amount?.toString() || "",
    note: expense?.note || "",
  });

  let selectedCategory = $state({
    value: formData.category,
    label: formData.category,
  });

  function handleSubmit(e: Event) {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const expenseData: Expense = {
      id: expense?.id || crypto.randomUUID(),
      date: formData.date,
      category: selectedCategory.value,
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
        <Label for="date">Date</Label>
        <Input id="date" type="date" bind:value={formData.date} required />
      </div>

      <div class="space-y-2">
        <Label for="category">Category</Label>
        <Select.Root
          selected={selectedCategory}
          onSelectedChange={(v) => {
            if (v) {
              selectedCategory = v;
            }
          }}
        >
          <Select.Trigger id="category" class="w-full">
            {selectedCategory.label}
          </Select.Trigger>
          <Select.Content>
            {#each budget.categories as category}
              <Select.Item value={category} label={category}>
                {category}
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
