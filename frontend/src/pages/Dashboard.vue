<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Top Action Row -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Product Trackers
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor real-time inventory availability and price movements.
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="self-start md:self-auto px-5 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center gap-2 text-sm"
      >
        <PlusIcon class="h-5 w-5" />
        <span>Add Alert</span>
      </button>
    </div>

    <!-- Statistics Cards -->
    <StatsCards />

    <!-- Filters and Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-900/60">
      <!-- Search Input -->
      <div class="relative max-w-sm w-full">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <SearchIcon class="h-4.5 w-4.5" />
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search product or ASIN..."
          class="block w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <!-- Filters Tabs -->
      <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl h-11 border border-slate-200/60 dark:border-slate-800/60 self-start sm:self-auto">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="currentFilter = filter.value"
          :class="[
            'px-3.5 h-9 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center',
            currentFilter === filter.value
              ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Alert List / Skeletons / Empty State -->
    <div class="space-y-4">
      <!-- Skeleton Loaders -->
      <template v-if="store.loading && filteredAlerts.length === 0">
        <div 
          v-for="i in 3" 
          :key="i"
          class="glass rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 animate-pulse flex flex-col sm:flex-row gap-4"
        >
          <div class="w-full sm:w-28 h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div class="flex-1 space-y-3 py-1">
            <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
            <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-900/20 flex justify-between">
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div 
        v-else-if="filteredAlerts.length === 0" 
        class="glass rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800/80 shadow-premium flex flex-col items-center justify-center"
      >
        <div class="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-full text-primary-500 mb-4">
          <ShieldAlertIcon class="h-10 w-10" />
        </div>
        <h3 class="text-lg font-bold text-slate-800 dark:text-white">
          {{ searchQuery || currentFilter !== 'all' ? 'No matches found' : 'No products monitored' }}
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          {{ searchQuery || currentFilter !== 'all' 
             ? 'Try refining your search text or changing status filters.' 
             : 'Start by tracking a product. Enter an Amazon URL to begin automated stock monitoring.' }}
        </p>
        <button
          v-if="!searchQuery && currentFilter === 'all'"
          @click="showCreateModal = true"
          class="mt-6 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          Add First Tracker
        </button>
      </div>

      <!-- Real Cards Grid -->
      <transition-group name="list" tag="div" class="grid grid-cols-1 gap-4" v-else>
        <AlertCard 
          v-for="alert in filteredAlerts" 
          :key="alert.id" 
          :alert="alert" 
        />
      </transition-group>
    </div>

    <!-- Create Alert Modal -->
    <CreateAlertModal 
      :is-open="showCreateModal" 
      @close="showCreateModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAlertStore } from '../stores/alertStore';
import StatsCards from '../components/StatsCards.vue';
import AlertCard from '../components/AlertCard.vue';
import CreateAlertModal from '../components/CreateAlertModal.vue';
import { Plus as PlusIcon, Search as SearchIcon, ShieldAlert as ShieldAlertIcon } from 'lucide-vue-next';

const store = useAlertStore();

const showCreateModal = ref(false);
const searchQuery = ref('');
const currentFilter = ref('all');

const filters = [
  { label: 'All Alerts', value: 'all' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Paused', value: 'paused' },
];

onMounted(() => {
  store.fetchAlerts();
});

const filteredAlerts = computed(() => {
  return store.alerts.filter((alert) => {
    // 1. Text Search Filter
    const searchLower = searchQuery.value.toLowerCase().trim();
    const nameMatch = alert.product?.name?.toLowerCase().includes(searchLower) || false;
    const customNameMatch = alert.customName?.toLowerCase().includes(searchLower) || false;
    const asinMatch = alert.product?.asin?.toLowerCase().includes(searchLower) || false;
    const matchesSearch = !searchLower || nameMatch || customNameMatch || asinMatch;

    if (!matchesSearch) return false;

    // 2. Status Tab Filter
    if (currentFilter.value === 'all') return true;
    if (currentFilter.value === 'paused') return !alert.enabled;
    
    // Status filters require the alert to be enabled
    if (!alert.enabled) return false;
    
    return alert.product?.stockStatus === currentFilter.value;
  });
});
</script>

<style scoped>
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(10px);
}
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
.list-move {
  transition: transform 0.4s ease;
}
</style>
