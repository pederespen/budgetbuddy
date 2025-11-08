<script lang="ts">
  import logo from "$lib/assets/budgetbuddy_logo.png";
  import logoDark from "$lib/assets/budgetbuddy_logo_dark.png";
  import { Button } from "$lib/components/ui/button";
  import { themeStore } from "$lib/stores/theme";
  import { Sun, Moon, LayoutDashboard, TrendingUp } from "lucide-svelte";
  import { page } from "$app/stores";

  let theme = $state($themeStore);

  $effect(() => {
    theme = $themeStore;
  });

  function toggleTheme() {
    themeStore.toggle();
  }

  const currentPath = $derived($page.url.pathname);
</script>

<header
  class="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
>
  <div class="container mx-auto flex h-14 items-center px-4 mt-2">
    <div class="flex items-center gap-6">
      <a href="/" class="flex items-center">
        <img
          src={theme === "dark" ? logoDark : logo}
          alt="BudgetBuddy"
          class="h-10"
        />
      </a>

      <nav class="hidden md:flex items-center gap-1">
        <Button
          variant={currentPath === "/" ? "secondary" : "ghost"}
          size="sm"
          href="/"
          class="gap-2"
        >
          <LayoutDashboard class="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={currentPath === "/insights" ? "secondary" : "ghost"}
          size="sm"
          href="/insights"
          class="gap-2"
        >
          <TrendingUp class="h-4 w-4" />
          Insights
        </Button>
      </nav>
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
