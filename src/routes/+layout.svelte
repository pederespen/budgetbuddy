<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.ico";
  import { Toaster } from "$lib/components/ui/sonner";
  import Header from "$lib/components/Header.svelte";
  import { onMount } from "svelte";
  import { themeStore } from "$lib/stores/theme";

  let { children } = $props();

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
    content="Track your expenses privately. All data stays on your device."
  />
</svelte:head>

<div class="h-screen flex flex-col overflow-hidden">
  <Header />
  <div class="flex-1 overflow-hidden">
    {@render children()}
  </div>
</div>
<Toaster position="top-right" />
