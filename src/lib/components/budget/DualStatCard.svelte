<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card";
  import type { Snippet } from "svelte";

  let {
    title1,
    value1,
    subtitle1 = undefined,
    icon1 = undefined,
    variant1 = "default",
    title2,
    value2,
    subtitle2 = undefined,
    icon2 = undefined,
    variant2 = "default",
  }: {
    title1: string;
    value1: string;
    subtitle1?: string;
    icon1?: Snippet;
    variant1?: "default" | "success" | "warning" | "danger";
    title2: string;
    value2: string;
    subtitle2?: string;
    icon2?: Snippet;
    variant2?: "default" | "success" | "warning" | "danger";
  } = $props();

  const variantClasses = {
    default: "",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
  };
</script>

<Card class="h-full">
  <CardContent class="h-full flex items-center gap-3 sm:gap-4">
    <!-- First Stat -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1 sm:gap-1.5 mb-0.5">
        {#if icon1}
          <div class="flex-shrink-0 opacity-60">
            {@render icon1()}
          </div>
        {/if}
        <p class="text-xs sm:text-sm font-medium text-muted-foreground">
          {title1}
        </p>
      </div>
      <div
        class="font-bold {variantClasses[
          variant1
        ]} leading-none sm:text-3xl"
      >
        <span class="block sm:hidden" style="font-size: clamp(0.875rem, 4.5vw, 1.25rem);">{value1}</span>
        <span class="hidden sm:block">{value1}</span>
      </div>
      {#if subtitle1}
        <p
          class="text-[10px] sm:text-sm text-muted-foreground mt-0.5 leading-tight"
        >
          {subtitle1}
        </p>
      {/if}
    </div>

    <!-- Divider -->
    <div class="border-l h-14 sm:h-20"></div>

    <!-- Second Stat -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1 sm:gap-1.5 mb-0.5">
        {#if icon2}
          <div class="flex-shrink-0 opacity-60">
            {@render icon2()}
          </div>
        {/if}
        <p class="text-xs sm:text-sm font-medium text-muted-foreground">
          {title2}
        </p>
      </div>
      <div
        class="font-bold {variantClasses[
          variant2
        ]} leading-none sm:text-3xl"
      >
        <span class="block sm:hidden" style="font-size: clamp(0.875rem, 4.5vw, 1.25rem);">{value2}</span>
        <span class="hidden sm:block">{value2}</span>
      </div>
      {#if subtitle2}
        <p
          class="text-[10px] sm:text-sm text-muted-foreground mt-0.5 leading-tight"
        >
          {subtitle2}
        </p>
      {/if}
    </div>
  </CardContent>
</Card>
