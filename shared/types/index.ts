export type StockStatus = 'in_stock' | 'out_of_stock' | 'unknown';

export interface Product {
  id: string;
  asin: string;
  url: string;
  name: string;
  image: string;
  currentPrice: number;
  stockStatus: StockStatus;
  lastChecked: string; // ISO date string
}

export interface Alert {
  id: string;
  productId: string;
  customName?: string;
  enabled: boolean; // stored as 0 or 1 in DB, converted to boolean in API
  createdAt: string; // ISO date string
  product?: Product; // Populated in API responses
}

export interface HistoryEntry {
  id: string;
  productId: string;
  price: number;
  stockStatus: StockStatus;
  checkedAt: string; // ISO date string
}

export interface ScrapeResult {
  asin: string;
  name: string;
  image: string;
  currentPrice: number;
  stockStatus: StockStatus;
  url: string;
}

export interface Stats {
  totalAlerts: number;
  inStock: number;
  outOfStock: number;
  lastChecked: string | null;
}
