<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Category } from "$lib/types";
  import * as Select from "$lib/components/ui/select";
  import { formatCurrency } from "$lib/utils/format";
  import {
    TrendingUp,
    TrendingDown,
    HelpCircle,
    ChevronDown,
    ChevronUp,
  } from "lucide-svelte";
  import type { PatternGroup } from "$lib/utils/pattern-matcher";

  export let patternGroups: PatternGroup[];
  export let categories: Category[];
  export let patternCategoryMap: Map<string, Category | null>;

  const dispatch = createEventDispatcher<{
    patternCategoryChange: { pattern: string; category: Category | null };
  }>();

  let expandedPatterns = new Set<string>();

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
    <div class="border rounded-lg overflow-hidden">
      <div class="bg-muted px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div
            class="w-3 h-3 rounded-full flex-shrink-0"
            style="background-color: {getCategoryColor(
              patternCategoryMap.get(group.pattern)
            )}"
          ></div>
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
            value={patternCategoryMap.get(group.pattern)?.id || ""}
            onValueChange={(v: string | undefined) =>
              handleCategoryChange(group.pattern, v)}
          >
            <Select.Trigger class="w-full">
              <span
                >{patternCategoryMap.get(group.pattern)?.name ||
                  "Select category..."}</span
              >
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>Income</Select.Label>
                {#each categories.filter((c) => c.type === "income") as category}
                  <Select.Item value={category.id}>
                    <div class="flex items-center gap-2">
                      <div
                        class="w-3 h-3 rounded-full"
                        style="background-color: {category.color}"
                      ></div>
                      {category.name}
                    </div>
                  </Select.Item>
                {/each}
              </Select.Group>
              <Select.Group>
                <Select.Label>Expenses</Select.Label>
                {#each categories.filter((c) => c.type === "expense") as category}
                  <Select.Item value={category.id}>
                    <div class="flex items-center gap-2">
                      <div
                        class="w-3 h-3 rounded-full"
                        style="background-color: {category.color}"
                      ></div>
                      {category.name}
                    </div>
                  </Select.Item>
                {/each}
              </Select.Group>
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
  {/each}
</div>
