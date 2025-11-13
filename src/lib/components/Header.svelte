<script lang="ts">
  import logo from "$lib/assets/budgetbuddy_logo.png";
  import logoDark from "$lib/assets/budgetbuddy_logo_dark.png";
  import { Button } from "$lib/components/ui/button";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Select from "$lib/components/ui/select";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Popover from "$lib/components/ui/popover";
  import { Calendar as CalendarComponent } from "$lib/components/ui/calendar";
  import { themeStore } from "$lib/stores/theme";
  import { dateRangeStore, type DateRangePreset } from "$lib/stores/dateRange";
  import { Sun, Moon, Calendar } from "lucide-svelte";
  import { browser } from "$app/environment";
  import {
    getLocalTimeZone,
    type DateValue,
    DateFormatter,
    CalendarDate,
  } from "@internationalized/date";
  import { cn } from "$lib/utils";

  let {
    activeTab = $bindable(),
    showTabs = false,
  }: {
    activeTab?: string;
    showTabs?: boolean;
  } = $props();

  let theme = $state($themeStore);
  let dateRange = $state($dateRangeStore);
  let customDialogOpen = $state(false);
  let customStartDate = $state<DateValue | undefined>(undefined);
  let customEndDate = $state<DateValue | undefined>(undefined);
  let startCalendarOpen = $state(false);
  let endCalendarOpen = $state(false);

  const df = new DateFormatter("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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
    { value: "custom", label: "Custom Range..." },
  ];

  function handleDateRangeChange(value: string | undefined) {
    if (value === "custom") {
      // Open the custom dialog (whether first time or re-selecting)
      openCustomDialog();
    } else if (value) {
      dateRangeStore.setPreset(value as DateRangePreset);
    }
  }

  function openCustomDialog() {
    // If custom range is already set, pre-fill the dates
    if (dateRange.preset === "custom" && dateRange.startDate && dateRange.endDate) {
      const start = dateRange.startDate;
      const end = dateRange.endDate;
      customStartDate = new CalendarDate(
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate()
      );
      customEndDate = new CalendarDate(end.getFullYear(), end.getMonth() + 1, end.getDate());
    }
    customDialogOpen = true;
  }

  function applyCustomRange() {
    if (customStartDate && customEndDate) {
      const startDate = new Date(
        customStartDate.year,
        customStartDate.month - 1,
        customStartDate.day
      );
      const endDate = new Date(customEndDate.year, customEndDate.month - 1, customEndDate.day);
      dateRangeStore.setCustomRange(startDate, endDate);
      customDialogOpen = false;
      customStartDate = undefined;
      customEndDate = undefined;
    }
  }

  function getDisplayLabel(): string {
    if (dateRange.preset === "custom" && dateRange.startDate && dateRange.endDate) {
      const start = dateRange.startDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
      const end = dateRange.endDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
      return `${start} - ${end}`;
    }
    return dateRangeOptions.find((o) => o.value === dateRange.preset)?.label || "All Time";
  }
</script>

<header
  class="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="max-w-6xl mx-auto mt-2 relative">
    <div class="flex h-14 items-center px-4 relative">
      <div class="flex items-center">
        {#if browser}
          <img src={theme === "dark" ? logoDark : logo} alt="BudgetBuddy" class="h-10" />
        {:else}
          <img src={logo} alt="BudgetBuddy" class="h-10" />
        {/if}
      </div>

      {#if showTabs}
        <div class="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Tabs.Root bind:value={activeTab}>
            <Tabs.List class="grid w-full grid-cols-4 max-w-2xl">
              <Tabs.Trigger value="overview" class="cursor-pointer px-6">Overview</Tabs.Trigger>
              <Tabs.Trigger value="transactions" class="cursor-pointer px-6">
                Transactions
              </Tabs.Trigger>
              <Tabs.Trigger value="insights" class="cursor-pointer px-6">Insights</Tabs.Trigger>
              <Tabs.Trigger value="settings" class="cursor-pointer px-6">Settings</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>
      {/if}

      <div class="ml-auto flex items-center gap-2 z-10">
        {#if showTabs}
          <Select.Root type="single" value={dateRange.preset} onValueChange={handleDateRangeChange}>
            <Select.Trigger class="w-[160px] h-9">
              <Calendar class="h-4 w-4 mr-2" />
              {getDisplayLabel()}
            </Select.Trigger>
            <Select.Content>
              {#each dateRangeOptions as option (option.value)}
                <Select.Item
                  value={option.value}
                  onclick={() => {
                    // If clicking custom (whether already selected or not), open dialog
                    if (option.value === "custom") {
                      openCustomDialog();
                    }
                  }}
                >
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>

          <!-- Dialog for Custom Date Range -->
          <Dialog.Root bind:open={customDialogOpen}>
            <Dialog.Content class="sm:max-w-[425px]">
              <Dialog.Header>
                <Dialog.Title>Custom Date Range</Dialog.Title>
              </Dialog.Header>
              <div class="grid grid-cols-2 gap-4 py-4">
                <div class="space-y-2">
                  <p class="text-sm font-medium">Start Date</p>
                  <Popover.Root bind:open={startCalendarOpen}>
                    <Popover.Trigger
                      class={cn(
                        "w-full justify-between text-left font-normal flex h-10 items-center rounded-md border border-input bg-card px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <span>
                        {customStartDate
                          ? df.format(customStartDate.toDate(getLocalTimeZone()))
                          : "Pick start date"}
                      </span>
                      <Calendar class="h-4 w-4" />
                    </Popover.Trigger>
                    <Popover.Content class="w-auto p-0" align="start">
                      <CalendarComponent
                        type="single"
                        bind:value={customStartDate}
                        initialFocus
                        onValueChange={() => {
                          startCalendarOpen = false;
                        }}
                      />
                    </Popover.Content>
                  </Popover.Root>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-medium">End Date</p>
                  <Popover.Root bind:open={endCalendarOpen}>
                    <Popover.Trigger
                      class={cn(
                        "w-full justify-between text-left font-normal flex h-10 items-center rounded-md border border-input bg-card px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <span>
                        {customEndDate
                          ? df.format(customEndDate.toDate(getLocalTimeZone()))
                          : "Pick end date"}
                      </span>
                      <Calendar class="h-4 w-4" />
                    </Popover.Trigger>
                    <Popover.Content class="w-auto p-0" align="start">
                      <CalendarComponent
                        type="single"
                        bind:value={customEndDate}
                        initialFocus
                        onValueChange={() => {
                          endCalendarOpen = false;
                        }}
                      />
                    </Popover.Content>
                  </Popover.Root>
                </div>
              </div>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onclick={() => {
                    customDialogOpen = false;
                    customStartDate = undefined;
                    customEndDate = undefined;
                  }}
                >
                  Cancel
                </Button>
                <Button onclick={applyCustomRange} disabled={!customStartDate || !customEndDate}>
                  Apply Range
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Root>
        {/if}

        <Button variant="ghost" size="icon" onclick={toggleTheme} aria-label="Toggle theme">
          {#if theme === "dark"}
            <Sun class="h-5 w-5" />
          {:else}
            <Moon class="h-5 w-5" />
          {/if}
        </Button>
      </div>
    </div>
  </div>
</header>
