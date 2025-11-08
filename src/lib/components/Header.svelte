<script lang="ts">
  import logo from "$lib/assets/budgetbuddy_logo.png";
  import logoDark from "$lib/assets/budgetbuddy_logo_dark.png";
  import { Button } from "$lib/components/ui/button";
  import { themeStore } from "$lib/stores/theme";
  import { Sun, Moon } from "lucide-svelte";
  import { browser } from "$app/environment";

  let theme = $state($themeStore);

  $effect(() => {
    theme = $themeStore;
  });

  function toggleTheme() {
    themeStore.toggle();
  }
</script>

<header
  class="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="container mx-auto flex h-14 items-center px-4 mt-2">
    <div class="flex items-center">
      {#if browser}
        <img
          src={theme === "dark" ? logoDark : logo}
          alt="BudgetBuddy"
          class="h-10"
        />
      {:else}
        <img src={logo} alt="BudgetBuddy" class="h-10" />
      {/if}
    </div>

    <div class="ml-auto flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onclick={toggleTheme}
        aria-label="Toggle theme"
      >
        {#if theme === "dark"}
          <Sun class="h-5 w-5" />
        {:else}
          <Moon class="h-5 w-5" />
        {/if}
      </Button>
    </div>
  </div>
</header>
