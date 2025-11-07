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
    dateStyle: "short",
  });

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
</script>

{#if variant === "table"}
  <!-- Table Row Variant: Category | Date | Note | Amount | Actions -->
  <td>
    <Select.Root type="single" bind:value={categoryId}>
      <Select.Trigger class="h-8 text-xs">
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
  <td>
    <Popover.Root bind:open={calendarOpen}>
      <Popover.Trigger
        class={cn(
          "w-full justify-start text-left font-normal flex h-8 items-center rounded-md border border-input bg-background px-2 py-1 text-xs",
          !date && "text-muted-foreground"
        )}
      >
        {date ? df.format(date.toDate(getLocalTimeZone())) : "Pick date"}
        <CalendarIcon class="ml-1 h-3 w-3" />
      </Popover.Trigger>
      <Popover.Content class="w-auto p-0" align="start">
        <Calendar bind:value={date} initialFocus />
      </Popover.Content>
    </Popover.Root>
  </td>
  <td>
    <Input
      type="text"
      bind:value={note}
      placeholder="Note (optional)"
      class="h-8 text-xs"
    />
  </td>
  <td class="text-right">
    <Input
      type="number"
      step="0.01"
      min="0.01"
      bind:value={amount}
      placeholder="0.00"
      class="h-8 text-xs text-right"
    />
  </td>
  <td class="text-right">
    <div class="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onclick={onSave}
        class="h-8 w-8 p-0"
      >
        <Check class="h-4 w-4 text-green-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onclick={onCancel}
        class="h-8 w-8 p-0"
      >
        <X class="h-4 w-4 text-red-600" />
      </Button>
    </div>
  </td>
{:else}
  <!-- Card Variant for Mobile -->
  <div class="rounded-lg border border-primary/50 bg-muted/30 p-3 space-y-3">
    <div class="font-medium text-sm">{mode === "new" ? "New Expense" : "Edit Expense"}</div>
    
    <div class="space-y-2">
      <Popover.Root bind:open={calendarOpen}>
        <Popover.Trigger
          class={cn(
            "w-full justify-start text-left font-normal flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm",
            !date && "text-muted-foreground"
          )}
        >
          {date ? df.format(date.toDate(getLocalTimeZone())) : "Pick date"}
          <CalendarIcon class="ml-2 h-4 w-4" />
        </Popover.Trigger>
        <Popover.Content class="w-auto p-0" align="start">
          <Calendar bind:value={date} initialFocus />
        </Popover.Content>
      </Popover.Root>

      <Select.Root type="single" bind:value={categoryId}>
        <Select.Trigger class="h-9">
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

      <Input
        type="number"
        step="0.01"
        min="0.01"
        bind:value={amount}
        placeholder="Amount"
        class="h-9"
      />

      <Input
        type="text"
        bind:value={note}
        placeholder="Note (optional)"
        class="h-9"
      />
    </div>

    <div class="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={onCancel}
        class="flex-1"
      >
        <X class="mr-1 h-3 w-3" />
        Cancel
      </Button>
      <Button
        size="sm"
        onclick={onSave}
        class="flex-1"
      >
        <Check class="mr-1 h-3 w-3" />
        Save
      </Button>
    </div>
  </div>
{/if}
