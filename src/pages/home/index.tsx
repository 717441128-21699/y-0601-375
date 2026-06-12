import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useStore } from '../../store/useStore';
import { formatMoney, getTodayStr, formatDate } from '../../utils';
import StatCard from '../../components/StatCard';
import TransactionItem from '../../components/TransactionItem';
import QuickActionBtn from '../../components/QuickActionBtn';
import SectionHeader from '../../components/SectionHeader';

const HomePage: React.FC = () => {
  const { transactions, getTodayTransactions, getTodayStats, getLowStockProducts, getUnpaidCustomers, addTransaction } = useStore();

  const todayTx = getTodayTransactions();
  const stats = getTodayStats();
  const lowStock = getLowStockProducts();
  const unpaid = getUnpaidCustomers();

  const totalPayment = stats.cashIncome + stats.scanIncome || 1;
  const cashPercent = Math.round((stats.cashIncome / totalPayment) * 100);
  const scanPercent = Math.round((stats.scanIncome / totalPayment) * 100);

  const today = getTodayStr();
  const todayStr = formatDate(today, 'MM月DD日 dddd');

  const alerts = useMemo(() => {
    const items: { icon: string; text: string; count?: number }[] = [];
    if (lowStock.length > 0) {
      items.push({ icon: '📦', text: `${lowStock.length}种商品库存不足`, count: lowStock.length });
    }
    if (unpaid.length > 0) {
      const totalDebt = unpaid.reduce((s, c) => s + c.totalDebt, 0);
      items.push({ icon: '💰', text: `${unpaid.length}位客户赊账 ¥${totalDebt.toFixed(0)}` });
    }
    return items;
  }, [lowStock, unpaid]);

  const handleQuickAction = (type: string) => {
    console.log('[Home] handleQuickAction:', type);
    Taro.navigateTo({ url: `/pages/entry/index?type=${type}` });
  };

  const handleAlertClick = (type: string) => {
    if (type === 'inventory') {
      Taro.navigateTo({ url: '/pages/inventory/index' });
    } else if (type === 'credit') {
      Taro.navigateTo({ url: '/pages/credit/index' });
    }
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.heroSection}>
        <View className={styles.heroDate}>
          <Text className={styles.heroDateText}>📅 {todayStr}</Text>
          <View className={styles.heroDateBadge}>今日</View>
        </View>
        <Text className={styles.heroTitle}>今日净利润</Text>
        <View className={styles.heroProfit}>
          <Text className={styles.heroProfitSymbol}>¥</Text>
          <Text>{stats.profit.toFixed(2)}</Text>
        </View>
        <View className={styles.heroSubRow}>
          <View className={styles.heroSubItem}>
            <Text className={styles.heroSubLabel}>💰 总收入</Text>
            <Text className={styles.heroSubValue}>¥{stats.totalIncome.toFixed(2)}</Text>
          </View>
          <View className={styles.heroSubItem}>
            <Text className={styles.heroSubLabel}>💸 总支出</Text>
            <Text className={styles.heroSubValue}>¥{stats.totalExpense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {alerts.length > 0 && (
        <View>
          {alerts.map((a, i) => (
            <View key={i} className={styles.alertBanner} onClick={() => handleAlertClick(i === 0 && lowStock.length > 0 ? 'inventory' : 'credit')}>
              <Text className={styles.alertIcon}>{a.icon}</Text>
              <Text className={styles.alertText}>{a.text}</Text>
              {a.count !== undefined && <Text className={styles.alertCount}>去处理</Text>}
            </View>
          ))}
        </View>
      )}

      <View className={styles.statsRow}>
        <StatCard
          title="今日流水"
          value={`${todayTx.length}笔`}
          subValue={`销售${todayTx.filter(t => t.type === 'income').length}笔`}
          color="primary"
        />
        <StatCard
          title="毛利率"
          value={stats.totalIncome > 0 ? `${Math.max(0, ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100).toFixed(1)}%` : '--'}
          subValue={stats.profit >= 0 ? '盈利状态 📈' : '亏损状态 📉'}
          color={stats.profit >= 0 ? 'success' : 'error'}
        />
      </View>

      <View className={styles.paymentCard}>
        <View className={styles.paymentInfo}>
          <View className={styles.paymentLabel}>
            <Text className={styles.paymentIcon}>💵</Text>
            <Text>现金收入</Text>
          </View>
          <Text className={classnames(styles.paymentAmount, styles.paymentCash)}>¥{stats.cashIncome.toFixed(2)}</Text>
        </View>
        <View className={classnames(styles.paymentPercent, styles.paymentPercentCash)}>
          {cashPercent || 0}%
        </View>
      </View>

      <View style={{ height: 16 }} />

      <View className={styles.paymentCard}>
        <View className={styles.paymentInfo}>
          <View className={styles.paymentLabel}>
            <Text className={styles.paymentIcon}>📱</Text>
            <Text>扫码收入</Text>
          </View>
          <Text className={classnames(styles.paymentAmount, styles.paymentScan)}>¥{stats.scanIncome.toFixed(2)}</Text>
        </View>
        <View className={classnames(styles.paymentPercent, styles.paymentPercentScan)}>
          {scanPercent || 0}%
        </View>
      </View>

      <SectionHeader title="快速记账" />

      <View className={styles.quickActions}>
        <View className={styles.quickActionsGrid}>
          <QuickActionBtn icon="💰" label="记销售" color="green" onClick={() => handleQuickAction('income')} />
          <QuickActionBtn icon="📦" label="记进货" color="orange" onClick={() => handleQuickAction('purchase')} />
          <QuickActionBtn icon="🏪" label="摊位费" color="blue" onClick={() => handleQuickAction('rent')} />
          <QuickActionBtn icon="🚚" label="运输费" color="purple" onClick={() => handleQuickAction('transport')} />
          <QuickActionBtn icon="📉" label="记损耗" color="red" onClick={() => handleQuickAction('loss')} />
        </View>
      </View>

      <SectionHeader
        title="今日流水"
        subtitle={`共${todayTx.length}笔`}
        extra="查看全部"
        onExtraClick={() => Taro.switchTab({ url: '/pages/dashboard/index' })}
      />

      <View className={styles.listContainer}>
        {todayTx.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📝</Text>
            <Text className={styles.emptyText}>暂无今日流水记录</Text>
            <Text className={styles.emptyText}>点击上方按钮开始记账</Text>
          </View>
        ) : (
          todayTx.slice(0, 20).map(tx => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default HomePage;
