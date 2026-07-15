import { defineStore } from 'pinia';
import type { Alert, Stats } from '@shared/types';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useAlertStore = defineStore('alertStore', {
  state: () => ({
    alerts: [] as Alert[],
    loading: false,
    error: null as string | null,
    toasts: [] as ToastMessage[],
    refreshingIds: [] as number[], // alert IDs currently being refreshed
    globalRefreshing: false,
  }),

  getters: {
    stats(state): Stats {
      let inStock = 0;
      let outOfStock = 0;
      let latestChecked: string | null = null;

      state.alerts.forEach((alert) => {
        if (!alert.product) return;
        
        if (alert.product.stockStatus === 'in_stock') {
          inStock++;
        } else if (alert.product.stockStatus === 'out_of_stock') {
          outOfStock++;
        }

        if (alert.product.lastChecked) {
          if (!latestChecked || new Date(alert.product.lastChecked) > new Date(latestChecked)) {
            latestChecked = alert.product.lastChecked;
          }
        }
      });

      return {
        totalAlerts: state.alerts.length,
        inStock,
        outOfStock,
        lastChecked: latestChecked,
      };
    },
  },

  actions: {
    // Toast Management
    addToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, message, type });
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        this.removeToast(id);
      }, 4000);
    },

    removeToast(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },

    // API Operations
    async fetchAlerts() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch('/api/alerts');
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch alerts.');
        }
        this.alerts = await response.json();
      } catch (err: any) {
        this.error = err.message || 'An error occurred while fetching alerts.';
        this.addToast(this.error || 'Failed to load alerts', 'error');
      } finally {
        this.loading = false;
      }
    },

    async createAlert(url: string, customName?: string) {
      this.loading = true;
      try {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, customName }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create alert.');
        }

        this.alerts.unshift(data);
        this.addToast(`Successfully started tracking ${data.product?.name || 'product'}!`, 'success');
        return true;
      } catch (err: any) {
        this.addToast(err.message || 'Error creating alert.', 'error');
        return false;
      } finally {
        this.loading = false;
      }
    },

    async toggleAlert(alertId: number, enabled: boolean) {
      try {
        const response = await fetch(`/api/alerts/${alertId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update alert state.');
        }

        const idx = this.alerts.findIndex((a) => a.id === alertId);
        if (idx !== -1) {
          this.alerts[idx] = data;
        }

        const actionText = enabled ? 'enabled' : 'disabled';
        this.addToast(`Monitoring ${actionText} successfully.`, 'success');
      } catch (err: any) {
        this.addToast(err.message || 'Failed to update alert.', 'error');
      }
    },

    async deleteAlert(alertId: number) {
      try {
        const response = await fetch(`/api/alerts/${alertId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete alert.');
        }

        this.alerts = this.alerts.filter((a) => a.id !== alertId);
        this.addToast('Alert deleted successfully.', 'success');
        return true;
      } catch (err: any) {
        this.addToast(err.message || 'Failed to delete alert.', 'error');
        return false;
      }
    },

    async refreshAlert(alertId: number, productId: number) {
      this.refreshingIds.push(alertId);
      try {
        const response = await fetch('/api/scheduler/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to refresh product.');
        }

        // Fetch updated alert list
        await this.fetchAlerts();

        const updatedAlert = this.alerts.find((a) => a.id === alertId);
        if (updatedAlert?.product) {
          const statusText = updatedAlert.product.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock';
          this.addToast(`Refreshed! Product is currently ${statusText}.`, 'info');
        } else {
          this.addToast('Product refreshed successfully.', 'success');
        }
      } catch (err: any) {
        this.addToast(err.message || 'Failed to refresh product.', 'error');
      } finally {
        this.refreshingIds = this.refreshingIds.filter((id) => id !== alertId);
      }
    },

    async triggerGlobalRefresh() {
      this.globalRefreshing = true;
      try {
        const response = await fetch('/api/scheduler/run', {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to trigger scheduler.');
        }

        await this.fetchAlerts();
        this.addToast(`Check completed. Processed ${data.processed} products. Detected ${data.changes} changes.`, 'success');
      } catch (err: any) {
        this.addToast(err.message || 'Failed to run full update check.', 'error');
      } finally {
        this.globalRefreshing = false;
      }
    },
  },
});
