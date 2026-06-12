import dayjs from 'dayjs';

export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatMoneyNoSymbol = (amount: number): string => {
  return amount.toFixed(2);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getTodayStr = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getMonthStr = (date?: string): string => {
  return dayjs(date).format('YYYY年MM月');
};

export const formatDate = (date: string | number, fmt = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(fmt);
};

export const getDaysInMonth = (year: number, month: number): number => {
  return dayjs(`${year}-${month + 1}-01`).daysInMonth();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return dayjs(`${year}-${month + 1}-01`).day();
};

export const calculateProfit = (revenue: number, cost: number): number => {
  return revenue - cost;
};

export const calculateProfitRate = (revenue: number, cost: number): number => {
  if (revenue <= 0) return 0;
  return ((revenue - cost) / revenue) * 100;
};

export const getPaymentMethodText = (method: string): string => {
  const map: Record<string, string> = {
    cash: '现金',
    scan: '扫码',
    credit: '赊账',
    transfer: '转账'
  };
  return map[method] || method;
};

export const getTransactionTypeText = (type: string): string => {
  const map: Record<string, string> = {
    income: '销售收入',
    expense: '其他支出',
    purchase: '进货',
    rent: '摊位费',
    transport: '运输费',
    loss: '损耗',
    adjust: '库存调整'
  };
  return map[type] || type;
};

export const getWeatherText = (weather?: string): string => {
  const map: Record<string, string> = {
    sunny: '☀️ 晴',
    cloudy: '⛅ 多云',
    rainy: '🌧️ 雨',
    snowy: '❄️ 雪'
  };
  return map[weather || 'sunny'] || '☀️ 晴';
};

export const getFlowText = (level?: string): string => {
  const map: Record<string, string> = {
    low: '🐢 客流少',
    medium: '👥 客流中',
    high: '🔥 客流多'
  };
  return map[level || 'medium'] || '👥 客流中';
};
