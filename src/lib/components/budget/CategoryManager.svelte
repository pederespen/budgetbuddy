<script lang="ts">
  import type { Category, Expense } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Dialog from "$lib/components/ui/dialog";
  import {
    POPULAR_ICONS,
    PRESET_COLORS,
    getIconComponent,
  } from "$lib/utils/categories";
  import { Trash2, Plus, Check, Pencil } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  let {
    categories,
    expenses,
    open = $bindable(false),
    onAdd,
    onUpdate,
    onDelete,
  }: {
    categories: Category[];
    expenses: Expense[];
    open?: boolean;
    onAdd: (category: Category) => void;
    onUpdate: (categoryId: string, updates: Partial<Category>) => void;
    onDelete: (categoryId: string) => void;
  } = $props();

  let editingId = $state<string | null>(null);
  let showAddForm = $state(false);

  // Add form state
  let newName = $state("");
  let newIcon = $state("ShoppingCart");
  let newColor = $state("#ff6b6b");

  // Edit form state
  let editName = $state("");
  let editIcon = $state("");
  let editColor = $state("");

  function handleStartAdd() {
    showAddForm = true;
    editingId = null;
    newName = "";
    newIcon = "ShoppingCart";
    newColor = "#ff6b6b";
  }

  function handleCancelAdd() {
    showAddForm = false;
  }

  function handleSaveAdd() {
    if (!newName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const category: Category = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
    };

    onAdd(category);
    showAddForm = false;
    toast.success("Category added", { description: category.name });
  }

  function handleStartEdit(category: Category) {
    editingId = category.id;
    showAddForm = false;
    editName = category.name;
    editIcon = category.icon;
    editColor = category.color;
  }

  function handleCancelEdit() {
    editingId = null;
  }

  function handleSaveEdit(categoryId: string) {
    if (!editName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    onUpdate(categoryId, {
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
    });
    editingId = null;
    toast.success("Category updated");
  }

  function handleDelete(category: Category) {
    const expenseCount = getCategoryExpenseCount(category.id);

    let message = `Are you sure you want to delete "${category.name}"?`;
    if (expenseCount > 0) {
      message = `Are you sure you want to delete "${category.name}"?\n\nThis category has ${expenseCount} expense${expenseCount === 1 ? "" : "s"}. All expenses will be reassigned to "Other".`;
    }

    if (confirm(message)) {
      onDelete(category.id);
      toast.success("Category deleted", { description: category.name });
    }
  }

  function getCategoryExpenseCount(categoryId: string): number {
    return expenses.filter((e) => e.categoryId === categoryId).length;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-2xl max-h-[80vh] flex flex-col">
    <Dialog.Header>
      <Dialog.Title>Manage Categories</Dialog.Title>
    </Dialog.Header>

    <div class="flex-1 overflow-y-auto py-4">
      <!-- Add New Category Form -->
      {#if showAddForm}
        <div class="mb-6 p-4 border rounded-lg bg-muted/30">
          <h3 class="font-semibold mb-4">New Category</h3>
          <div class="space-y-4">
            <div>
              <Label for="new-name">Name</Label>
              <Input
                id="new-name"
                bind:value={newName}
                placeholder="e.g., Groceries"
                class="mt-1"
              />
            </div>

            <div>
              <Label>Icon</Label>
              <div
                class="mt-2 grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1"
              >
                {#each POPULAR_ICONS as iconName}
                  {@const IconComponent = getIconComponent(iconName)}
                  <button
                    type="button"
                    class="aspect-square p-2 rounded border hover:bg-accent transition-colors flex items-center justify-center"
                    class:bg-accent={newIcon === iconName}
                    class:border-primary={newIcon === iconName}
                    onclick={() => (newIcon = iconName)}
                  >
                    <IconComponent class="h-5 w-5 flex-shrink-0" />
                  </button>
                {/each}
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <div class="mt-2 flex gap-2 flex-wrap">
                {#each PRESET_COLORS as color}
                  <button
                    type="button"
                    class="w-10 h-10 rounded-full border-2 border-background hover:scale-110 transition-transform relative"
                    class:ring-2={newColor === color}
                    class:ring-primary={newColor === color}
                    class:ring-offset-2={newColor === color}
                    style="background-color: {color}"
                    onclick={() => (newColor = color)}
                  >
                    {#if newColor === color}
                      <Check
                        class="h-5 w-5 text-white absolute inset-0 m-auto"
                      />
                    {/if}
                  </button>
                {/each}
              </div>
            </div>

            <div class="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onclick={handleCancelAdd}>
                Cancel
              </Button>
              <Button size="sm" onclick={handleSaveAdd}>Save</Button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Categories List -->
      <div class="space-y-2">
        {#each categories as category (category.id)}
          {#if editingId === category.id}
            <!-- Edit Mode -->
            <div class="p-4 border rounded-lg bg-muted/30">
              <div class="space-y-4">
                <div>
                  <Label for="edit-name-{category.id}">Name</Label>
                  <Input
                    id="edit-name-{category.id}"
                    bind:value={editName}
                    placeholder="Category name"
                    class="mt-1"
                  />
                </div>

                <div>
                  <Label>Icon</Label>
                  <div
                    class="mt-2 grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1"
                  >
                    {#each POPULAR_ICONS as iconName}
                      {@const IconComponent = getIconComponent(iconName)}
                      <button
                        type="button"
                        class="aspect-square p-2 rounded border hover:bg-accent transition-colors flex items-center justify-center"
                        class:bg-accent={editIcon === iconName}
                        class:border-primary={editIcon === iconName}
                        onclick={() => (editIcon = iconName)}
                      >
                        <IconComponent class="h-5 w-5 flex-shrink-0" />
                      </button>
                    {/each}
                  </div>
                </div>

                <div>
                  <Label>Color</Label>
                  <div class="mt-2 flex gap-2 flex-wrap">
                    {#each PRESET_COLORS as color}
                      <button
                        type="button"
                        class="w-10 h-10 rounded-full border-2 border-background hover:scale-110 transition-transform relative"
                        class:ring-2={editColor === color}
                        class:ring-primary={editColor === color}
                        class:ring-offset-2={editColor === color}
                        style="background-color: {color}"
                        onclick={() => (editColor = color)}
                      >
                        {#if editColor === color}
                          <Check
                            class="h-5 w-5 text-white absolute inset-0 m-auto"
                          />
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>

                <div class="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onclick={() => handleSaveEdit(category.id)}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          {:else}
            <!-- View Mode -->
            {@const IconComponent = getIconComponent(category.icon)}
            {@const expenseCount = getCategoryExpenseCount(category.id)}
            <div
              class="flex items-center justify-between p-3 border rounded-lg transition-colors"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  style="background-color: {category.color}20"
                >
                  <IconComponent
                    class="h-5 w-5"
                    style="color: {category.color}"
                  />
                </div>
                <div>
                  <div class="font-medium">{category.name}</div>
                  <div class="text-xs text-muted-foreground">
                    {expenseCount}
                    {expenseCount === 1 ? "expense" : "expenses"}
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => handleStartEdit(category)}
                  disabled={showAddForm}
                >
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => handleDelete(category)}
                  disabled={showAddForm || editingId !== null}
                >
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          {/if}
        {/each}
      </div>

      {#if categories.length === 0 && !showAddForm}
        <div class="py-8 text-center text-muted-foreground">
          <p>No categories yet. Click "Add Category" to get started!</p>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <div class="flex gap-2 w-full justify-between">
        <Button variant="outline" onclick={() => (open = false)}>Close</Button>
        {#if !showAddForm && !editingId}
          <Button size="sm" onclick={handleStartAdd}>
            <Plus class="mr-2 h-4 w-4" />
            Add Category
          </Button>
        {:else}
          <div></div>
        {/if}
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
