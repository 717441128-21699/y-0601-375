import { Transaction, Product, Customer, CreditRecord, CalendarEvent, DailyStats } from '../types';
import { generateId, getTodayStr, formatDate } from '../utils';

export const mockProducts: Product[] = [
  { id: 'p1', name: '新鲜猪肉', category: '肉类', costPrice: 18, salePrice: 28, stock: 80, minStock: 20, unit: '斤', totalSold: 350, totalRevenue: 9800, createdAt: Date.now() - 86400000 * 30 },
  { id: 'p2', name: '土鸡蛋', category: '禽蛋', costPrice: 0.8, salePrice: 1.5, stock: 12, minStock: 50, unit: '个', totalSold: 2800, totalRevenue: 4200, createdAt: Date.now() - 86400000 * 30 },
  { id: 'p3', name: '本地青菜', category: '蔬菜', costPrice: 2, salePrice: 5, stock: 45, minStock: 10, unit: '斤', totalSold: 520, totalRevenue: 2600, createdAt: Date.now() - 86400000 * 25 },
  { id: 'p4', name: '西红柿', category: '蔬菜', costPrice: 3, salePrice: 6, stock: 8, minStock: 15, unit: '斤', totalSold: 280, totalRevenue: 1680, createdAt: Date.now() - 86400000 * 20 },
  { id: 'p5', name: '豆腐', category: '豆制品', costPrice: 2.5, salePrice: 5, stock: 30, minStock: 10, unit: '块', totalSold: 180, totalRevenue: 900, createdAt: Date.now() - 86400000 * 15 },
  { id: 'p6', name: '草鱼', category: '水产', costPrice: 10, salePrice: 18, stock: 25, minStock: 8, unit: '斤', totalSold: 150, totalRevenue: 2700, createdAt: Date.now() - 86400000 * 22 },
  { id: 'p7', name: '苹果', category: '水果', costPrice: 4, salePrice: 8, stock: 60, minStock: 15, unit: '斤', totalSold: 380, totalRevenue: 3040, createdAt: Date.now() - 86400000 * 28 },
  { id: 'p8', name: '香蕉', category: '水果', costPrice: 3, salePrice: 6, stock: 5, minStock: 12, unit: '斤', totalSold: 220, totalRevenue: 1320, createdAt: Date.now() - 86400000 * 18 },
];

export const mockCustomers: Customer[] = [
  { id: 'c1', name: '王老板', phone: '138****8888', totalDebt: 560, paidBack: 720, createdAt: Date.now() - 86400000 * 20 },
  { id: 'c2', name: '李阿姨', phone: '139****6666', totalDebt: 0, paidBack: 560, createdAt: Date.now() - 86400000 * 15 },
  { id: 'c3', name: '张师傅', phone: '137****3333', totalDebt: 690, paidBack: 200, createdAt: Date.now() - 86400000 * 10 },
  { id: 'c4', name: '陈大哥', phone: '136****2222', totalDebt: 0, paidBack: 350, createdAt: Date.now() - 86400000 * 8 },
  { id: 'c5', name: '刘大姐', phone: '135****1111', totalDebt: 420, paidBack: 0, createdAt: Date.now() - 86400000 * 5 },
];

const today = getTodayStr();
export const mockTransactions: Transaction[] = [
  { id: 't1', type: 'income', amount: 168, method: 'scan', productId: 'p1', productName: '新鲜猪肉', quantity: 6, unitPrice: 28, note: '', date: today, createdAt: Date.now() - 3600000 * 6 },
  { id: 't2', type: 'income', amount: 45, method: 'cash', productId: 'p3', productName: '本地青菜', quantity: 9, unitPrice: 5, note: '', date: today, createdAt: Date.now() - 3600000 * 5 },
  { id: 't3', type: 'income', amount: 72, method: 'scan', productId: 'p6', productName: '草鱼', quantity: 4, unitPrice: 18, note: '', date: today, createdAt: Date.now() - 3600000 * 4 },
  { id: 't4', type: 'purchase', amount: 360, method: 'cash', productId: 'p1', productName: '新鲜猪肉', quantity: 20, unitPrice: 18, note: '清晨进货', date: today, createdAt: Date.now() - 3600000 * 10 },
  { id: 't5', type: 'rent', amount: 50, method: 'cash', note: '今日摊位费', date: today, createdAt: Date.now() - 3600000 * 9 },
  { id: 't6', type: 'transport', amount: 30, method: 'scan', note: '三轮车运输', date: today, createdAt: Date.now() - 3600000 * 8 },
  { id: 't7', type: 'income', amount: 60, method: 'credit', productId: 'p7', productName: '苹果', quantity: 7.5, unitPrice: 8, customerId: 'c3', customerName: '张师傅', note: '老客户赊账', date: today, createdAt: Date.now() - 3600000 * 3 },
  { id: 't8', type: 'loss', amount: 24, method: 'cash', productId: 'p8', productName: '香蕉', quantity: 4, unitPrice: 6, note: '放坏了', date: today, createdAt: Date.now() - 3600000 * 2 },
  { id: 't9', type: 'income', amount: 126, method: 'scan', productId: 'p2', productName: '土鸡蛋', quantity: 84, unitPrice: 1.5, note: '', date: formatDate(Date.now() - 86400000), createdAt: Date.now() - 86400000 - 3600000 * 5 },
  { id: 't10', type: 'income', amount: 84, method: 'cash', productId: 'p4', productName: '西红柿', quantity: 14, unitPrice: 6, note: '', date: formatDate(Date.now() - 86400000), createdAt: Date.now() - 86400000 - 3600000 * 4 },
];

export const mockCreditRecords: CreditRecord[] = [
  { id: 'cr1', customerId: 'c1', customerName: '王老板', type: 'borrow', amount: 1000, date: formatDate(Date.now() - 86400000 * 15), note: '周末采购', createdAt: Date.now() - 86400000 * 15 },
  { id: 'cr2', customerId: 'c1', customerName: '王老板', type: 'borrow', amount: 280, date: formatDate(Date.now() - 86400000 * 8), note: '补充进货', createdAt: Date.now() - 86400000 * 8 },
  { id: 'cr3', customerId: 'c1', customerName: '王老板', type: 'repay', amount: 500, date: formatDate(Date.now() - 86400000 * 5), note: '现金还款', createdAt: Date.now() - 86400000 * 5 },
  { id: 'cr4', customerId: 'c1', customerName: '王老板', type: 'repay', amount: 220, date: formatDate(Date.now() - 86400000 * 2), note: '微信转账', createdAt: Date.now() - 86400000 * 2 },
  { id: 'cr5', customerId: 'c2', customerName: '李阿姨', type: 'borrow', amount: 560, date: formatDate(Date.now() - 86400000 * 14), note: '日常采购', createdAt: Date.now() - 86400000 * 14 },
  { id: 'cr6', customerId: 'c2', customerName: '李阿姨', type: 'repay', amount: 560, date: formatDate(Date.now() - 86400000 * 3), note: '一次还清', createdAt: Date.now() - 86400000 * 3 },
  { id: 'cr7', customerId: 'c3', customerName: '张师傅', type: 'borrow', amount: 890, date: formatDate(Date.now() - 86400000 * 10), note: '菜款', createdAt: Date.now() - 86400000 * 10 },
  { id: 'cr8', customerId: 'c3', customerName: '张师傅', type: 'repay', amount: 200, date: formatDate(Date.now() - 86400000 * 3), note: '还部分', createdAt: Date.now() - 86400000 * 3 },
  { id: 'cr9', customerId: 'c4', customerName: '陈大哥', type: 'borrow', amount: 350, date: formatDate(Date.now() - 86400000 * 7), note: '采购肉品', createdAt: Date.now() - 86400000 * 7 },
  { id: 'cr10', customerId: 'c4', customerName: '陈大哥', type: 'repay', amount: 350, date: formatDate(Date.now() - 86400000 * 1), note: '支付宝还款', createdAt: Date.now() - 86400000 * 1 },
  { id: 'cr11', customerId: 'c5', customerName: '刘大姐', type: 'borrow', amount: 420, date: formatDate(Date.now() - 86400000 * 5), note: '', createdAt: Date.now() - 86400000 * 5 },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: 'e1', date: getTodayStr(), isMarketDay: true, weather: 'sunny', flowLevel: 'high', temperature: 28, note: '赶集日，人多' },
  { id: 'e2', date: formatDate(Date.now() - 86400000), isMarketDay: false, weather: 'cloudy', flowLevel: 'medium', temperature: 26, note: '' },
  { id: 'e3', date: formatDate(Date.now() - 86400000 * 2), isMarketDay: false, weather: 'rainy', flowLevel: 'low', temperature: 22, note: '下雨人少' },
  { id: 'e4', date: formatDate(Date.now() - 86400000 * 3), isMarketDay: true, weather: 'sunny', flowLevel: 'high', temperature: 27, note: '' },
  { id: 'e5', date: formatDate(Date.now() - 86400000 * 4), isMarketDay: false, weather: 'sunny', flowLevel: 'medium', temperature: 29, note: '' },
];

export const mockDailyStats: DailyStats[] = Array.from({ length: 7 }, (_, i) => {
  const date = formatDate(Date.now() - 86400000 * (6 - i));
  const base = 500 + Math.random() * 800;
  const income = Math.round(base);
  const expense = Math.round(base * (0.3 + Math.random() * 0.2));
  return {
    date,
    totalIncome: income,
    totalExpense: expense,
    cashIncome: Math.round(income * (0.3 + Math.random() * 0.2)),
    scanIncome: Math.round(income * (0.5 + Math.random() * 0.2)),
    profit: income - expense,
    transactionCount: 20 + Math.floor(Math.random() * 30),
    bestProducts: [
      { productId: 'p1', productName: '新鲜猪肉', revenue: Math.round(income * 0.3), profit: Math.round(income * 0.12) },
      { productId: 'p2', productName: '土鸡蛋', revenue: Math.round(income * 0.2), profit: Math.round(income * 0.08) },
    ]
  };
});
