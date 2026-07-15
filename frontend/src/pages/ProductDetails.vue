<template>
  <div class="space-y-5">

    <!-- Back link -->
    <router-link to="/" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
      <ArrowLeftIcon class="h-4 w-4" />
      Back
    </router-link>

    <!-- Error -->
    <div v-if="error" class="card p-6 text-center max-w-sm mx-auto">
      <AlertTriangleIcon class="h-8 w-8 text-red-500 mx-auto mb-3" />
      <p class="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Failed to load</p>
      <p class="text-xs text-zinc-500 mt-1">{{ error }}</p>
      <router-link to="/" class="btn-outline mt-4 w-full justify-center">Go back</router-link>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="space-y-4">
      <div class="card p-5 flex flex-col sm:flex-row gap-5">
        <div class="skeleton h-36 w-36 rounded-xl shrink-0 mx-auto sm:mx-0"></div>
        <div class="flex-1 space-y-3 py-1">
          <div class="skeleton h-4 w-1/3 rounded"></div>
          <div class="skeleton h-5 w-4/5 rounded"></div>
          <div class="skeleton h-7 w-1/4 rounded mt-2"></div>
        </div>
      </div>
      <div class="card p-5 space-y-3">
        <div class="skeleton h-4 w-1/4 rounded"></div>
        <div class="skeleton h-12 rounded"></div>
        <div class="skeleton h-12 rounded"></div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="product">

      <!-- Product card -->
      <div class="card p-5">
        <div class="flex flex-col sm:flex-row gap-5">

          <!-- Image -->
          <div class="h-36 w-36 shrink-0 mx-auto sm:mx-0 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden p-2">
            <img
              :src="product.image"
              :alt="product.name"
              class="h-full w-full object-contain"
              @error="handleImageError"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 flex flex-col justify-between min-w-0">
            <div class="space-y-2">
              <p class="text-xs font-medium text-zinc-400 dark:text-zinc-600 font-mono">{{ product.asin }}</p>
              <h1 class="text-lg font-display font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {{ product.name }}
              </h1>
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <span class="text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {{ formatPrice(product.currentPrice) }}
                </span>
                <span :class="statusBadgeClass">
                  <span :class="['dot-pulse', product.stockStatus === 'in_stock' ? 'in-stock' : product.stockStatus === 'out_of_stock' ? 'out-of-stock' : 'unknown']"></span>
                  {{ statusLabel }}
                </span>
              </div>
            </div>

            <!-- Meta + refresh -->
            <div class="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div class="space-y-0.5">
                <p class="text-xs text-zinc-400 dark:text-zinc-600">
                  Last checked <span class="text-zinc-600 dark:text-zinc-400 font-medium">{{ formatDate(product.lastChecked) }}</span>
                </p>
                <a :href="product.url" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  <ExternalLinkIcon class="h-3 w-3" />
                  View on Amazon
                </a>
              </div>
              <button @click="refreshProduct" :disabled="refreshing" class="btn-outline shrink-0">
                <RefreshCwIcon :class="['h-4 w-4', refreshing ? 'animate-spin' : '']" />
                <span class="text-xs">{{ refreshing ? 'Refreshing…' : 'Refresh' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="card">
        <div class="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Price &amp; Availability History</h2>
        </div>

        <!-- Empty -->
        <div v-if="history.length === 0" class="py-10 text-center">
          <p class="text-sm text-zinc-400 dark:text-zinc-600">No history logged yet.</p>
        </div>

        <!-- Timeline -->
        <div v-else class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <div
            v-for="(entry, index) in history"
            :key="entry.id"
            class="flex items-center justify-between px-5 py-3.5 gap-4"
          >
            <!-- Left: price + diff + date -->
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-display font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{{ formatPrice(entry.price) }}</span>

                <!-- Price diff -->
                <span v-if="getPriceDiff(entry, index)" :class="[
                  'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded',
                  getPriceDiff(entry, index)!.type === 'drop'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                ]">
                  <ArrowDownIcon v-if="getPriceDiff(entry, index)!.type === 'drop'" class="h-3 w-3" />
                  <ArrowUpIcon v-else class="h-3 w-3" />
                  {{ getPriceDiff(entry, index)!.diffText }}
                </span>
              </div>
              <p class="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">{{ formatDate(entry.checkedAt) }}</p>
            </div>

            <!-- Right: status badge -->
            <span :class="entry.stockStatus === 'in_stock' ? 'badge-in-stock' : entry.stockStatus === 'out_of_stock' ? 'badge-out-of-stock' : 'badge-unknown'" class="shrink-0">
              {{ entry.stockStatus === 'in_stock' ? 'In Stock' : entry.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Unknown' }}
            </span>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAlertStore } from '../stores/alertStore';
import type { Product, HistoryEntry } from '@shared/types';
import {
  ArrowLeft as ArrowLeftIcon,
  AlertTriangle as AlertTriangleIcon,
  ExternalLink as ExternalLinkIcon,
  RefreshCw as RefreshCwIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
} from 'lucide-vue-next';

const props = defineProps<{ id: string }>();
const route = useRoute();
const store = useAlertStore();

const product = ref<Product | null>(null);
const history = ref<HistoryEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const refreshing = ref(false);

const productId = computed(() => props.id || (route.params.id as string));

const fetchDetails = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/products/${productId.value}`);
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to load.');
    const data = await res.json();
    product.value = data.product;
    history.value = data.history;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchDetails);

const handleImageError = (e: Event) => { (e.target as HTMLImageElement).style.display = 'none'; };

const formatPrice = (price?: number) => {
  if (!price) return '—';
  if (product.value?.url.includes('amazon.in'))
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  if (product.value?.url.includes('amazon.co.uk'))
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
};

const formatDate = (d?: string) => {
  if (!d) return '';
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusLabel = computed(() => {
  const s = product.value?.stockStatus;
  return s === 'in_stock' ? 'In Stock' : s === 'out_of_stock' ? 'Out of Stock' : 'Unknown';
});

const statusBadgeClass = computed(() => {
  const s = product.value?.stockStatus;
  return s === 'in_stock' ? 'badge-in-stock' : s === 'out_of_stock' ? 'badge-out-of-stock' : 'badge-unknown';
});

const getPriceDiff = (entry: HistoryEntry, index: number) => {
  if (index + 1 >= history.value.length) return null;
  const prev = history.value[index + 1];
  const diff = entry.price - prev.price;
  if (diff === 0 || !entry.price || !prev.price) return null;
  return { type: diff < 0 ? 'drop' : 'hike', diffText: formatPrice(Math.abs(diff)) };
};

const refreshProduct = async () => {
  refreshing.value = true;
  try {
    const res = await fetch('/api/scheduler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: productId.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Refresh failed.');
    store.addToast('Refreshed successfully', 'success');
    await fetchDetails();
  } catch (e: any) {
    store.addToast(e.message || 'Refresh failed.', 'error');
  } finally {
    refreshing.value = false;
  }
};
</script>
