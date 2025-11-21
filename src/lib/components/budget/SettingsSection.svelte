<script lang="ts">
  import type { Budget, Currency, DateFormat, Transaction } from "$lib/types";
  import { budgetStore } from "$lib/stores/budget";
  import { currencyShortLabels, dateFormatLabels } from "$lib/utils/format";
  import * as Select from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { FileJson, FileText, FileSpreadsheet } from "lucide-svelte";
  import { exportAsJSON, exportAsCSV, exportAsXLSX } from "$lib/utils/export";

  let { budget }: { budget: Budget } = $props();

  let selectedCurrency = $state<Currency>(budget.currency);
  let selectedDateFormat = $state<DateFormat>(budget.dateFormat);
  let isConvertingCurrency = $state(false);

  let budgetName = $state(budget.name);

  $effect(() => {
    selectedCurrency = budget.currency;
    selectedDateFormat = budget.dateFormat;
    budgetName = budget.name;
  });

  function handleBudgetNameChange() {
    const trimmedName = budgetName.trim();
    if (trimmedName && trimmedName !== budget.name) {
      budgetStore.updateBudget(budget.id, { name: trimmedName });
    }
  }

  async function getExchangeRate(
    from: Currency,
    to: Currency
  ): Promise<number> {
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      const data = await response.json();
      return data.rates[to] || 1;
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      return 1;
    }
  }

  async function handleCurrencyChange() {
    if (selectedCurrency === budget.currency) return;

    isConvertingCurrency = true;
    const fromCurrency = budget.currency;
    const toCurrency = selectedCurrency;

    try {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      const convertedEntries = budget.entries.map((entry) => ({
        ...entry,
        amount: entry.amount * rate,
      }));

      const convertedBudgetLimits: { [key: string]: number } = {};
      for (const [categoryId, limit] of Object.entries(budget.budgetLimits)) {
        convertedBudgetLimits[categoryId] = limit * rate;
      }

      budgetStore.updateBudget(budget.id, {
        currency: toCurrency,
        entries: convertedEntries,
        budgetLimits: convertedBudgetLimits,
      });
    } catch (error) {
      console.error("Currency conversion error:", error);
      selectedCurrency = budget.currency;
    } finally {
      isConvertingCurrency = false;
    }
  }

  function handleDateFormatChange() {
    budgetStore.updateBudget(budget.id, { dateFormat: selectedDateFormat });
  }
</script>

<div class="space-y-8">
  <!-- Settings Section -->
  <div class="space-y-4">
    <h3
      class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
    >
      Settings
    </h3>
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="budget-name">Budget Name</Label>
        <Input
          id="budget-name"
          type="text"
          bind:value={budgetName}
          onblur={handleBudgetNameChange}
          placeholder="Budget name"
          class="max-w-xs"
        />
      </div>

      <div class="space-y-2">
        <Label for="currency">Currency</Label>
        <Select.Root
          type="single"
          bind:value={selectedCurrency}
          onValueChange={handleCurrencyChange}
          disabled={isConvertingCurrency}
        >
          <Select.Trigger
            id="currency"
            class="w-full max-w-xs"
            disabled={isConvertingCurrency}
          >
            <span>{currencyShortLabels[selectedCurrency]}</span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="NOK" label="NOK (kr)">NOK (kr)</Select.Item>
            <Select.Item value="USD" label="USD ($)">USD ($)</Select.Item>
            <Select.Item value="EUR" label="EUR (€)">EUR (€)</Select.Item>
            <Select.Item value="GBP" label="GBP (£)">GBP (£)</Select.Item>
            <Select.Item value="SEK" label="SEK (kr)">SEK (kr)</Select.Item>
            <Select.Item value="DKK" label="DKK (kr)">DKK (kr)</Select.Item>
          </Select.Content>
        </Select.Root>
        <p class="text-xs text-muted-foreground">
          {#if isConvertingCurrency}
            Converting all amounts using live exchange rates...
          {:else}
            Changing currency will convert all amounts using live exchange rates
          {/if}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="dateformat">Date Format</Label>
        <Select.Root
          type="single"
          bind:value={selectedDateFormat}
          onValueChange={handleDateFormatChange}
        >
          <Select.Trigger id="dateformat" class="w-full max-w-xs">
            <span>{dateFormatLabels[selectedDateFormat]}</span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="DD/MM/YYYY" label="DD/MM/YYYY"
              >DD/MM/YYYY</Select.Item
            >
            <Select.Item value="MM/DD/YYYY" label="MM/DD/YYYY"
              >MM/DD/YYYY</Select.Item
            >
            <Select.Item value="YYYY-MM-DD" label="YYYY-MM-DD"
              >YYYY-MM-DD</Select.Item
            >
            <Select.Item value="DD.MM.YYYY" label="DD.MM.YYYY"
              >DD.MM.YYYY</Select.Item
            >
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </div>

  <!-- Divider -->
  <div class="border-t"></div>

  <!-- Export Section -->
  <div class="space-y-3">
    <h3
      class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
    >
      Export Data
    </h3>
    <div class="space-y-2">
      <p class="text-sm text-muted-foreground">
        Download your budget data in different formats
      </p>
      <div class="flex gap-2 max-w-xs">
        <Button
          variant="outline"
          onclick={() => exportAsJSON(budget)}
          class="flex-1 justify-start bg-card"
        >
          <FileJson class="mr-2 h-4 w-4" />
          JSON
        </Button>
        <Button
          variant="outline"
          onclick={() => exportAsCSV(budget)}
          class="flex-1 justify-start bg-card"
        >
          <FileText class="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button
          variant="outline"
          onclick={() => exportAsXLSX(budget)}
          class="flex-1 justify-start bg-card"
        >
          <FileSpreadsheet class="mr-2 h-4 w-4" />
          Excel
        </Button>
      </div>
    </div>
  </div>
</div>
