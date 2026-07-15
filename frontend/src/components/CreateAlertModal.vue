<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 dark:bg-black/60" @click="close" />

      <!-- Panel — bottom sheet on mobile, centered dialog on desktop -->
      <div class="modal-panel relative w-full sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 sm:rounded-xl shadow-xl overflow-hidden z-10 rounded-t-2xl sm:rounded-t-xl">

        <!-- Handle (mobile sheet indicator) -->
        <div class="sm:hidden flex justify-center pt-3 pb-1">
          <div class="h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Track new product</h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Paste an Amazon product URL below</p>
          </div>
          <button @click="close" :disabled="submitting" class="btn-icon h-8 w-8 ml-3 shrink-0">
            <XIcon class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="px-5 py-4 space-y-4">

          <!-- URL field -->
          <div class="space-y-1.5">
            <label for="modal-url" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Amazon URL
            </label>
            <div class="relative">
              <LinkIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                id="modal-url"
                v-model="url"
                type="url"
                placeholder="https://www.amazon.com/dp/…"
                class="input pl-9 h-10 text-sm"
                required
                :disabled="submitting"
                autocomplete="off"
              />
            </div>
            <p v-if="validationError" class="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircleIcon class="h-3 w-3 shrink-0" />
              {{ validationError }}
            </p>
          </div>

          <!-- Custom name -->
          <div class="space-y-1.5">
            <label for="modal-name" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Custom name <span class="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              id="modal-name"
              v-model="customName"
              type="text"
              placeholder="e.g. My headphones"
              class="input h-10 text-sm"
              :disabled="submitting"
            />
          </div>

          <!-- Scraping progress -->
          <div v-if="submitting" class="flex items-start gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3">
            <Loader2Icon class="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-xs font-medium text-zinc-800 dark:text-zinc-200">Fetching product details…</p>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">This can take up to 15 seconds.</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button type="button" @click="close" :disabled="submitting" class="btn-outline flex-1 justify-center h-10 text-xs">
              Cancel
            </button>
            <button type="submit" :disabled="submitting" class="btn-primary flex-1 justify-center h-10 text-xs">
              <Loader2Icon v-if="submitting" class="h-3.5 w-3.5 animate-spin" />
              <span>{{ submitting ? 'Adding…' : 'Add Alert' }}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAlertStore } from '../stores/alertStore';
import { X as XIcon, Link as LinkIcon, AlertCircle as AlertCircleIcon, Loader2 as Loader2Icon } from 'lucide-vue-next';

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const store = useAlertStore();
const url = ref('');
const customName = ref('');
const validationError = ref('');
const submitting = ref(false);

const close = () => {
  if (submitting.value) return;
  url.value = '';
  customName.value = '';
  validationError.value = '';
  emit('close');
};

const handleSubmit = async () => {
  validationError.value = '';
  try {
    new URL(url.value);
    if (!url.value.includes('amazon.')) throw new Error();
  } catch {
    validationError.value = 'Enter a valid Amazon product URL';
    return;
  }
  submitting.value = true;
  const ok = await store.createAlert(url.value, customName.value);
  submitting.value = false;
  if (ok) close();
};
</script>
