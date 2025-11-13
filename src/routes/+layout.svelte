<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.ico";
  import Header from "$lib/components/Header.svelte";
  import { onMount } from "svelte";
  import { themeStore } from "$lib/stores/theme";
  import { budgetStore } from "$lib/stores/budget";
  import { activeTabStore } from "$lib/stores/navigation";
  import type { Budget } from "$lib/types";

  let { children } = $props();

  let activeTab = $derived.by(() => $activeTabStore);

  $effect(() => {
    activeTabStore.set(activeTab);
  });

  let activeBudget: Budget | undefined = $derived(
    $budgetStore.budgets.find(
      (b: Budget) => b.id === $budgetStore.activeBudgetId
    )
  );

  // Initialize theme on mount
  onMount(() => {
    themeStore.init();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>BudgetBuddy - Privacy-First Budget Tracker</title>
  <meta
    name="description"
    content="Track your transactions privately. All data stays on your device."
  />
</svelte:head>

<div class="h-screen flex flex-col overflow-hidden">
  <Header bind:activeTab showTabs={!!activeBudget} />
  <div class="flex-1 overflow-hidden">
    {@render children()}
  </div>
</div>
