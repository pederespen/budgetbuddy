<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card";
  import type { Snippet } from "svelte";

  let {
    title,
    value,
    subtitle = undefined,
    icon = undefined,
    trend = undefined,
    variant = "default",
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon?: Snippet;
    trend?: { value: string; positive: boolean };
    variant?: "default" | "success" | "warning" | "danger";
  } = $props();

  const variantClasses = {
    default: "",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
  };
</script>

<Card class="h-full">
  <CardContent class="h-full flex items-center p-4 sm:p-2.5">
    <div class="flex items-center justify-between gap-3 w-full">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </p>
        <div class="font-bold {variantClasses[variant]} leading-none sm:text-3xl">
          <span class="block sm:hidden" style="font-size: clamp(1rem, 5vw, 1.5rem);">{value}</span>
          <span class="hidden sm:block">{value}</span>
        </div>
        {#if subtitle}
          <p class="text-sm text-muted-foreground mt-1 leading-tight">
            {subtitle}
          </p>
        {/if}
        {#if trend}
          <p
            class="text-sm mt-1 {trend.positive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'}"
          >
            {trend.value}
          </p>
        {/if}
      </div>
      {#if icon}
        <div class="flex-shrink-0 opacity-40">
          {@render icon()}
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
