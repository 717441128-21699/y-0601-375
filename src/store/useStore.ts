import { create } from 'zustand';
import { Transaction, Product, Customer, CreditRecord, CalendarEvent, DailyStats } from '../types';
import { mockTransactions, mockProducts, mockCustomers, mockCreditRecords, mockCalendarEvents } from '../data/mockData';
import { generateId, getTodayStr } from '../utils';
import dayjs from 'dayjs';

const STORAGE_KEY = 'taro_shopkeeper_data_v1';

interface AppState {
  transactions: Transaction[];
  products: Product[];
  customers: Customer[];
  creditRecords: CreditRecord[];
  calendarEvents: CalendarEvent[];

  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  addProduct: (data: Omit<Product, 'id' | 'totalSold' | 'totalRevenue' | 'createdAt'>) => void;
  updateProduct: (productId: string, data: Partial<Product>) => void;
  updateProductStock: (productId: string, change: number) => void;
  addCustomer: (data: Omit<Customer, 'id' | 'totalDebt' | 'paidBack' | 'createdAt'>) => void;
  addCreditRecord: (data: Omit<CreditRecord, 'id' | 'createdAt'>) => void;
  addCalendarEvent: (data: Omit<CalendarEvent, 'id'>) => void;
  getTodayTransactions: () => Transaction[];
  getTodayStats: () => { totalIncome: number; totalExpense: number; cashIncome: number; scanIncome: number; profit: number };
  getLowStockProducts: () => Product[];
  getUnpaidCustomers: () => Customer[];
  getHotProducts: () => Product[];
  getDailyStats: (days: number) => DailyStats[];
}

function loadFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[Store] load failed:', e);
    return null;
  }
}

function saveToStorage(state: AppState) {
  try {
    if (typeof localStorage === 'undefined') return;
    const data = {
      transactions: state.transactions,
      products: state.products,
      customers: state.customers,
      creditRecords: state.creditRecords,
      calendarEvents: state.calendarEvents,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Store] save failed:', e);
  }
}

function getInitialState() {
  const saved = loadFromStorage();
  if (saved) {
    return {
      transactions: saved.transactions || [],
      products: saved.products || [],
      customers: saved.customers || [],
      creditRecords: saved.creditRecords || [],
      calendarEvents: saved.calendarEvents || [],
    };
  }
  return {
    transactions: mockTransactions,
    products: mockProducts,
    customers: mockCustomers,
    creditRecords: mockCreditRecords,
    calendarEvents: mockCalendarEvents,
  };
}

export const useStore = create<AppState>((set, get) => {
  const initial = getInitialState();

  return {
    transactions: initial.transactions,
    products: initial.products,
    customers: initial.customers,
    creditRecords: initial.creditRecords,
    calendarEvents: initial.calendarEvents,

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
        const newState = {
          transactions: [tx, ...state.transactions],
          products: newProducts,
        } as AppState;
        saveToStorage({ ...state, ...newState } as AppState);
        return newState;
      });
    },

    addProduct: (data) => {
      const p: Product = { ...data, id: generateId(), totalSold: 0, totalRevenue: 0, createdAt: Date.now() };
      set((state) => {
        const newState = { products: [...state.products, p] };
        saveToStorage({ ...state, ...newState } as AppState);
        return newState;
      });
    },

    updateProduct: (productId, data) => {
      set((state) => {
        const newProducts = state.products.map(p =>
          p.id === productId ? { ...p, ...data } : p
        );
        const newState = { products: newProducts };
        saveToStorage({ ...state, ...newState } as AppState);
        return newState;
      });
    },

    updateProductStock: (productId, change) => {
      set((state) => {
        const newProducts = state.products.map(p =>
          p.id === productId ? { ...p, stock: Math.max(0, p.stock + change) } : p
        );
        const newState = { products: newProducts };
        saveToStorage({ ...state, ...newState } as AppState);
        return newState;
      });
    },

    addCustomer: (data) => {
      const c: Customer = { ...data, id: generateId(), totalDebt: 0, paidBack: 0, createdAt: Date.now() };
      set((state) => {
        const newState = { customers: [...state.customers, c] };
        saveToStorage({ ...state, ...newState } as AppState);
        return newState;
      });
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
        const newState = { creditRecords: [cr, ...state.creditRecords], customers: newCustomers };
        saveToStorage({ ...state, ...newState } as AppState);
        return newState;
      });
    },

    addCalendarEvent: (data) => {
      set((state) => {
        const existing = state.calendarEvents.findIndex(e => e.date === data.date);
        let newEvents;
        if (existing >= 0) {
          newEvents = [...state.calendarEvents];
          newEvents[existing] = { ...newEvents[existing], ...data, id: newEvents[existing].id };
        } else {
          newEvents = [{ ...data, id: generateId() }, ...state.calendarEvents];
        }
        const newState = { calendarEvents: newEvents };
        saveToStorage({ ...state, ...newState } as AppState);
        return newState;
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

    getDailyStats: (days: number) => {
      const { transactions } = get();
      const result: DailyStats[] = [];
      const today = dayjs();

      for (let i = days - 1; i >= 0; i--) {
        const date = today.subtract(i, 'day').format('YYYY-MM-DD');
        const dayTx = transactions.filter(t => t.date === date);

        let totalIncome = 0, totalExpense = 0, cashIncome = 0, scanIncome = 0;
        dayTx.forEach(t => {
          if (t.type === 'income') {
            totalIncome += t.amount;
            if (t.method === 'cash') cashIncome += t.amount;
            if (t.method === 'scan') scanIncome += t.amount;
          } else {
            totalExpense += t.amount;
          }
        });

        result.push({
          date,
          totalIncome,
          totalExpense,
          profit: totalIncome - totalExpense,
          cashIncome,
          scanIncome,
          transactionCount: dayTx.length,
          bestProducts: [],
        });
      }

      return result;
    },
  };
});
