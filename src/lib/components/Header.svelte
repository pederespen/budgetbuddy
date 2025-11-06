<script lang="ts">
  import logo from "$lib/assets/budgetbuddy_logo.png";
</script>

<header
  class="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="container mx-auto flex h-20 items-center px-4">
    <div class="flex items-center">
      <img src={logo} alt="BudgetBuddy" class="h-14" />
    </div>

    <div class="ml-auto flex items-center gap-2">
      <!-- Future: Add budget selector, settings, etc. -->
    </div>
  </div>
</header>
