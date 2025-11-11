<script lang="ts">
  import type { Category, Currency, TransactionType } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import * as Popover from "$lib/components/ui/popover";
  import { Calendar } from "$lib/components/ui/calendar";
  import { Check, X, CalendarIcon } from "lucide-svelte";
  import * as LucideIcons from "lucide-svelte";
  import { cn } from "$lib/utils";
  import {
    DateFormatter,
    type DateValue,
    getLocalTimeZone,
  } from "@internationalized/date";
  import { currencySymbols } from "$lib/utils/format";

  let {
    mode = "new",
    categories,
    currency,
    date = $bindable(),
    categoryId = $bindable(),
    amount = $bindable(),
    note = $bindable(),
    transactionType = $bindable(),
    onSave,
    onCancel,
    variant = "table",
  }: {
    mode?: "new" | "edit";
    categories: Category[];
    currency: Currency;
    date: DateValue | undefined;
    categoryId: string;
    amount: string;
    note: string;
    transactionType: TransactionType;
    onSave: () => void;
    onCancel: () => void;
    variant?: "table" | "card";
  } = $props();

  const df = new DateFormatter("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const currencySymbol = currencySymbols[currency];

  let calendarOpen = $state(false);

  // Filter categories based on transaction type
  let filteredCategories = $derived(
    categories
      .filter((c) => c.type === transactionType)
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  // Reset categoryId if it doesn't match the transaction type
  $effect(() => {
    if (categoryId) {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      if (selectedCategory && selectedCategory.type !== transactionType) {
        categoryId = "";
      }
    }
  });

  // Close calendar when date is selected
  $effect(() => {
    if (date) {
      calendarOpen = false;
    }
  });

  function getCategoryById(categories: Category[], id: string) {
    return categories.find((c) => c.id === id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !calendarOpen) {
      e.preventDefault();
      // Check if all required fields are filled
      if (categoryId && date && amount && parseFloat(amount) > 0) {
        onSave();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }
</script>

{#if variant === "table"}
  <!-- Table Row Variant: Type | Category | Date | Note | Amount | Actions -->
  <td class="w-[100px]">
    <Select.Root type="single" bind:value={transactionType}>
      <Select.Trigger
        class="h-8 text-xs bg-card border-input w-full cursor-pointer"
      >
        <span>
          {transactionType === "income" ? "Income" : "Expense"}
        </span>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="income" label="Income">Income</Select.Item>
        <Select.Item value="expense" label="Expense">Expense</Select.Item>
      </Select.Content>
    </Select.Root>
  </td>
  <td class="w-[200px]">
    <Select.Root type="single" bind:value={categoryId}>
      <Select.Trigger
        class="h-8 text-xs bg-card border-input w-full cursor-pointer"
      >
        {#if categoryId}
          {@const cat = getCategoryById(categories, categoryId)}
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
        {#each filteredCategories as category}
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
  </td>
  <td class="w-[140px]">
    <Popover.Root bind:open={calendarOpen}>
      <Popover.Trigger
        class={cn(
          "w-full justify-between text-left font-normal flex h-8 items-center rounded-md border border-input bg-card px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer",
          !date && "text-muted-foreground"
        )}
      >
        <span
          >{date
            ? df.format(date.toDate(getLocalTimeZone()))
            : "Pick date"}</span
        >
        <CalendarIcon class="h-3 w-3" />
      </Popover.Trigger>
      <Popover.Content class="w-auto p-0" align="start">
        <Calendar type="single" bind:value={date} initialFocus />
      </Popover.Content>
    </Popover.Root>
  </td>
  <td>
    <Input
      type="text"
      bind:value={note}
      placeholder="Note"
      class="h-8 text-xs bg-card"
      onkeydown={handleKeydown}
    />
  </td>
  <td class="text-right w-[120px]">
    <div class="flex items-center gap-1.5">
      <Input
        type="number"
        step="0.01"
        min="0.01"
        bind:value={amount}
        placeholder="0.00"
        class="h-8 text-xs text-right bg-card flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        onkeydown={handleKeydown}
      />
      <span class="text-muted-foreground font-semibold">{currencySymbol}</span>
    </div>
  </td>
  <td class="text-right w-[80px]">
    <div class="flex justify-end gap-1">
      <Button variant="ghost" size="sm" onclick={onSave} class="h-8 w-8 p-0">
        <Check class="h-4 w-4 text-green-600" />
      </Button>
      <Button variant="ghost" size="sm" onclick={onCancel} class="h-8 w-8 p-0">
        <X class="h-4 w-4 text-red-600" />
      </Button>
    </div>
  </td>
{:else}
  <!-- Card Variant for Mobile -->
  <div class="space-y-4">
    <div class="space-y-3">
      <!-- Transaction Type -->
      <div>
        <Label class="text-sm font-medium mb-1.5 block">Type</Label>
        <Select.Root type="single" bind:value={transactionType}>
          <Select.Trigger class="h-10 bg-card cursor-pointer w-full">
            <span>
              {transactionType === "income" ? "Income" : "Expense"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="income" label="Income">Income</Select.Item>
            <Select.Item value="expense" label="Expense">Expense</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Category -->
      <div>
        <Label class="text-sm font-medium mb-1.5 block">Category</Label>
        <Select.Root type="single" bind:value={categoryId}>
          <Select.Trigger class="h-10 bg-card cursor-pointer w-full">
            {#if categoryId}
              {@const cat = getCategoryById(categories, categoryId)}
              {@const Icon = cat ? (LucideIcons as any)[cat.icon] : null}
              {#if cat}
                <div class="flex items-center gap-2">
                  <Icon class="w-5 h-5" style="color: {cat.color}" />
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
            {#each filteredCategories as category}
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
      </div>

      <!-- Date -->
      <div>
        <Label class="text-sm font-medium mb-1.5 block">Date</Label>
        <Popover.Root bind:open={calendarOpen}>
          <Popover.Trigger
            class={cn(
              "w-full justify-between text-left font-normal flex h-10 items-center rounded-md border border-input bg-card px-3 py-2 text-sm cursor-pointer",
              !date && "text-muted-foreground"
            )}
          >
            <span
              >{date
                ? df.format(date.toDate(getLocalTimeZone()))
                : "Pick date"}</span
            >
            <CalendarIcon class="h-4 w-4" />
          </Popover.Trigger>
          <Popover.Content class="w-auto p-0" align="start">
            <Calendar type="single" bind:value={date} initialFocus />
          </Popover.Content>
        </Popover.Root>
      </div>

      <!-- Amount -->
      <div>
        <Label class="text-sm font-medium mb-1.5 block">Amount</Label>
        <div class="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            bind:value={amount}
            placeholder="0.00"
            class="h-10 bg-card flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            onkeydown={handleKeydown}
          />
          <span class="text-muted-foreground font-semibold text-sm"
            >{currencySymbol}</span
          >
        </div>
      </div>

      <!-- Note -->
      <div>
        <Label class="text-sm font-medium mb-1.5 block">Note (optional)</Label>
        <Input
          type="text"
          bind:value={note}
          placeholder="Add a note..."
          class="h-10 bg-card"
          onkeydown={handleKeydown}
        />
      </div>
    </div>

    <div class="flex gap-2 pt-2">
      <Button
        variant="outline"
        size="default"
        onclick={onCancel}
        class="flex-1"
      >
        Cancel
      </Button>
      <Button size="default" onclick={onSave} class="flex-1">Save</Button>
    </div>
  </div>
{/if}
