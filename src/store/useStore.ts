import { create } from 'zustand';
import { Transaction, Product, Customer, CreditRecord, CalendarEvent, TransactionType, PaymentMethod } from '../types';
import { mockTransactions, mockProducts, mockCustomers, mockCreditRecords, mockCalendarEvents } from '../data/mockData';
import { generateId, getTodayStr } from '../utils';

interface AppState {
  transactions: Transaction[];
  products: Product[];
  customers: Customer[];
  creditRecords: CreditRecord[];
  calendarEvents: CalendarEvent[];

  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  addProduct: (data: Omit<Product, 'id' | 'totalSold' | 'totalRevenue' | 'createdAt'>) => void;
  updateProductStock: (productId: string, change: number) => void;
  addCustomer: (data: Omit<Customer, 'id' | 'totalDebt' | 'paidBack' | 'createdAt'>) => void;
  addCreditRecord: (data: Omit<CreditRecord, 'id' | 'createdAt'>) => void;
  addCalendarEvent: (data: Omit<CalendarEvent, 'id'>) => void;
  getTodayTransactions: () => Transaction[];
  getTodayStats: () => { totalIncome: number; totalExpense: number; cashIncome: number; scanIncome: number; profit: number };
  getLowStockProducts: () => Product[];
  getUnpaidCustomers: () => Customer[];
  getHotProducts: () => Product[];
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [...mockTransactions],
  products: [...mockProducts],
  customers: [...mockCustomers],
  creditRecords: [...mockCreditRecords],
  calendarEvents: [...mockCalendarEvents],

  addTransaction: (data) => {
    const tx: Transaction = { ...data, id: generateId(), createdAt: Date.now() };
    set((state) => {
      const newProducts = [...state.products];
      if (tx.productId) {
        const idx = newProducts.findIndex(p => p.id === tx.productId);
        if (idx >= 0) {
          if (tx.type === 'income') {
            newProducts[idx] = {
              ...newProducts[idx],
              stock: Math.max(0, newProducts[idx].stock - (tx.quantity || 0)),
              totalSold: newProducts[idx].totalSold + (tx.quantity || 0),
              totalRevenue: newProducts[idx].totalRevenue + tx.amount,
            };
          } else if (tx.type === 'purchase') {
            newProducts[idx] = {
              ...newProducts[idx],
              stock: newProducts[idx].stock + (tx.quantity || 0),
            };
          } else if (tx.type === 'loss') {
            newProducts[idx] = {
              ...newProducts[idx],
              stock: Math.max(0, newProducts[idx].stock - (tx.quantity || 0)),
            };
          }
        }
      }
      const newCustomers = [...state.customers];
      if (tx.customerId && tx.type === 'income' && tx.method === 'credit') {
        const cIdx = newCustomers.findIndex(c => c.id === tx.customerId);
        if (cIdx >= 0) {
          newCustomers[cIdx] = {
            ...newCustomers[cIdx],
            totalDebt: newCustomers[cIdx].totalDebt + tx.amount,
          };
        }
      }
      return {
        transactions: [tx, ...state.transactions],
        products: newProducts,
        customers: newCustomers,
      };
    });
  },

  addProduct: (data) => {
    const p: Product = { ...data, id: generateId(), totalSold: 0, totalRevenue: 0, createdAt: Date.now() };
    set((state) => ({ products: [...state.products, p] }));
  },

  updateProductStock: (productId, change) => {
    set((state) => {
      const newProducts = state.products.map(p =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + change) } : p
      );
      return { products: newProducts };
    });
  },

  addCustomer: (data) => {
    const c: Customer = { ...data, id: generateId(), totalDebt: 0, paidBack: 0, createdAt: Date.now() };
    set((state) => ({ customers: [...state.customers, c] }));
  },

  addCreditRecord: (data) => {
    const cr: CreditRecord = { ...data, id: generateId(), createdAt: Date.now() };
    set((state) => {
      const newCustomers = state.customers.map(c => {
        if (c.id === data.customerId) {
          if (data.type === 'borrow') {
            return { ...c, totalDebt: c.totalDebt + data.amount };
          } else {
            return { ...c, paidBack: c.paidBack + data.amount, totalDebt: Math.max(0, c.totalDebt - data.amount) };
          }
        }
        return c;
      });
      return { creditRecords: [cr, ...state.creditRecords], customers: newCustomers };
    });
  },

  addCalendarEvent: (data) => {
    set((state) => {
      const existing = state.calendarEvents.findIndex(e => e.date === data.date);
      if (existing >= 0) {
        const newEvents = [...state.calendarEvents];
        newEvents[existing] = { ...newEvents[existing], ...data, id: newEvents[existing].id };
        return { calendarEvents: newEvents };
      }
      return { calendarEvents: [{ ...data, id: generateId() }, ...state.calendarEvents] };
    });
  },

  getTodayTransactions: () => {
    const today = getTodayStr();
    return get().transactions.filter(t => t.date === today);
  },

  getTodayStats: () => {
    const todayTx = get().getTodayTransactions();
    let totalIncome = 0, totalExpense = 0, cashIncome = 0, scanIncome = 0;
    todayTx.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.method === 'cash') cashIncome += t.amount;
        if (t.method === 'scan') scanIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });
    return { totalIncome, totalExpense, cashIncome, scanIncome, profit: totalIncome - totalExpense };
  },

  getLowStockProducts: () => {
    return get().products.filter(p => p.stock <= p.minStock);
  },

  getUnpaidCustomers: () => {
    return get().customers.filter(c => c.totalDebt > 0);
  },

  getHotProducts: () => {
    return [...get().products].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  },
}));
