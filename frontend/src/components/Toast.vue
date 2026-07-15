<template>
  <!-- Stack: bottom on mobile (above safe area), top-right on desktop -->
  <div class="fixed z-[60] flex flex-col gap-2 pointer-events-none
              bottom-4 left-4 right-4
              sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:w-80"
       style="bottom: calc(1rem + env(safe-area-inset-bottom))">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg',
          toast.type === 'success'
            ? 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800/60 text-zinc-800 dark:text-zinc-200'
            : toast.type === 'error'
            ? 'bg-white dark:bg-zinc-900 border-red-200 dark:border-red-800/60 text-zinc-800 dark:text-zinc-200'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
        ]"
      >
        <!-- Dot indicator -->
        <span :class="[
          'mt-0.5 h-2 w-2 rounded-full shrink-0',
          toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-zinc-400'
        ]" />

        <!-- Message -->
        <span class="flex-1 text-xs leading-snug">{{ toast.message }}</span>

        <!-- Dismiss -->
        <button
          @click="store.removeToast(toast.id)"
          class="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAlertStore } from '../stores/alertStore';

const store = useAlertStore();
const toasts = computed(() => store.toasts);
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(8px) scale(0.97); }
.toast-leave-to   { opacity: 0; transform: scale(0.97); }
.toast-leave-active { position: absolute; width: 100%; }
.toast-move { transition: transform 0.2s ease; }
</style>
