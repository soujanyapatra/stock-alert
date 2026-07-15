import { ref, watchEffect } from 'vue';

const isDark = ref(false);

// Initialize theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  isDark.value = savedTheme === 'dark';
} else {
  // Fallback to system preference
  isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
}

watchEffect(() => {
  const root = document.documentElement;
  const body = document.body;
  if (isDark.value) {
    root.classList.add('dark');
    body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
});

export function useDark() {
  const toggleDark = () => {
    isDark.value = !isDark.value;
  };

  return {
    isDark,
    toggleDark
  };
}
