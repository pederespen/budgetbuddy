<script lang="ts">
  import logo from "$lib/assets/budgetbuddy_logo.png";
  import logoDark from "$lib/assets/budgetbuddy_logo_dark.png";
  import { Button } from "$lib/components/ui/button";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Select from "$lib/components/ui/select";
  import { themeStore } from "$lib/stores/theme";
  import { dateRangeStore, type DateRangePreset } from "$lib/stores/dateRange";
  import { Sun, Moon, Calendar } from "lucide-svelte";
  import { browser } from "$app/environment";

  let {
    activeTab = $bindable(),
    showTabs = false,
  }: {
    activeTab?: string;
    showTabs?: boolean;
  } = $props();

  let theme = $state($themeStore);
  let dateRange = $state($dateRangeStore);

  $effect(() => {
    theme = $themeStore;
  });

  $effect(() => {
    dateRange = $dateRangeStore;
  });

  function toggleTheme() {
    themeStore.toggle();
  }

  const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "last3months", label: "Last 3 Months" },
    { value: "last6months", label: "Last 6 Months" },
  ];

  function handleDateRangeChange(value: string | undefined) {
    if (value) {
      dateRangeStore.setPreset(value as DateRangePreset);
    }
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

    {#if showTabs}
      <div class="hidden sm:flex justify-center flex-1">
        <Tabs.Root bind:value={activeTab}>
          <Tabs.List class="grid w-full grid-cols-4 max-w-2xl">
            <Tabs.Trigger value="overview" class="cursor-pointer px-6">
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger value="expenses" class="cursor-pointer px-6">
              Expenses
            </Tabs.Trigger>
            <Tabs.Trigger value="insights" class="cursor-pointer px-6">
              Insights
            </Tabs.Trigger>
            <Tabs.Trigger value="settings" class="cursor-pointer px-6">
              Settings
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>
    {/if}

    <div class="ml-auto flex items-center gap-2">
      {#if showTabs}
        <Select.Root
          type="single"
          value={dateRange.preset}
          onValueChange={handleDateRangeChange}
        >
          <Select.Trigger class="w-[160px] h-9">
            <Calendar class="h-4 w-4 mr-2" />
            {dateRangeOptions.find(o => o.value === dateRange.preset)?.label || "All Time"}
          </Select.Trigger>
          <Select.Content>
            {#each dateRangeOptions as option}
              <Select.Item value={option.value}>
                {option.label}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      {/if}

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
