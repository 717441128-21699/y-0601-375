import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { formatMoney, formatDate, calculateProfitRate } from '../../utils';
import { mockDailyStats } from '../../data/mockData';
import SectionHeader from '../../components/SectionHeader';

const DashboardPage: React.FC = () => {
  const { transactions, products, getHotProducts } = useStore();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const dailyStats = mockDailyStats;

  const stats = useMemo(() => {
    const totalIncome = dailyStats.reduce((s, d) => s + d.totalIncome, 0);
    const totalExpense = dailyStats.reduce((s, d) => s + d.totalExpense, 0);
    const totalCash = dailyStats.reduce((s, d) => s + d.cashIncome, 0);
    const totalScan = dailyStats.reduce((s, d) => s + d.scanIncome, 0);
    const totalTx = dailyStats.reduce((s, d) => s + d.transactionCount, 0);
    const profit = totalIncome - totalExpense;

    const prevIncome = totalIncome * (0.85 + Math.random() * 0.2);
    const change = ((totalIncome - prevIncome) / prevIncome) * 100;

    return {
      totalIncome,
      totalExpense,
      totalCash,
      totalScan,
      totalTx,
      profit,
      change: Math.round(change),
      profitRate: totalIncome > 0 ? calculateProfitRate(totalIncome, totalExpense) : 0,
    };
  }, [dailyStats]);

  const hotProducts = getHotProducts();

  const totalStockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const avgDailySales = stats.totalIncome / dailyStats.length;
  const turnoverDays = avgDailySales > 0 ? Math.round(totalStockValue / avgDailySales) : 0;

  const totalPayment = stats.totalCash + stats.totalScan || 1;
  const cashPercent = Math.round((stats.totalCash / totalPayment) * 100);
  const scanPercent = Math.round((stats.totalScan / totalPayment) * 100);

  const maxValue = Math.max(...dailyStats.map(d => Math.abs(d.profit)), 1);

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.periodTabs}>
        <View
          className={classnames(styles.periodTab, period === 'week' && styles.active)}
          onClick={() => setPeriod('week')}
        >
          近7天
        </View>
        <View
          className={classnames(styles.periodTab, period === 'month' && styles.active)}
          onClick={() => setPeriod('month')}
        >
          近30天
        </View>
      </View>

      <View className={styles.kpiSection}>
        <View className={styles.kpiMain}>
          <Text className={styles.kpiLabel}>📈 周期总利润</Text>
          <View className={styles.kpiValue}>
            <Text className={styles.kpiValueSymbol}>¥</Text>
            <Text>{stats.profit.toFixed(2)}</Text>
          </View>
          <View className={classnames(styles.kpiChange, stats.change >= 0 ? styles.up : styles.down)}>
            {stats.change >= 0 ? '↑' : '↓'} {Math.abs(stats.change)}% 对比上期
          </View>
        </View>

        <View className={styles.kpiGrid}>
          <View className={styles.kpiItem}>
            <Text className={styles.kpiItemLabel}>
              <Text className={styles.kpiItemIcon}>💰</Text>总收入
            </Text>
            <Text className={styles.kpiItemValue} style={{ color: '#2DB84D' }}>¥{stats.totalIncome.toFixed(0)}</Text>
          </View>
          <View className={styles.kpiItem}>
            <Text className={styles.kpiItemLabel}>
              <Text className={styles.kpiItemIcon}>💸</Text>总支出
            </Text>
            <Text className={styles.kpiItemValue} style={{ color: '#FF4D4F' }}>¥{stats.totalExpense.toFixed(0)}</Text>
          </View>
          <View className={styles.kpiItem}>
            <Text className={styles.kpiItemLabel}>
              <Text className={styles.kpiItemIcon}>📊</Text>毛利率
            </Text>
            <Text className={styles.kpiItemValue} style={{ color: '#F59E0B' }}>{stats.profitRate.toFixed(1)}%</Text>
          </View>
          <View className={styles.kpiItem}>
            <Text className={styles.kpiItemLabel}>
              <Text className={styles.kpiItemIcon}>🧾</Text>流水笔数
            </Text>
            <Text className={styles.kpiItemValue} style={{ color: '#3B82F6' }}>{stats.totalTx}笔</Text>
          </View>
        </View>
      </View>

      <View className={styles.chartSection}>
        <View className={styles.chartHeader}>
          <Text className={styles.chartTitle}>
            <Text className={styles.chartTitleIcon}>📊</Text>每日利润走势
          </Text>
        </View>
        <View className={styles.chartBars}>
          {dailyStats.map((d, i) => {
            const heightPct = (Math.abs(d.profit) / maxValue) * 100;
            return (
              <View key={i} className={styles.chartBarWrap}>
                <View
                  className={classnames(styles.chartBar, d.profit < 0 && styles.negative)}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                >
                  {d.profit > 100 && (
                    <Text className={styles.chartBarValue}>¥{(d.profit / 100).toFixed(0)}百</Text>
                  )}
                </View>
                <Text className={styles.chartBarLabel}>{formatDate(d.date, 'MM/DD')}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.paymentPieSection}>
        <SectionHeader title="💳 收款方式占比" />
        <View className={styles.pieRow}>
          <View className={styles.pieVisual}>
            <View className={styles.pieCashFill} style={{ height: `${cashPercent}%` }} />
            <View
              className={styles.pieScanFill}
              style={{ top: `${cashPercent}%`, height: `${scanPercent}%` }}
            />
            <View
              className={styles.pieOtherFill}
              style={{ top: `${cashPercent + scanPercent}%`, height: `${100 - cashPercent - scanPercent}%` }}
            />
          </View>
          <View className={styles.pieLegend}>
            <View className={styles.legendItem}>
              <View className={styles.legendDot} style={{ background: '#F59E0B' }} />
              <Text className={styles.legendText}>💵 现金</Text>
              <Text className={styles.legendValue}>{cashPercent}%</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={styles.legendDot} style={{ background: '#3B82F6' }} />
              <Text className={styles.legendText}>📱 扫码</Text>
              <Text className={styles.legendValue}>{scanPercent}%</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={styles.legendDot} style={{ background: '#FF7D00' }} />
              <Text className={styles.legendText}>📒 其他</Text>
              <Text className={styles.legendValue}>{100 - cashPercent - scanPercent}%</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.hotProductsSection}>
        <SectionHeader title="🏆 热销商品排行" subtitle="按累计营收" />
        <View className={styles.hotList}>
          {hotProducts.map((p, i) => (
            <View key={p.id} className={styles.hotItem}>
              <View
                className={classnames(
                  styles.hotRank,
                  i === 0 ? styles.rank1 : i === 1 ? styles.rank2 : i === 2 ? styles.rank3 : styles.rankOther
                )}
              >
                {i + 1}
              </View>
              <View className={styles.hotInfo}>
                <Text className={styles.hotName}>{p.name}</Text>
                <Text className={styles.hotMeta}>
                  已售{p.totalSold}{p.unit} · 毛利率{calculateProfitRate(p.salePrice, p.costPrice).toFixed(0)}%
                </Text>
              </View>
              <Text className={styles.hotRevenue}>¥{p.totalRevenue.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.turnoverSection}>
        <SectionHeader title="🔄 库存周转" />
        <View className={styles.turnoverStats}>
          <View className={styles.turnoverItem}>
            <Text className={styles.turnoverLabel}>库存价值</Text>
            <Text className={styles.turnoverValue}>¥{totalStockValue.toFixed(0)}</Text>
          </View>
          <View className={styles.turnoverItem}>
            <Text className={styles.turnoverLabel}>日均销售</Text>
            <Text className={styles.turnoverValue}>¥{avgDailySales.toFixed(0)}</Text>
          </View>
          <View className={styles.turnoverItem}>
            <Text className={styles.turnoverLabel}>周转天数</Text>
            <Text className={styles.turnoverValue}>{turnoverDays}天</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default DashboardPage;
