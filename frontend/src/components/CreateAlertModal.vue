<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-40 overflow-y-auto flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" @click="close"></div>

      <!-- Modal Card -->
      <div class="glass relative rounded-2xl w-full max-w-lg shadow-2xl p-6 overflow-hidden transform transition-all duration-300 z-50 border border-slate-200 dark:border-slate-800">
        <!-- Close Button -->
        <button
          @click="close"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          :disabled="submitting"
        >
          <XIcon class="h-6 w-6" />
        </button>

        <h3 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <PlusIcon class="h-6 w-6 text-primary-500" />
          Track New Product
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Paste an Amazon product URL to monitor its stock status and price.
        </p>

        <form @submit.prevent="handleSubmit" class="mt-6 space-y-4">
          <!-- URL Input -->
          <div>
            <label for="url" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Amazon Product URL
            </label>
            <div class="mt-1.5 relative rounded-xl shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon class="h-5 w-5" />
              </div>
              <input
                type="text"
                id="url"
                v-model="url"
                class="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                placeholder="https://www.amazon.com/dp/..."
                required
                :disabled="submitting"
              />
            </div>
            <p v-if="validationError" class="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
              <AlertTriangleIcon class="h-3.5 w-3.5" />
              {{ validationError }}
            </p>
          </div>

          <!-- Custom Name Input -->
          <div>
            <label for="customName" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Custom Name <span class="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              id="customName"
              v-model="customName"
              class="mt-1.5 block w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              placeholder="e.g. My Favorite Headphones"
              :disabled="submitting"
            />
          </div>

          <!-- Progress / Scrape State -->
          <div v-if="submitting" class="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800/40">
            <Loader2Icon class="h-5 w-5 animate-spin text-primary-500 flex-shrink-0" />
            <div class="text-xs text-slate-500 dark:text-slate-400">
              <p class="font-medium text-slate-700 dark:text-slate-300">Contacting Amazon Scraper...</p>
              <p class="mt-0.5">This can take a few seconds as Playwright scrapes real-time details.</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40 mt-6">
            <button
              type="button"
              @click="close"
              class="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-sm font-semibold"
              :disabled="submitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-semibold flex items-center gap-2"
              :disabled="submitting"
            >
              <Loader2Icon v-if="submitting" class="h-4 w-4 animate-spin" />
              <span>{{ submitting ? 'Adding Alert...' : 'Add Alert' }}</span>
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
import { X as XIcon, Plus as PlusIcon, Link as LinkIcon, AlertTriangle as AlertTriangleIcon, Loader2 as Loader2Icon } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

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

const validateAmazonUrl = (inputUrl: string): boolean => {
  try {
    const parsed = new URL(inputUrl);
    return parsed.hostname.includes('amazon.');
  } catch {
    return false;
  }
};

const handleSubmit = async () => {
  validationError.value = '';
  
  if (!validateAmazonUrl(url.value)) {
    validationError.value = 'Please enter a valid Amazon URL (e.g. amazon.com, amazon.in, amazon.co.uk)';
    return;
  }

  submitting.value = true;
  const success = await store.createAlert(url.value, customName.value);
  submitting.value = false;

  if (success) {
    close();
  }
};
</script>

<style scoped>
.modal-enter-from {
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from .glass {
  transform: scale(0.95);
}
.modal-leave-to .glass {
  transform: scale(0.95);
}
</style>
