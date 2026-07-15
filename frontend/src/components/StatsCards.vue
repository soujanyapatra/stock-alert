<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">

    <div class="card px-4 py-4">
      <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tracking</p>
      <p class="mt-1 text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{{ stats.totalAlerts }}</p>
    </div>

    <div class="card px-4 py-4">
      <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">In Stock</p>
      <p class="mt-1 text-2xl font-display font-bold text-emerald-600 dark:text-emerald-500 tabular-nums">{{ stats.inStock }}</p>
    </div>

    <div class="card px-4 py-4">
      <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Out of Stock</p>
      <p class="mt-1 text-2xl font-display font-bold text-red-600 dark:text-red-500 tabular-nums">{{ stats.outOfStock }}</p>
    </div>

    <div class="card px-4 py-4 col-span-2 sm:col-span-1">
      <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Last Checked</p>
      <p class="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{{ formattedLastChecked }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAlertStore } from '../stores/alertStore';

const store = useAlertStore();
const stats = computed(() => store.stats);

const formattedLastChecked = computed(() => {
  if (!stats.value.lastChecked) return 'Never';
  const date = new Date(stats.value.lastChecked);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const h = Math.floor(diffMins / 60);
  return h < 24 ? `${h}h ago` : date.toLocaleDateString();
});
</script>
