<template>
  <div 
    @click="navigateToDetails"
    class="glass rounded-2xl shadow-premium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border border-slate-200 dark:border-slate-800/80 cursor-pointer overflow-hidden group flex flex-col"
  >
    <!-- Top Content Area -->
    <div class="p-5 flex flex-col sm:flex-row gap-5">
      <!-- Product Image -->
      <div class="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800/50 flex-shrink-0 relative shadow-sm">
        <img
          :src="alert.product?.image || 'https://via.placeholder.com/150?text=No+Image'"
          :alt="alert.product?.name"
          class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
          @error="handleImageError"
        />
      </div>

      <!-- Product Details -->
      <div class="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <!-- Titles -->
            <div class="min-w-0 flex-1">
              <h4 class="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg leading-snug truncate group-hover:text-primary-500 transition-colors">
                {{ alert.customName || alert.product?.name }}
              </h4>
              <p v-if="alert.customName" class="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                {{ alert.product?.name }}
              </p>
            </div>

            <!-- Price -->
            <div class="text-left sm:text-right flex-shrink-0 mt-1 sm:mt-0">
              <span class="font-black text-slate-900 dark:text-white text-xl tracking-tight">
                {{ formatPrice(alert.product?.currentPrice) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Stock Status Pill -->
        <div class="mt-3 flex items-center">
          <span
            :class="[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-extrabold uppercase tracking-widest border',
              alert.product?.stockStatus === 'in_stock'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/40'
                : alert.product?.stockStatus === 'out_of_stock'
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/40'
                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
            ]"
          >
            <!-- Dot -->
            <span
              :class="[
                'h-1.5 w-1.5 rounded-full',
                alert.product?.stockStatus === 'in_stock' ? 'bg-emerald-500' : alert.product?.stockStatus === 'out_of_stock' ? 'bg-rose-500' : 'bg-slate-400'
              ]"
            ></span>
            {{ alert.product?.stockStatus === 'in_stock' ? 'In Stock' : alert.product?.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Unknown' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Actions / Footer -->
    <div 
      class="bg-slate-50/60 dark:bg-slate-900/30 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-900/40"
      @click.stop
    >
      <!-- Metadata -->
      <div class="flex items-center gap-3 text-2xs text-slate-450 dark:text-slate-500">
        <span class="flex items-center gap-1 font-medium">
          <ClockIcon class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          Checked {{ formattedTime }}
        </span>
        <span class="text-slate-200 dark:text-slate-800">|</span>
        <a
          :href="alert.product?.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-0.5 text-primary-500 hover:text-primary-650 dark:text-primary-400 dark:hover:text-primary-300 font-bold transition-colors"
        >
          <ExternalLinkIcon class="h-3.5 w-3.5" />
          Amazon Link
        </a>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-between sm:justify-end gap-4">
        <!-- Switch Toggle -->
        <label class="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            :checked="alert.enabled"
            @change="handleToggle"
            class="sr-only peer"
          />
          <div class="w-8.5 h-4.5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-500/20 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:after:border-transparent peer-checked:bg-primary-500"></div>
          <span class="ml-1.5 text-2xs font-bold text-slate-500 dark:text-slate-455">
            {{ alert.enabled ? 'Active' : 'Paused' }}
          </span>
        </label>

        <!-- Buttons Panel -->
        <div class="flex items-center gap-2">
          <!-- Refresh -->
          <button
            @click="handleRefresh"
            :disabled="isRefreshing"
            class="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250 border border-slate-200 dark:border-slate-800/80 transition-all duration-200 shadow-sm"
            title="Refresh Stock Status Now"
          >
            <RefreshCwIcon :class="['h-3.5 w-3.5', isRefreshing ? 'animate-spin text-primary-500' : '']" />
          </button>

          <!-- Delete -->
          <button
            @click="handleDelete"
            class="p-2 rounded-xl bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 border border-rose-100/40 dark:border-rose-900/30 transition-all duration-200 shadow-sm"
            title="Delete Alert"
          >
            <Trash2Icon class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAlertStore } from '../stores/alertStore';
import type { Alert } from '@shared/types';
import { Clock as ClockIcon, ExternalLink as ExternalLinkIcon, RefreshCw as RefreshCwIcon, Trash2 as Trash2Icon } from 'lucide-vue-next';

const props = defineProps<{
  alert: Alert;
}>();

const store = useAlertStore();
const router = useRouter();

const isRefreshing = computed(() => store.refreshingIds.includes(props.alert.id));

const navigateToDetails = () => {
  router.push(`/product/${props.alert.productId}`);
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = 'https://via.placeholder.com/150?text=No+Image';
};

const formatPrice = (price?: number) => {
  if (price === undefined || price === null || price === 0) return 'Price N/A';
  const isIndia = props.alert.product?.url.includes('amazon.in');
  const isUK = props.alert.product?.url.includes('amazon.co.uk');

  if (isIndia) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  }
  if (isUK) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
};

const formattedTime = computed(() => {
  const dateStr = props.alert.product?.lastChecked;
  if (!dateStr) return 'never';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1m ago';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
});

const handleToggle = () => {
  store.toggleAlert(props.alert.id, !props.alert.enabled);
};

const handleRefresh = () => {
  store.refreshAlert(props.alert.id, props.alert.productId);
};

const handleDelete = () => {
  if (confirm(`Stop tracking and delete alert for "${props.alert.customName || props.alert.product?.name}"?`)) {
    store.deleteAlert(props.alert.id);
  }
};
</script>
