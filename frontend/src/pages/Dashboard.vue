<template>
  <div class="space-y-6">

    <!-- ── Page header ────────────────────────────────────── -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100">Trackers</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Amazon stock &amp; price monitoring</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary shrink-0" id="btn-add-alert">
        <PlusIcon class="h-4 w-4" />
        <span class="hidden sm:inline">Add Alert</span>
        <span class="sm:hidden">Add</span>
      </button>
    </div>

    <!-- ── Stats ──────────────────────────────────────────── -->
    <StatsCards />

    <!-- ── Toolbar ────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row gap-2">

      <!-- Search -->
      <div class="relative flex-1">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search product or ASIN…"
          class="input pl-9 h-9 text-sm w-full"
        />
      </div>

      <!-- Filter tabs -->
      <div class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 shrink-0 overflow-x-auto scrollbar-hide">
        <button
          v-for="f in filters"
          :key="f.value"
          @click="currentFilter = f.value"
          :class="[
            'px-3 h-7 rounded-md text-xs font-medium whitespace-nowrap transition-colors duration-100 flex-shrink-0',
            currentFilter === f.value
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          ]"
        >
          {{ f.label }}
        </button>
      </div>

    </div>

    <!-- ── List ───────────────────────────────────────────── -->

    <!-- Skeletons -->
    <template v-if="store.loading && !store.alerts.length">
      <div class="space-y-2">
        <div v-for="i in 3" :key="i" class="card p-4 flex gap-4">
          <div class="skeleton h-16 w-16 rounded-lg shrink-0"></div>
          <div class="flex-1 space-y-2 py-0.5">
            <div class="skeleton h-3.5 w-3/5 rounded"></div>
            <div class="skeleton h-3 w-2/5 rounded"></div>
            <div class="skeleton h-5 w-1/3 rounded mt-1"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty -->
    <div v-else-if="filteredAlerts.length === 0" class="card py-12 px-6 text-center max-w-sm mx-auto">
      <ShieldAlertIcon class="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
      <p class="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
        {{ searchQuery || currentFilter !== 'all' ? 'No results' : 'No trackers yet' }}
      </p>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        {{ searchQuery || currentFilter !== 'all'
          ? 'Adjust your search or filter.'
          : 'Add an Amazon product URL to get started.' }}
      </p>
      <button v-if="!searchQuery && currentFilter === 'all'" @click="showCreateModal = true" class="btn-primary mt-5 w-full">
        <PlusIcon class="h-4 w-4" />
        Add your first tracker
      </button>
    </div>

    <!-- Cards -->
    <transition-group v-else name="list" tag="div" class="space-y-2">
      <AlertCard v-for="alert in filteredAlerts" :key="alert.id" :alert="alert" />
    </transition-group>

    <CreateAlertModal :is-open="showCreateModal" @close="showCreateModal = false" />
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
  { label: 'All', value: 'all' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Paused', value: 'paused' },
];

onMounted(() => store.fetchAlerts());

const filteredAlerts = computed(() =>
  store.alerts.filter((a) => {
    const q = searchQuery.value.toLowerCase().trim();
    if (q) {
      const hit = a.product?.name?.toLowerCase().includes(q)
        || a.customName?.toLowerCase().includes(q)
        || a.product?.asin?.toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (currentFilter.value === 'all') return true;
    if (currentFilter.value === 'paused') return !a.enabled;
    if (!a.enabled) return false;
    return a.product?.stockStatus === currentFilter.value;
  })
);
</script>
