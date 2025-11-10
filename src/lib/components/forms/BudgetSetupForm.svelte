<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import type { Currency } from "$lib/types";
  import { currencyLabels } from "$lib/utils/format";

  interface Props {
    onsubmit: (data: { name: string; currency: Currency }) => void;
    oncancel?: () => void;
  }

  let { onsubmit, oncancel }: Props = $props();

  let name = $state("My Budget");
  let currency = $state<Currency>("NOK");

  function handleSubmit(e: Event) {
    e.preventDefault();
    onsubmit({ name, currency });
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <div class="space-y-2">
    <Label for="budget-name">Budget Name</Label>
    <Input
      id="budget-name"
      type="text"
      bind:value={name}
      placeholder="e.g., Monthly Expenses"
      required
      class="bg-background"
    />
  </div>

  <div class="space-y-2">
    <Label for="currency">Currency</Label>
    <Select.Root type="single" bind:value={currency}>
      <Select.Trigger id="currency" class="w-full bg-background">
        <span>{currencyLabels[currency]}</span>
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
    <Button type="submit" class="ml-auto">Create Budget</Button>
  </div>
</form>
