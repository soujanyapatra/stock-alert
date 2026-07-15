<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Total Alerts -->
    <div class="glass p-5 rounded-2xl shadow-premium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Alerts</p>
          <h3 class="text-2xl font-bold mt-1 text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors">
            {{ stats.totalAlerts }}
          </h3>
        </div>
        <div class="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
          <BellIcon class="h-6 w-6" />
        </div>
      </div>
    </div>

    <!-- In Stock -->
    <div class="glass p-5 rounded-2xl shadow-premium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Stock</p>
          <h3 class="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {{ stats.inStock }}
          </h3>
        </div>
        <div class="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
          <CheckCircleIcon class="h-6 w-6" />
        </div>
      </div>
    </div>

    <!-- Out of Stock -->
    <div class="glass p-5 rounded-2xl shadow-premium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Out of Stock</p>
          <h3 class="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
            {{ stats.outOfStock }}
          </h3>
        </div>
        <div class="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
          <XCircleIcon class="h-6 w-6" />
        </div>
      </div>
    </div>

    <!-- Last Checked -->
    <div class="glass p-5 rounded-2xl shadow-premium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 col-span-2 lg:col-span-1 group">
      <div class="flex items-center justify-between">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Checked</p>
          <h3 class="text-sm font-semibold mt-2 text-slate-700 dark:text-slate-300 truncate">
            {{ formattedLastChecked }}
          </h3>
        </div>
        <div class="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300 ml-3">
          <ClockIcon class="h-6 w-6" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAlertStore } from '../stores/alertStore';
import { Bell as BellIcon, CheckCircle2 as CheckCircleIcon, XCircle as XCircleIcon, Clock as ClockIcon } from 'lucide-vue-next';

const store = useAlertStore();
const stats = computed(() => store.stats);

const formattedLastChecked = computed(() => {
  if (!stats.value.lastChecked) return 'Never checked';
  
  const date = new Date(stats.value.lastChecked);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
});
</script>
