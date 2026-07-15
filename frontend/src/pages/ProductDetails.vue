<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Back Navigation -->
    <router-link
      to="/"
      class="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-sm font-semibold"
    >
      <ArrowLeftIcon class="h-4.5 w-4.5" />
      <span>Back to Dashboard</span>
    </router-link>

    <!-- Error State -->
    <div v-if="error" class="glass p-6 rounded-2xl border border-rose-200 dark:border-rose-950/40 text-center">
      <div class="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-full text-rose-500 inline-block mb-3">
        <AlertTriangleIcon class="h-8 w-8" />
      </div>
      <h3 class="text-base font-bold text-slate-800 dark:text-white">Failed to load product details</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ error }}</p>
      <router-link to="/" class="mt-4 inline-block px-4 py-2 bg-primary-500 text-white text-xs font-semibold rounded-xl">
        Go Back
      </router-link>
    </div>

    <!-- Loading Skeleton -->
    <div v-else-if="loading" class="space-y-6">
      <div class="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col md:flex-row gap-6">
        <div class="w-full md:w-44 h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div class="flex-1 space-y-4 py-2">
          <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
          <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        </div>
      </div>
      <div class="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
        <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div class="space-y-3">
          <div class="h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div class="h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <template v-else-if="product">
      <!-- Product Summary Card -->
      <div class="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-premium flex flex-col md:flex-row gap-6">
        <!-- Image -->
        <div class="w-full md:w-44 h-44 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/60 flex items-center justify-center flex-shrink-0 relative">
          <img
            :src="product.image || 'https://via.placeholder.com/150?text=No+Image'"
            :alt="product.name"
            class="max-w-full max-h-full object-contain"
            @error="handleImageError"
          />
        </div>

        <!-- Info -->
        <div class="flex-1 flex flex-col justify-between">
          <div class="space-y-2">
            <span class="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-widest bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30">
              Amazon ASIN: {{ product.asin }}
            </span>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {{ product.name }}
            </h1>
            
            <div class="flex flex-wrap items-center gap-3 pt-1">
              <!-- Price -->
              <span class="text-3xl font-extrabold text-slate-950 dark:text-white">
                {{ formatPrice(product.currentPrice) }}
              </span>

              <!-- Availability Badge -->
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                  product.stockStatus === 'in_stock'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40'
                    : product.stockStatus === 'out_of_stock'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800'
                ]"
              >
                {{ product.stockStatus === 'in_stock' ? 'In Stock' : product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Unknown' }}
              </span>
            </div>
          </div>

          <!-- Bottom Actions / Meta -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-900/40 mt-4">
            <div class="text-xs text-slate-400 dark:text-slate-500">
              <p>Last checked: <span class="font-semibold text-slate-600 dark:text-slate-300">{{ formatFullDate(product.lastChecked) }}</span></p>
              <a
                :href="product.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-0.5 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold mt-1"
              >
                <ExternalLinkIcon class="h-3.5 w-3.5" />
                View original page on Amazon
              </a>
            </div>

            <!-- Refresh Button -->
            <button
              @click="refreshProduct"
              :disabled="refreshing"
              class="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCwIcon :class="['h-4 w-4', refreshing ? 'animate-spin text-primary-500' : '']" />
              <span>{{ refreshing ? 'Refreshing...' : 'Refresh Now' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- History Timeline Section -->
      <div class="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-premium space-y-6">
        <h2 class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ClockIcon class="h-5 w-5 text-indigo-500" />
          Price & Availability History
        </h2>

        <!-- Empty History State -->
        <div v-if="history.length === 0" class="text-center py-8 text-slate-400 dark:text-slate-600">
          No history entries logged yet.
        </div>

        <!-- History Timeline -->
        <div v-else class="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6 py-2">
          <div
            v-for="(entry, index) in history"
            :key="entry.id"
            class="relative"
          >
            <!-- Timeline Bullet -->
            <span
              :class="[
                'absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center',
                entry.stockStatus === 'in_stock' ? 'bg-emerald-500' : entry.stockStatus === 'out_of_stock' ? 'bg-rose-500' : 'bg-slate-400'
              ]"
            ></span>

            <!-- Timeline Content Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/40 dark:bg-slate-900/20 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
              <div>
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span class="text-slate-900 dark:text-white font-bold text-base">
                    {{ formatPrice(entry.price) }}
                  </span>
                  
                  <!-- Price Diff Badge -->
                  <span 
                    v-if="getPriceDiff(entry, index)" 
                    :class="[
                      'inline-flex items-center gap-0.5 text-2xs font-extrabold px-1.5 py-0.5 rounded',
                      getPriceDiff(entry, index)!.type === 'drop' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-400'
                    ]"
                  >
                    <ArrowDownIcon v-if="getPriceDiff(entry, index)!.type === 'drop'" class="h-3 w-3" />
                    <ArrowUpIcon v-else class="h-3 w-3" />
                    {{ getPriceDiff(entry, index)!.diffText }}
                  </span>
                </p>
                
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Checked on {{ formatFullDate(entry.checkedAt) }}
                </p>
              </div>

              <!-- Status Info -->
              <div class="flex items-center gap-2 self-start sm:self-auto">
                <span
                  :class="[
                    'text-2xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    entry.stockStatus === 'in_stock'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : entry.stockStatus === 'out_of_stock'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'
                  ]"
                >
                  {{ entry.stockStatus === 'in_stock' ? 'In Stock' : entry.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Unknown' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAlertStore } from '../stores/alertStore';
import type { Product, HistoryEntry } from '@shared/types';
import { ArrowLeft as ArrowLeftIcon, AlertTriangle as AlertTriangleIcon, Clock as ClockIcon, ExternalLink as ExternalLinkIcon, RefreshCw as RefreshCwIcon, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon } from 'lucide-vue-next';

const props = defineProps<{
  id: string; // Passed as prop from router path: :id
}>();

const route = useRoute();
const store = useAlertStore();

const product = ref<Product | null>(null);
const history = ref<HistoryEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const refreshing = ref(false);

const productId = computed(() => parseInt(props.id || (route.params.id as string), 10));

const fetchDetails = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/products/${productId.value}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch product history.');
    }
    const data = await res.json();
    product.value = data.product;
    history.value = data.history;
  } catch (err: any) {
    error.value = err.message || 'Error occurred while loading product details.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDetails();
});

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = 'https://via.placeholder.com/150?text=No+Image';
};

const formatPrice = (price?: number) => {
  if (price === undefined || price === null || price === 0) return 'N/A';
  const isIndia = product.value?.url.includes('amazon.in');
  const isUK = product.value?.url.includes('amazon.co.uk');

  if (isIndia) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  }
  if (isUK) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
};

const formatFullDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPriceDiff = (entry: HistoryEntry, index: number) => {
  // history is ordered DESC, so index + 1 is the chronologically older item.
  if (index + 1 >= history.value.length) return null;
  
  const prevEntry = history.value[index + 1];
  const diff = entry.price - prevEntry.price;
  
  if (diff === 0 || entry.price === 0 || prevEntry.price === 0) return null;
  
  const absDiff = Math.abs(diff);
  const diffText = formatPrice(absDiff);

  return {
    type: diff < 0 ? 'drop' : 'hike',
    diffText
  };
};

const refreshProduct = async () => {
  refreshing.value = true;
  try {
    const response = await fetch('/api/scheduler/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId: productId.value }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to refresh product details.');
    }

    store.addToast('Product refreshed successfully!', 'success');
    await fetchDetails();
  } catch (err: any) {
    store.addToast(err.message || 'Failed to refresh product.', 'error');
  } finally {
    refreshing.value = false;
  }
};
</script>
