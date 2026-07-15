<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <transition-group name="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto p-4 rounded-xl shadow-premium border flex items-start gap-3 transition-all duration-300 transform',
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800/50 dark:text-emerald-300'
            : toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800/50 dark:text-rose-300'
            : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/90 dark:border-indigo-800/50 dark:text-indigo-300'
        ]"
      >
        <!-- Icons -->
        <span class="mt-0.5 flex-shrink-0">
          <svg
            v-if="toast.type === 'success'"
            class="h-5 w-5 text-emerald-500 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg
            v-else-if="toast.type === 'error'"
            class="h-5 w-5 text-rose-500 dark:text-rose-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg
            v-else
            class="h-5 w-5 text-indigo-500 dark:text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>

        <!-- Content -->
        <div class="flex-1 text-sm font-medium">
          {{ toast.message }}
        </div>

        <!-- Close Button -->
        <button
          @click="store.removeToast(toast.id)"
          class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useAlertStore } from '../stores/alertStore';
import { computed } from 'vue';

const store = useAlertStore();
const toasts = computed(() => store.toasts);
</script>

<style scoped>
.toast-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.toast-list-leave-active {
  position: absolute;
}
</style>
