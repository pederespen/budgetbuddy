<script lang="ts">
  import type { Budget } from "$lib/types";
  import MobileDashboard from "./MobileDashboard.svelte";
  import DesktopDashboard from "./DesktopDashboard.svelte";

  let { budget }: { budget: Budget } = $props();
</script>

<!-- Mobile View -->
<div class="sm:hidden">
  <MobileDashboard {budget} />
</div>

<!-- Desktop View -->
<div class="hidden sm:block">
  <DesktopDashboard {budget} />
</div>
