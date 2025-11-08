<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { Toaster } from "$lib/components/ui/sonner";
  import Header from "$lib/components/Header.svelte";
  import { onMount } from "svelte";

  let { children } = $props();

  // Dark mode support
  onMount(() => {
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
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
<Toaster />
