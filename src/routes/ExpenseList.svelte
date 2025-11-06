<script lang="ts">
	import type { Expense, Currency } from '$lib/types';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Pencil, Trash2 } from 'lucide-svelte';

	let {
		expenses,
		currency,
		onEdit,
		onDelete
	}: {
		expenses: Expense[];
		currency: Currency;
		onEdit: (expense: Expense) => void;
		onDelete: (id: string) => void;
	} = $props();

	// Sort expenses by date (newest first)
	let sortedExpenses = $derived([...expenses].sort((a, b) => 
		new Date(b.date).getTime() - new Date(a.date).getTime()
	));
</script>

<Card>
	<CardHeader>
		<CardTitle>Recent Expenses</CardTitle>
	</CardHeader>
	<CardContent>
		{#if sortedExpenses.length === 0}
			<div class="py-8 text-center text-muted-foreground">
				<p>No expenses yet. Click "Add Expense" to get started!</p>
			</div>
		{:else}
			<!-- Mobile View -->
			<div class="block sm:hidden space-y-3">
				{#each sortedExpenses as expense (expense.id)}
					<div class="rounded-lg border p-3 space-y-2">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="font-medium">{expense.category}</div>
								<div class="text-sm text-muted-foreground">{formatDate(expense.date)}</div>
								{#if expense.note}
									<div class="mt-1 text-sm text-muted-foreground">{expense.note}</div>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-semibold">{formatCurrency(expense.amount, currency)}</div>
							</div>
						</div>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={() => onEdit(expense)}
								class="flex-1"
							>
								<Pencil class="mr-1 h-3 w-3" />
								Edit
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => onDelete(expense.id)}
								class="flex-1"
							>
								<Trash2 class="mr-1 h-3 w-3" />
								Delete
							</Button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Desktop View -->
			<div class="hidden sm:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Note</TableHead>
							<TableHead class="text-right">Amount</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each sortedExpenses as expense (expense.id)}
							<TableRow>
								<TableCell class="font-medium">{formatDate(expense.date)}</TableCell>
								<TableCell>{expense.category}</TableCell>
								<TableCell class="max-w-xs truncate">{expense.note || '-'}</TableCell>
								<TableCell class="text-right font-semibold">
									{formatCurrency(expense.amount, currency)}
								</TableCell>
								<TableCell class="text-right">
									<div class="flex justify-end gap-2">
										<Button variant="ghost" size="sm" onclick={() => onEdit(expense)}>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onclick={() => onDelete(expense.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</CardContent>
</Card>
