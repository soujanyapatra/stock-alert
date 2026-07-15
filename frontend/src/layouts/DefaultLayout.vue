<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass shadow-sm border-b border-slate-200/60 dark:border-slate-800/40">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 group">
          <div class="p-2 bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-xl text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="font-extrabold text-xl bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
            StockAlert
          </span>
        </router-link>

        <!-- Right Side Nav Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Refresh All Button -->
          <button
            @click="triggerAllRefresh"
            :disabled="store.globalRefreshing"
            class="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-900 bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-900/90 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800/80 transition-all text-xs font-bold shadow-sm"
            title="Refresh all enabled alerts now"
          >
            <RefreshCwIcon :class="['h-3.5 w-3.5', store.globalRefreshing ? 'animate-spin text-primary-500' : '']" />
            <span>{{ store.globalRefreshing ? 'Updating...' : 'Check All' }}</span>
          </button>

          <!-- Toggle Theme -->
          <button
            @click="toggleDark"
            class="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-900/90 dark:text-slate-400 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800/80 transition-all shadow-sm"
            aria-label="Toggle theme"
          >
            <SunIcon v-if="isDark" class="h-4 w-4" />
            <MoonIcon v-else class="h-4 w-4" />
          </button>

          <!-- Mobile Refresh All icon button -->
          <button
            @click="triggerAllRefresh"
            :disabled="store.globalRefreshing"
            class="sm:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-700 bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-900/90 dark:text-slate-400 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800/80 transition-all shadow-sm"
            title="Refresh All"
          >
            <RefreshCwIcon :class="['h-4 w-4', store.globalRefreshing ? 'animate-spin text-primary-500' : '']" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="py-6 border-t border-slate-200/60 dark:border-slate-900/80 text-center text-xs text-slate-400 dark:text-slate-600">
      <div class="max-w-6xl mx-auto px-4">
        &copy; 2026 StockAlert Availability Tracker. Designed for speed & dependability.
      </div>
    </footer>

    <!-- Toast stack manager -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { useDark } from '../composables/useDark';
import { useAlertStore } from '../stores/alertStore';
import Toast from '../components/Toast.vue';
import { Sun as SunIcon, Moon as MoonIcon, RefreshCw as RefreshCwIcon } from 'lucide-vue-next';

const { isDark, toggleDark } = useDark();
const store = useAlertStore();

const triggerAllRefresh = () => {
  store.triggerGlobalRefresh();
};
</script>
