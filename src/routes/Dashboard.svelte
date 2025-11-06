<script lang="ts">
	import type { Budget, Expense } from '$lib/types';
	import { budgetStore } from '$lib/stores/budget';
	import { formatCurrency } from '$lib/utils/format';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import ExpenseList from './ExpenseList.svelte';
	import ExpenseForm from './ExpenseForm.svelte';
	import { Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { budget }: { budget: Budget } = $props();

	let showExpenseForm = $state(false);
	let editingExpense = $state<Expense | null>(null);

	// Calculate total spending
	let totalSpent = $derived(
		budget.entries.reduce((sum, entry) => sum + entry.amount, 0)
	);

	// Calculate spending by category
	let spendingByCategory = $derived(
		budget.entries.reduce((acc, entry) => {
			acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
			return acc;
		}, {} as Record<string, number>)
	);

	function handleAddExpense() {
		editingExpense = null;
		showExpenseForm = true;
	}

	function handleEditExpense(expense: Expense) {
		editingExpense = expense;
		showExpenseForm = true;
	}

	function handleCloseForm() {
		showExpenseForm = false;
		editingExpense = null;
	}

	function handleSaveExpense(expense: Expense) {
		if (editingExpense) {
			budgetStore.updateExpense(budget.id, expense.id, expense);
			toast.success('Expense updated', {
				description: `${formatCurrency(expense.amount, budget.currency)} for ${expense.category}`
			});
		} else {
			budgetStore.addExpense(budget.id, expense);
			toast.success('Expense added', {
				description: `${formatCurrency(expense.amount, budget.currency)} for ${expense.category}`
			});
		}
		handleCloseForm();
	}

	function handleDeleteExpense(expenseId: string) {
		const expense = budget.entries.find((e) => e.id === expenseId);
		budgetStore.deleteExpense(budget.id, expenseId);
		if (expense) {
			toast.success('Expense deleted', {
				description: `${formatCurrency(expense.amount, budget.currency)} for ${expense.category}`
			});
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold">{budget.name}</h1>
			<p class="text-muted-foreground">Track your expenses and manage your budget</p>
		</div>
		<Button onclick={handleAddExpense} class="w-full sm:w-auto">
			<Plus class="mr-2 h-4 w-4" />
			Add Expense
		</Button>
	</div>

	<!-- Summary Cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Spent</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{formatCurrency(totalSpent, budget.currency)}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Expenses</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{budget.entries.length}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Categories</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{budget.categories.length}</div>
			</CardContent>
		</Card>
	</div>

	<!-- Category Overview -->
	{#if Object.keys(spendingByCategory).length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Spending by Category</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each Object.entries(spendingByCategory) as [category, amount]}
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">{category}</span>
							<span class="text-sm text-muted-foreground">
								{formatCurrency(amount, budget.currency)}
							</span>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Expense List -->
	<ExpenseList
		expenses={budget.entries}
		currency={budget.currency}
		onEdit={handleEditExpense}
		onDelete={handleDeleteExpense}
	/>

	<!-- Expense Form Dialog -->
	{#if showExpenseForm}
		<ExpenseForm
			budget={budget}
			expense={editingExpense}
			onSave={handleSaveExpense}
			onClose={handleCloseForm}
		/>
	{/if}
</div>
