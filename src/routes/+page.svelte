<script lang="ts">
	import { budgetStore } from '$lib/stores/budget';
	import { createDefaultBudget } from '$lib/storage';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { onMount } from 'svelte';
	import Dashboard from './Dashboard.svelte';

	let state = $state({ budgets: [], activeBudgetId: null });
	let activeBudget = $derived(state.budgets.find((b) => b.id === state.activeBudgetId));

	onMount(() => {
		budgetStore.subscribe((s) => {
			state = s;
		});
	});

	function handleCreateBudget() {
		const newBudget = createDefaultBudget();
		budgetStore.addBudget(newBudget);
	}
</script>

<div class="min-h-screen bg-background">
	<div class="container mx-auto px-4 py-8">
		{#if !activeBudget}
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
						<Button onclick={handleCreateBudget} class="w-full" size="lg">
							Create New Budget
						</Button>
						<div class="relative">
							<div class="absolute inset-0 flex items-center">
								<span class="w-full border-t"></span>
							</div>
							<div class="relative flex justify-center text-xs uppercase">
								<span class="bg-background px-2 text-muted-foreground">Coming soon</span>
							</div>
						</div>
						<Button variant="outline" class="w-full" disabled>Load Demo Data</Button>
						<Button variant="outline" class="w-full" disabled>Import from File</Button>
					</CardContent>
				</Card>
			</div>
		{:else}
			<!-- Main App -->
			<Dashboard budget={activeBudget} />
		{/if}
	</div>
</div>
