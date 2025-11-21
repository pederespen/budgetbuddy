<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import * as Tabs from "$lib/components/ui/tabs";
  import type { Currency } from "$lib/types";
  import { currencyLabels } from "$lib/utils/format";
  import { Upload, Plus } from "lucide-svelte";

  interface Props {
    onsubmit: (data: { name: string; currency: Currency }) => void;
    oncancel?: () => void;
    onImportCSV?: (data: { name: string; currency: Currency }) => void;
  }

  let { onsubmit, oncancel, onImportCSV }: Props = $props();

  let name = $state("");
  let currency = $state<Currency | "">("");
  let activeTab = $state<"create" | "import">("create");

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name.trim() || !currency) return;

    if (activeTab === "import" && onImportCSV) {
      onImportCSV({ name: name.trim(), currency: currency as Currency });
    } else {
      onsubmit({ name: name.trim(), currency: currency as Currency });
    }
  }

  let isFormValid = $derived(name.trim().length > 0 && currency !== "");
</script>

<form onsubmit={handleSubmit} class="space-y-4">
  <Tabs.Root bind:value={activeTab} class="w-full">
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="create" class="text-sm sm:text-base gap-1 sm:gap-2">
        <Plus class="h-3 w-3 sm:h-4 sm:w-4" />
        <span class="hidden sm:inline">Create New</span>
        <span class="sm:hidden">Create</span>
      </Tabs.Trigger>
      <Tabs.Trigger value="import" class="text-sm sm:text-base gap-1 sm:gap-2">
        <Upload class="h-3 w-3 sm:h-4 sm:w-4" />
        <span class="hidden sm:inline">Import from Bank</span>
        <span class="sm:hidden">Import</span>
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="create" class="mt-3 sm:mt-4">
      <p class="text-xs sm:text-sm text-muted-foreground">
        Start with an empty budget and add transactions manually
      </p>
    </Tabs.Content>
    <Tabs.Content value="import" class="mt-3 sm:mt-4">
      <p class="text-xs sm:text-sm text-muted-foreground">
        Import transactions from your bank's CSV export file
      </p>
    </Tabs.Content>
  </Tabs.Root>

  <div class="space-y-2">
    <Label for="budget-name">Budget Name</Label>
    <Input
      id="budget-name"
      type="text"
      bind:value={name}
      placeholder="e.g., Monthly Budget"
      required
      class="bg-background"
    />
  </div>

  <div class="space-y-2">
    <Label for="currency">Currency</Label>
    <Select.Root type="single" bind:value={currency}>
      <Select.Trigger id="currency" class="w-full bg-background">
        <span
          >{currency
            ? currencyLabels[currency as Currency]
            : "Select currency"}</span
        >
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="NOK" label="NOK - Norwegian Krone">
          NOK - Norwegian Krone
        </Select.Item>
        <Select.Item value="USD" label="USD - US Dollar">
          USD - US Dollar
        </Select.Item>
        <Select.Item value="EUR" label="EUR - Euro">EUR - Euro</Select.Item>
        <Select.Item value="GBP" label="GBP - British Pound">
          GBP - British Pound
        </Select.Item>
        <Select.Item value="SEK" label="SEK - Swedish Krona">
          SEK - Swedish Krona
        </Select.Item>
        <Select.Item value="DKK" label="DKK - Danish Krone">
          DKK - Danish Krone
        </Select.Item>
      </Select.Content>
    </Select.Root>
  </div>

  <div class="flex gap-3 items-center">
    {#if oncancel}
      <Button type="button" variant="ghost" onclick={oncancel} class="gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </Button>
    {/if}
    <Button type="submit" class="ml-auto" disabled={!isFormValid}>
      {activeTab === "import" ? "Continue to Import" : "Create Budget"}
    </Button>
  </div>
</form>
