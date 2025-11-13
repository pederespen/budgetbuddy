<script lang="ts">
  import type { ComponentType } from "svelte";

  let {
    icon: Icon,
    iconColor,
    label,
    value,
    subtitle,
    variant = "default",
  }: {
    icon: ComponentType;
    iconColor: string;
    label: string;
    value: string;
    subtitle?: string;
    variant?: "default" | "compact";
  } = $props();
</script>

{#if variant === "compact"}
  <!-- Mobile/Compact Variant -->
  <div class="bg-card rounded-lg border p-3">
    <div class="flex items-center gap-2 mb-2">
      <Icon class="h-4 w-4 {iconColor}" />
      <span class="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
    <div class="text-xl font-bold">
      {value}
    </div>
    {#if subtitle}
      <div class="text-xs text-muted-foreground mt-1">
        {subtitle}
      </div>
    {/if}
  </div>
{:else}
  <!-- Desktop Variant -->
  <div class="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-2 mb-3">
      <div class="p-2 rounded-lg" style="background-color: {iconColor}10;">
        <Icon class="h-5 w-5 {iconColor}" />
      </div>
      <span class="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <div class="text-2xl font-bold mb-1">
      {value}
    </div>
    {#if subtitle}
      <div class="text-sm text-muted-foreground">
        {subtitle}
      </div>
    {/if}
  </div>
{/if}
