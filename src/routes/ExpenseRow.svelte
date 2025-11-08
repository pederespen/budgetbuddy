<script lang="ts">
  import type { Expense, Category, Currency, DateFormat } from "$lib/types";
  import { formatCurrency, formatDate } from "$lib/utils/format";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Pencil, Trash2, MoreHorizontal } from "lucide-svelte";
  import * as LucideIcons from "lucide-svelte";

  let {
    expense,
    category,
    currency,
    dateFormat = "DD/MM/YYYY",
    onEdit,
    onDelete,
    disabled = false,
    variant = "table",
  }: {
    expense: Expense;
    category: Category | undefined;
    currency: Currency;
    dateFormat?: DateFormat;
    onEdit: () => void;
    onDelete: () => void;
    disabled?: boolean;
    variant?: "table" | "card";
  } = $props();

  const Icon = category ? (LucideIcons as any)[category.icon] : null;
</script>

{#if variant === "table"}
  <!-- Desktop Table Row: Category | Date | Note | Amount | Actions -->
  <td class="w-[200px]">
    <div class="flex items-center gap-2">
      {#if category && Icon}
        <div
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style="background-color: {category.color}20"
        >
          <Icon class="w-4 h-4" style="color: {category.color}" />
        </div>
      {/if}
      <span>{category?.name || "Unknown"}</span>
    </div>
  </td>
  <td class="w-[140px] font-medium">{formatDate(expense.date, dateFormat)}</td>
  <td class="truncate">
    {expense.note || ""}
  </td>
  <td class="text-right font-semibold w-[120px]">
    {formatCurrency(expense.amount, currency)}
  </td>
  <td class="text-right w-[80px]">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
          <MoreHorizontal class="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item onclick={onEdit} {disabled} class="cursor-pointer">
          <Pencil class="mr-2 h-4 w-4" />
          Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={onDelete} class="cursor-pointer">
          <Trash2 class="mr-2 h-4 w-4" />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </td>
{:else}
  <!-- Mobile Simple List -->
  <div class="flex items-center gap-3 py-3">
    <!-- Category Icon -->
    {#if category && Icon}
      <div
        class="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
      >
        <Icon class="w-5 h-5" style="color: {category.color}" />
      </div>
    {/if}

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="font-medium truncate">
        {expense.note || category?.name || "Unknown"}
      </div>
      <div class="text-sm text-muted-foreground">
        {formatDate(expense.date, dateFormat)}
      </div>
    </div>

    <!-- Amount -->
    <div class="text-right flex-shrink-0">
      <div class="font-semibold">
        {formatCurrency(expense.amount, currency)}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex-shrink-0">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={onEdit} {disabled} class="cursor-pointer">
            <Pencil class="mr-2 h-4 w-4" />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={onDelete} class="cursor-pointer">
            <Trash2 class="mr-2 h-4 w-4" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{/if}
