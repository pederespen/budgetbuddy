<script lang="ts">
  import type { Category, Currency } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
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

  let {
    mode = "new",
    categories,
    currency,
    date = $bindable(),
    categoryId = $bindable(),
    amount = $bindable(),
    note = $bindable(),
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
    onSave: () => void;
    onCancel: () => void;
    variant?: "table" | "card";
  } = $props();

  const df = new DateFormatter("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const currencySymbols: Record<Currency, string> = {
    NOK: "kr",
    USD: "$",
    EUR: "€",
    GBP: "£",
    SEK: "kr",
    DKK: "kr",
  };

  const currencySymbol = currencySymbols[currency];

  let calendarOpen = $state(false);

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
      // Check if all required fields are filled
      if (categoryId && date && amount && parseFloat(amount) > 0) {
        onSave();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  }
</script>

{#if variant === "table"}
  <!-- Table Row Variant: Category | Date | Note | Amount | Actions -->
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
  <div class="rounded-lg border border-primary/50 bg-muted/30 p-3 space-y-3">
    <div class="font-medium text-sm">
      {mode === "new" ? "New Expense" : "Edit Expense"}
    </div>

    <div class="space-y-2">
      <!-- Date and Category on same row -->
      <div class="flex gap-2">
        <Popover.Root bind:open={calendarOpen}>
          <Popover.Trigger
            class={cn(
              "flex-1 justify-between text-left font-normal flex h-9 items-center rounded-md border border-input bg-card px-3 py-2 text-sm cursor-pointer",
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

        <Select.Root type="single" bind:value={categoryId}>
          <Select.Trigger class="h-9 bg-card cursor-pointer flex-1">
            {#if categoryId}
              {@const cat = getCategoryById(categories, categoryId)}
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
      </div>

      <!-- Amount and Note on same row -->
      <div class="flex gap-2">
        <div class="flex items-center gap-2 flex-1">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            bind:value={amount}
            placeholder="Amount"
            class="h-9 bg-card flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            onkeydown={handleKeydown}
          />
          <span class="text-muted-foreground font-semibold"
            >{currencySymbol}</span
          >
        </div>

        <Input
          type="text"
          bind:value={note}
          placeholder="Note"
          class="h-9 bg-card flex-1"
          onkeydown={handleKeydown}
        />
      </div>
    </div>

    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={onCancel} class="flex-1">
        <X class="mr-1 h-3 w-3" />
        Cancel
      </Button>
      <Button size="sm" onclick={onSave} class="flex-1">
        <Check class="mr-1 h-3 w-3" />
        Save
      </Button>
    </div>
  </div>
{/if}
