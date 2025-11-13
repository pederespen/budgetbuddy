<script lang="ts" generics="Item">
  import type { Snippet } from "svelte";

  type Props = {
    items: Item[];
    itemHeight: number;
    height: string;
    overscan?: number;
    children: Snippet<[Item, number]>;
  };

  let { items, itemHeight, height, overscan = 5, children }: Props = $props();

  let scrollTop = $state(0);
  let containerEl: HTMLDivElement;

  // Calculate visible range
  const visibleRange = $derived(() => {
    const containerHeight = parseInt(height.replace("px", "")) || window.innerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  });

  const visibleItems = $derived(() => {
    const { startIndex, endIndex } = visibleRange();
    return items.slice(startIndex, endIndex + 1).map((item, idx) => ({
      item,
      index: startIndex + idx,
    }));
  });

  const totalHeight = $derived(items.length * itemHeight);
  const offsetY = $derived(visibleRange().startIndex * itemHeight);

  function handleScroll(e: Event) {
    scrollTop = (e.target as HTMLDivElement).scrollTop;
  }
</script>

<div bind:this={containerEl} class="overflow-auto" style:height onscroll={handleScroll}>
  <div style:height="{totalHeight}px" style:position="relative">
    <div style:transform="translateY({offsetY}px)">
      {#each visibleItems() as { item, index } (index)}
        <div style:height="{itemHeight}px">
          {@render children(item, index)}
        </div>
      {/each}
    </div>
  </div>
</div>
