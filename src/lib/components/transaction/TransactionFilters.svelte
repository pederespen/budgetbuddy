<script lang="ts">
  import type { Category } from "$lib/types";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Search } from "lucide-svelte";
  import * as LucideIcons from "lucide-svelte";
  import { getCategoryById } from "$lib/utils/categories";
  import type { Component } from "svelte";

  type IconComponent = Component;

  let {
    categories,
    searchQuery = $bindable(),
    filterCategory = $bindable(),
    filterTransactionType = $bindable(),
    variant = "desktop",
  }: {
    categories: Category[];
    searchQuery: string;
    filterCategory: string;
    filterTransactionType: "all" | "income" | "expense";
    variant?: "desktop" | "mobile";
  } = $props();
</script>

{#if variant === "desktop"}
  <!-- Desktop Inline Filters -->
  <div class="flex items-center gap-2">
    <!-- Search -->
    <div class="w-[140px] relative">
      <Search
        class="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
      />
      <Input
        type="text"
        placeholder="Search..."
        bind:value={searchQuery}
        class="pl-8 h-8 text-sm bg-card placeholder:text-foreground/40"
      />
    </div>

    <!-- Transaction Type Filter -->
    <div class="w-[110px]">
      <Select.Root type="single" bind:value={filterTransactionType}>
        <Select.Trigger class="w-full !h-8 text-sm !py-1 bg-card">
          <span class="truncate">
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
    </div>

    <!-- Category Filter -->
    <div class="w-[160px]">
      <Select.Root type="single" bind:value={filterCategory}>
        <Select.Trigger class="w-full !h-8 text-sm !py-1 bg-card">
          <span class="truncate flex items-center gap-1.5">
            {#if filterCategory === "all"}
              All Categories
            {:else}
              {@const selectedCat = getCategoryById(categories, filterCategory)}
              {#if selectedCat}
                {@const Icon = (
                  LucideIcons as unknown as Record<string, IconComponent>
                )[selectedCat.icon] as IconComponent}
                {#if Icon}
                  <Icon
                    class="h-3.5 w-3.5"
                    style="color: {selectedCat.color}"
                  />
                {/if}
                {selectedCat.name}
              {:else}
                All Categories
              {/if}
            {/if}
          </span>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all" label="All Categories"
            >All Categories</Select.Item
          >
          {#each [...categories].sort( (a, b) => a.name.localeCompare(b.name) ) as category (category.id)}
            {@const Icon = (
              LucideIcons as unknown as Record<string, IconComponent>
            )[category.icon] as IconComponent}
            <Select.Item value={category.id} label={category.name}>
              <div class="flex items-center gap-2">
                {#if Icon}
                  <Icon class="h-4 w-4" style="color: {category.color}" />
                {/if}
                {category.name}
              </div>
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </div>
{:else}
  <!-- Mobile Collapsible Filters -->
  <div class="p-4 bg-muted/50 rounded-lg space-y-3">
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
        <span class="flex items-center gap-2">
          {#if filterCategory === "all"}
            All Categories
          {:else}
            {@const selectedCat = getCategoryById(categories, filterCategory)}
            {#if selectedCat}
              {@const Icon = (
                LucideIcons as unknown as Record<string, IconComponent>
              )[selectedCat.icon] as IconComponent}
              {#if Icon}
                <Icon class="h-4 w-4" style="color: {selectedCat.color}" />
              {/if}
              {selectedCat.name}
            {:else}
              All Categories
            {/if}
          {/if}
        </span>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all" label="All Categories"
          >All Categories</Select.Item
        >
        {#each [...categories].sort( (a, b) => a.name.localeCompare(b.name) ) as category (category.id)}
          {@const Icon = (
            LucideIcons as unknown as Record<string, IconComponent>
          )[category.icon] as IconComponent}
          <Select.Item value={category.id} label={category.name}>
            <div class="flex items-center gap-2">
              {#if Icon}
                <Icon class="h-4 w-4" style="color: {category.color}" />
              {/if}
              {category.name}
            </div>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
{/if}
