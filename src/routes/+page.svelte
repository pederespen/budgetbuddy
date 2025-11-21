<script lang="ts">
  import { base } from "$app/paths";
  import { budgetStore } from "$lib/stores/budget";
  import { getDefaultCategories } from "$lib/defaults";
  import { generateId, getCurrentTimestamp } from "$lib/utils/id";
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
  import CSVImportWizard from "$lib/components/import/CSVImportWizard.svelte";
  import type { Currency, Budget, Transaction, Category } from "$lib/types";

  let showCreateForm = $state(false);
  let showCSVImport = $state(false);
  let pendingBudgetName = $state("My Budget");
  let pendingBudgetCurrency = $state<Currency>("NOK");

  let activeBudget: Budget | undefined = $derived(
    $budgetStore.budgets.find(
      (b: Budget) => b.id === $budgetStore.activeBudgetId
    )
  );

  function handleCreateBudget(data: { name: string; currency: Currency }) {
    const now = getCurrentTimestamp();
    const newBudget = {
      id: generateId(),
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

  function handleCSVImport(
    event: CustomEvent<{ transactions: Transaction[]; categories: Category[] }>
  ) {
    const { transactions, categories } = event.detail;

    // If no active budget, create one first
    if (!activeBudget) {
      const now = getCurrentTimestamp();
      // Use the categories from the import wizard (which have the correct IDs)
      const newBudget = {
        id: generateId(),
        name: pendingBudgetName,
        currency: pendingBudgetCurrency,
        dateFormat: "DD/MM/YYYY" as const,
        categories: categories,
        entries: [],
        budgetLimits: {},
        createdAt: now,
        updatedAt: now,
      };

      budgetStore.addBudget(newBudget);

      // Add transactions to the new budget
      transactions.forEach((transaction) => {
        budgetStore.addTransaction(newBudget.id, transaction);
      });
    } else {
      // Merge categories: keep existing, add new ones that don't exist
      const existingCategoryIds = new Set(
        activeBudget.categories.map((c) => c.id)
      );
      const newCategories = categories.filter(
        (c) => !existingCategoryIds.has(c.id)
      );

      if (newCategories.length > 0) {
        budgetStore.updateBudget(activeBudget.id, {
          categories: [...activeBudget.categories, ...newCategories],
        });
      }

      // Add all transactions to the active budget
      transactions.forEach((transaction) => {
        budgetStore.addTransaction(activeBudget.id, transaction);
      });
    }

    showCSVImport = false;
    showCreateForm = false;
  }

  function handleCSVCancel() {
    showCSVImport = false;
  }

  function handleStartCSVImport(data: { name: string; currency: Currency }) {
    pendingBudgetName = data.name;
    pendingBudgetCurrency = data.currency;
    showCSVImport = true;
  }
</script>

<div class="h-full flex flex-col bg-background">
  <div class="flex-1 overflow-y-auto">
    {#if showCSVImport}
      <!-- CSV Import Wizard (Full Page) -->
      <CSVImportWizard
        categories={getDefaultCategories()}
        on:import={handleCSVImport}
        on:cancel={handleCSVCancel}
      />
    {:else}
      <div class="max-w-6xl mx-auto px-4 py-4">
        {#if !activeBudget}
          {#if showCreateForm}
            <!-- Create Budget Form -->
            <div class="flex min-h-[80vh] items-center justify-center">
              <Card class="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create New Budget</CardTitle>
                  <CardDescription>
                    Set up your budget with a name, currency, period, and
                    optional spending limit.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BudgetSetupForm
                    onsubmit={handleCreateBudget}
                    oncancel={() => (showCreateForm = false)}
                    onImportCSV={handleStartCSVImport}
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
                    Your privacy-focused budget tracker. All data stays on your
                    device.
                  </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <Button
                    onclick={() => (showCreateForm = true)}
                    class="w-full"
                    size="lg"
                  >
                    Create New Budget
                  </Button>
                  <Button
                    variant="outline"
                    class="w-full"
                    onclick={handleImportFile}>Import from File (JSON)</Button
                  >
                  <div class="pt-2">
                    <div class="w-full border-t mb-4"></div>
                    <Button
                      variant="outline"
                      class="w-full"
                      onclick={handleLoadDemo}>Load Demo Data</Button
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
    {/if}
  </div>
</div>
