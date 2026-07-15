<template>
  <!-- Entire card is clickable -->
  <div
    @click="navigateToDetails"
    class="card hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors duration-150 cursor-pointer group"
  >
    <div class="flex gap-4 p-4">

      <!-- Product image -->
      <div class="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
        <img
          :src="alert.product?.image || ''"
          :alt="alert.product?.name"
          class="h-full w-full object-contain p-1.5"
          @error="handleImageError"
        />
      </div>

      <!-- Details -->
      <div class="flex-1 min-w-0 flex flex-col justify-between">
        <!-- Top row: name + price -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ alert.customName || alert.product?.name }}
            </p>
            <p v-if="alert.customName" class="text-xs text-zinc-400 dark:text-zinc-600 truncate mt-0.5">
              {{ alert.product?.name }}
            </p>
            <p class="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">{{ alert.product?.asin }}</p>
          </div>
          <p class="text-base font-display font-bold text-zinc-900 dark:text-zinc-100 shrink-0 tabular-nums">
            {{ formatPrice(alert.product?.currentPrice) }}
          </p>
        </div>

        <!-- Bottom row: status + meta -->
        <div class="flex items-center justify-between gap-3 mt-2.5">
          <!-- Stock badge -->
          <span :class="statusBadgeClass">
            <span :class="['dot-pulse', alert.product?.stockStatus === 'in_stock' ? 'in-stock' : alert.product?.stockStatus === 'out_of_stock' ? 'out-of-stock' : 'unknown']"></span>
            {{ statusLabel }}
          </span>

          <!-- Last checked -->
          <span class="text-xs text-zinc-400 dark:text-zinc-600 shrink-0">
            {{ formattedTime }}
          </span>
        </div>
      </div>
    </div>

    <!-- Card footer: controls (stop propagation so click doesn't navigate) -->
    <div
      class="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800"
      @click.stop
    >
      <!-- Toggle -->
      <label class="flex items-center gap-2 cursor-pointer select-none" @click.stop>
        <button
          role="switch"
          :aria-checked="alert.enabled"
          @click.prevent="handleToggle"
          :class="[
            'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
            alert.enabled ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 shadow ring-0 transition duration-200 ease-in-out',
              alert.enabled ? 'translate-x-4' : 'translate-x-0'
            ]"
          />
        </button>
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ alert.enabled ? 'Active' : 'Paused' }}</span>
      </label>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <a
          :href="alert.product?.url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-icon h-8 w-8"
          title="Open on Amazon"
          @click.stop
        >
          <ExternalLinkIcon class="h-3.5 w-3.5" />
        </a>
        <button @click="handleRefresh" :disabled="isRefreshing" class="btn-icon h-8 w-8 disabled:opacity-40" title="Refresh now">
          <RefreshCwIcon :class="['h-3.5 w-3.5', isRefreshing ? 'animate-spin' : '']" />
        </button>
        <button @click="handleDelete" class="btn-icon-destructive h-8 w-8" title="Delete alert">
          <Trash2Icon class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAlertStore } from '../stores/alertStore';
import type { Alert } from '@shared/types';
import { ExternalLink as ExternalLinkIcon, RefreshCw as RefreshCwIcon, Trash2 as Trash2Icon } from 'lucide-vue-next';

const props = defineProps<{ alert: Alert }>();
const store = useAlertStore();
const router = useRouter();

const isRefreshing = computed(() => store.refreshingIds.includes(props.alert.id));

const navigateToDetails = () => router.push(`/product/${props.alert.productId}`);

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none';
};

const formatPrice = (price?: number) => {
  if (!price) return '—';
  if (props.alert.product?.url.includes('amazon.in'))
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  if (props.alert.product?.url.includes('amazon.co.uk'))
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
};

const statusLabel = computed(() => {
  const s = props.alert.product?.stockStatus;
  if (s === 'in_stock') return 'In Stock';
  if (s === 'out_of_stock') return 'Out of Stock';
  return 'Unknown';
});

const statusBadgeClass = computed(() => {
  const s = props.alert.product?.stockStatus;
  if (s === 'in_stock') return 'badge-in-stock';
  if (s === 'out_of_stock') return 'badge-out-of-stock';
  return 'badge-unknown';
});

const formattedTime = computed(() => {
  const d = props.alert.product?.lastChecked;
  if (!d) return 'never';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ago` : new Date(d).toLocaleDateString();
});

const handleToggle = () => store.toggleAlert(props.alert.id, !props.alert.enabled);
const handleRefresh = () => store.refreshAlert(props.alert.id, props.alert.productId);
const handleDelete = () => {
  if (confirm(`Delete tracker for "${props.alert.customName || props.alert.product?.name}"?`))
    store.deleteAlert(props.alert.id);
};
</script>
