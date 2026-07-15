<template>
  <div class="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">

    <!-- ── Header ─────────────────────────────────────────── -->
    <header class="header-bar sticky top-0 z-40" style="padding-top: env(safe-area-inset-top)">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 shrink-0 group">
          <div class="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center group-hover:opacity-80 transition-opacity">
            <svg class="h-3.5 w-3.5 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="font-display font-bold text-base text-zinc-900 dark:text-zinc-100">
            StockAlert
          </span>
        </router-link>

        <!-- Right actions -->
        <div class="flex items-center gap-2">
          <button
            @click="triggerAllRefresh"
            :disabled="store.globalRefreshing"
            class="btn-icon disabled:opacity-40"
            :title="store.globalRefreshing ? 'Checking…' : 'Check all alerts now'"
          >
            <RefreshCwIcon :class="['h-4 w-4', store.globalRefreshing ? 'animate-spin' : '']" />
          </button>

          <button @click="toggleDark" class="btn-icon" aria-label="Toggle dark mode">
            <SunIcon v-if="isDark" class="h-4 w-4" />
            <MoonIcon v-else class="h-4 w-4" />
          </button>
        </div>

      </div>
    </header>

    <!-- ── Content ────────────────────────────────────────── -->
    <main class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom))">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- ── Footer (desktop) ──────────────────────────────── -->
    <footer class="hidden sm:block border-t border-zinc-200 dark:border-zinc-800 py-4">
      <div class="max-w-5xl mx-auto px-6 flex items-center justify-between">
        <span class="text-xs text-zinc-400 dark:text-zinc-600">&copy; 2026 StockAlert</span>
        <span class="text-xs text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
          Operational
        </span>
      </div>
    </footer>

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
const triggerAllRefresh = () => store.triggerGlobalRefresh();
</script>
