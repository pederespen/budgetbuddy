<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Category } from "$lib/types";
  import * as Select from "$lib/components/ui/select";
  import { formatCurrency } from "$lib/utils/format";
  import {
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronUp,
    ShoppingCart,
    Car,
    Tv,
    ShoppingBag,
    Receipt,
    Heart,
    Package,
    Home,
    Briefcase,
    Gift,
    Wallet,
    DollarSign,
  } from "lucide-svelte";
  import type { PatternGroup } from "$lib/utils/pattern-matcher";

  let {
    patternGroups,
    categories,
    patternCategoryMap,
  }: {
    patternGroups: PatternGroup[];
    categories: Category[];
    patternCategoryMap: Map<string, Category | null>;
  } = $props();

  const dispatch = createEventDispatcher<{
    patternCategoryChange: { pattern: string; category: Category | null };
  }>();

  let expandedPatterns = $state(new Set<string>());

  const iconMap: Record<string, any> = {
    ShoppingCart,
    Car,
    Tv,
    ShoppingBag,
    Receipt,
    Heart,
    Package,
    Home,
    Briefcase,
    Gift,
    Wallet,
    DollarSign,
  };

  function getIconComponent(iconName: string) {
    return iconMap[iconName] || Package;
  }

  function handleCategoryChange(pattern: string, value: string | undefined) {
    if (!value) {
      dispatch("patternCategoryChange", { pattern, category: null });
      return;
    }

    const category = categories.find((c) => c.id === value);
    if (category) {
      dispatch("patternCategoryChange", { pattern, category });
    }
  }

  function toggleExpanded(pattern: string) {
    if (expandedPatterns.has(pattern)) {
      expandedPatterns.delete(pattern);
    } else {
      expandedPatterns.add(pattern);
    }
    expandedPatterns = expandedPatterns; // Trigger reactivity
  }

  function getCategoryColor(category: Category | null | undefined): string {
    return category?.color || "#95a5a6";
  }
</script>

<div class="space-y-3">
  <div class="text-sm text-muted-foreground mb-4">
    <p class="font-medium mb-1">Review detected patterns</p>
    <p>
      We found {patternGroups.length} unique patterns. Assign categories to each
      pattern, and all matching transactions will be categorized automatically.
    </p>
  </div>

  {#each patternGroups as group (group.pattern)}
    {@const selectedCategory = patternCategoryMap.get(group.pattern)}
    {@const selectedCategoryId = selectedCategory?.id || ""}
    {#key selectedCategoryId}
      <div class="border rounded-lg overflow-hidden">
        <div class="bg-muted px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-medium truncate">{group.pattern}</h3>
                {#if group.isIncome}
                  <TrendingUp class="w-4 h-4 text-green-600 flex-shrink-0" />
                {:else}
                  <TrendingDown class="w-4 h-4 text-red-600 flex-shrink-0" />
                {/if}
              </div>
              <div
                class="flex items-center gap-3 text-xs text-muted-foreground mt-1"
              >
                <span
                  >{group.count} transaction{group.count !== 1 ? "s" : ""}</span
                >
                <span>•</span>
                <span>{formatCurrency(group.totalAmount, "NOK")}</span>
              </div>
            </div>
            <button
              onclick={() => toggleExpanded(group.pattern)}
              class="p-1 hover:bg-background rounded"
              type="button"
            >
              {#if expandedPatterns.has(group.pattern)}
                <ChevronUp class="w-4 h-4" />
              {:else}
                <ChevronDown class="w-4 h-4" />
              {/if}
            </button>
          </div>
          <div class="w-48 ml-4 flex-shrink-0">
            <Select.Root
              type="single"
              value={selectedCategoryId}
              onValueChange={(v: string | undefined) =>
                handleCategoryChange(group.pattern, v)}
            >
              <Select.Trigger class="w-full">
                <div class="flex items-center gap-2">
                  {#if selectedCategory}
                    {@const IconComponent = getIconComponent(
                      selectedCategory.icon
                    )}
                    <IconComponent
                      class="w-4 h-4"
                      style="color: {selectedCategory.color}"
                    />
                  {/if}
                  <span>{selectedCategory?.name || "Select category..."}</span>
                </div>
              </Select.Trigger>
              <Select.Content>
                {#if group.isIncome}
                  <Select.Group>
                    <Select.Label>Income</Select.Label>
                    {#each categories.filter((c) => c.type === "income") as category}
                      {@const IconComponent = getIconComponent(category.icon)}
                      <Select.Item value={category.id}>
                        <div class="flex items-center gap-2">
                          <IconComponent
                            class="w-4 h-4"
                            style="color: {category.color}"
                          />
                          {category.name}
                        </div>
                      </Select.Item>
                    {/each}
                  </Select.Group>
                {:else}
                  <Select.Group>
                    <Select.Label>Expenses</Select.Label>
                    {#each categories.filter((c) => c.type === "expense") as category}
                      {@const IconComponent = getIconComponent(category.icon)}
                      <Select.Item value={category.id}>
                        <div class="flex items-center gap-2">
                          <IconComponent
                            class="w-4 h-4"
                            style="color: {category.color}"
                          />
                          {category.name}
                        </div>
                      </Select.Item>
                    {/each}
                  </Select.Group>
                {/if}
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        {#if expandedPatterns.has(group.pattern)}
          <div class="px-4 py-3 bg-background border-t space-y-2">
            <p class="text-xs font-medium text-muted-foreground mb-2">
              Example transactions:
            </p>
            {#each group.descriptions as description}
              <div class="text-sm text-muted-foreground pl-4">
                • {description}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/key}
  {/each}
</div>
