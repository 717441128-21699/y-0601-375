export type TransactionType = 'income' | 'expense' | 'purchase' | 'rent' | 'transport' | 'loss';
export type PaymentMethod = 'cash' | 'scan' | 'credit' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  note?: string;
  customerId?: string;
  customerName?: string;
  date: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  totalSold: number;
  totalRevenue: number;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  totalDebt: number;
  paidBack: number;
  createdAt: number;
}

export interface CreditRecord {
  id: string;
  customerId: string;
  customerName: string;
  type: 'borrow' | 'repay';
  amount: number;
  date: string;
  note?: string;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  date: string;
  isMarketDay: boolean;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  flowLevel?: 'low' | 'medium' | 'high';
  note?: string;
  temperature?: number;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  daysUntilOut: number;
}

export interface DailyStats {
  date: string;
  totalIncome: number;
  totalExpense: number;
  cashIncome: number;
  scanIncome: number;
  profit: number;
  transactionCount: number;
  bestProducts: { productId: string; productName: string; revenue: number; profit: number }[];
}

export interface ExportConfig {
  startDate: string;
  endDate: string;
  includeProducts: boolean;
  includeCredits: boolean;
  format: 'csv' | 'excel';
  recipient?: string;
}
