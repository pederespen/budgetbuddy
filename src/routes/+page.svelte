<script lang="ts">
  import { base } from "$app/paths";
  import { budgetStore } from "$lib/stores/budget";
  import { getDefaultCategories } from "$lib/defaults";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import Dashboard from "$lib/components/budget/Dashboard.svelte";
  import BudgetSetupForm from "$lib/components/forms/BudgetSetupForm.svelte";
  import type { Currency, Budget } from "$lib/types";

  let showCreateForm = $state(false);

  let activeBudget: Budget | undefined = $derived(
    $budgetStore.budgets.find((b: Budget) => b.id === $budgetStore.activeBudgetId)
  );

  function handleCreateBudget(data: { name: string; currency: Currency }) {
    const now = new Date().toISOString();
    const newBudget = {
      id: crypto.randomUUID(),
      name: data.name,
      currency: data.currency,
      dateFormat: "DD/MM/YYYY" as const,
      categories: getDefaultCategories(),
      entries: [],
      budgetLimits: {},
      createdAt: now,
      updatedAt: now,
    };
    budgetStore.addBudget(newBudget);
    showCreateForm = false;
  }

  async function handleLoadDemo() {
    try {
      const response = await fetch(`${base}/demo-budget.json`);
      if (!response.ok) throw new Error("Failed to load demo data");
      const demoData = await response.json();
      budgetStore.set(demoData);
    } catch (error) {
      console.error("Failed to load demo data:", error);
    }
  }

  function handleImportFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Basic validation
        if (!data.budgets || !Array.isArray(data.budgets)) {
          throw new Error("Invalid budget file format");
        }

        budgetStore.set(data);
      } catch (error) {
        console.error("Import failed:", error);
      }
    };
    input.click();
  }
</script>

<div class="h-full flex flex-col bg-background overflow-hidden">
  <div class="flex-1 overflow-auto">
    <div class="max-w-6xl mx-auto h-full px-4">
      {#if !activeBudget}
        {#if showCreateForm}
          <!-- Create Budget Form -->
          <div class="flex min-h-[80vh] items-center justify-center">
            <Card class="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New Budget</CardTitle>
                <CardDescription>
                  Set up your budget with a name, currency, period, and optional spending limit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetSetupForm
                  onsubmit={handleCreateBudget}
                  oncancel={() => (showCreateForm = false)}
                />
              </CardContent>
            </Card>
          </div>
        {:else}
          <!-- Welcome Screen -->
          <div class="flex min-h-[80vh] items-center justify-center">
            <Card class="w-full max-w-md">
              <CardHeader class="text-center">
                <CardTitle class="text-3xl">Welcome to BudgetBuddy</CardTitle>
                <CardDescription>
                  Your privacy-focused budget tracker. All data stays on your device.
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <Button onclick={() => (showCreateForm = true)} class="w-full" size="lg">
                  Create New Budget
                </Button>
                <Button variant="outline" class="w-full" onclick={handleImportFile}
                  >Import from File (JSON)</Button
                >
                <div class="pt-2">
                  <div class="w-full border-t mb-4"></div>
                  <Button variant="outline" class="w-full" onclick={handleLoadDemo}
                    >Load Demo Data</Button
                  >
                </div>
              </CardContent>
            </Card>
          </div>
        {/if}
      {:else}
        <!-- Main App -->
        <Dashboard budget={activeBudget} />
      {/if}
    </div>
  </div>
</div>
