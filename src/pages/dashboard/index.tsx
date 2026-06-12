import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { formatMoney, formatDate, calculateProfitRate, getPaymentMethodText } from '../../utils';
import SectionHeader from '../../components/SectionHeader';
import dayjs from 'dayjs';

const DashboardPage: React.FC = () => {
  const { transactions, products, getDailyStats } = useStore();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const days = period === 'week' ? 7 : 30;

  const dailyStats = useMemo(() => {
    return getDailyStats(days);
  }, [getDailyStats, days, transactions]);

  const prevDailyStats = useMemo(() => {
    return getDailyStats(days * 2).slice(0, days);
  }, [getDailyStats, days, transactions]);

  const periodTransactions = useMemo(() => {
    const startDate = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD');
    return transactions.filter(t => t.date >= startDate);
  }, [transactions, days, period]);

  const stats = useMemo(() => {
    const totalIncome = dailyStats.reduce((s, d) => s + d.totalIncome, 0);
    const totalExpense = dailyStats.reduce((s, d) => s + d.totalExpense, 0);
    const totalCash = dailyStats.reduce((s, d) => s + d.cashIncome, 0);
    const totalScan = dailyStats.reduce((s, d) => s + d.scanIncome, 0);
    const totalTx = dailyStats.reduce((s, d) => s + d.transactionCount, 0);
    const profit = totalIncome - totalExpense;

    const prevIncome = prevDailyStats.reduce((s, d) => s + d.totalIncome, 0);
    const change = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;

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
  }, [dailyStats, prevDailyStats, days, period, transactions]);

  const productStatsMap = useMemo(() => {
    const map = new Map<string, { revenue: number; quantity: number; profit: number }>();

    periodTransactions
      .filter(t => t.type === 'income' && t.productId)
      .forEach(t => {
        const existing = map.get(t.productId!) || { revenue: 0, quantity: 0, profit: 0 };
        const product = products.find(p => p.id === t.productId);
        const cost = product ? product.costPrice * (t.quantity || 0) : 0;
        map.set(t.productId!, {
          revenue: existing.revenue + t.amount,
          quantity: existing.quantity + (t.quantity || 0),
          profit: existing.profit + (t.amount - cost),
        });
      });

    return map;
  }, [periodTransactions, products, days, period, transactions]);

  const hotProducts = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      unit: string;
      salePrice: number;
      costPrice: number;
      totalRevenue: number;
      totalSold: number;
      totalProfit: number;
    }> = [];

    productStatsMap.forEach((stat, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        list.push({
          id: product.id,
          name: product.name,
          unit: product.unit,
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          totalRevenue: stat.revenue,
          totalSold: stat.quantity,
          totalProfit: stat.profit,
        });
      }
    });

    return list.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  }, [productStatsMap, products, days, period, transactions]);

  const paymentBreakdown = useMemo(() => {
    const methods: Array<'cash' | 'scan' | 'credit' | 'transfer'> = ['cash', 'scan', 'credit', 'transfer'];
    const result = methods.map(method => {
      const methodTx = periodTransactions.filter(t => t.type === 'income' && t.method === method);
      const totalAmount = methodTx.reduce((s, t) => s + t.amount, 0);
      return {
        method,
        totalAmount,
        count: methodTx.length,
        percent: stats.totalIncome > 0 ? Math.round((totalAmount / stats.totalIncome) * 100) : 0,
      };
    });
    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [periodTransactions, stats.totalIncome, days, period, transactions]);

  const profitRankProducts = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      unit: string;
      salePrice: number;
      costPrice: number;
      revenue: number;
      quantity: number;
      cost: number;
      profit: number;
      profitRate: number;
    }> = [];

    productStatsMap.forEach((stat, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const cost = product.costPrice * stat.quantity;
        list.push({
          id: product.id,
          name: product.name,
          unit: product.unit,
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          revenue: stat.revenue,
          quantity: stat.quantity,
          cost,
          profit: stat.profit,
          profitRate: stat.revenue > 0 ? calculateProfitRate(stat.revenue, cost) : 0,
        });
      }
    });

    return list.sort((a, b) => b.profit - a.profit).slice(0, 5);
  }, [productStatsMap, products, days, period, transactions]);

  const totalStockValue = useMemo(() => {
    return products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  }, [products]);

  const avgDailySales = useMemo(() => {
    return stats.totalIncome / (dailyStats.length || 1);
  }, [stats.totalIncome, dailyStats.length, days, period, transactions]);

  const turnoverDays = useMemo(() => {
    return avgDailySales > 0 ? Math.round(totalStockValue / avgDailySales) : 0;
  }, [totalStockValue, avgDailySales, days, period, transactions]);

  const totalPayment = useMemo(() => {
    return stats.totalCash + stats.totalScan || 1;
  }, [stats.totalCash, stats.totalScan, days, period, transactions]);

  const cashPercent = useMemo(() => {
    return Math.round((stats.totalCash / totalPayment) * 100);
  }, [stats.totalCash, totalPayment, days, period, transactions]);

  const scanPercent = useMemo(() => {
    return Math.round((stats.totalScan / totalPayment) * 100);
  }, [stats.totalScan, totalPayment, days, period, transactions]);

  const maxValue = useMemo(() => {
    return Math.max(...dailyStats.map(d => Math.abs(d.profit)), 1);
  }, [dailyStats, days, period, transactions]);

  const handleProductClick = (productId: string) => {
    Taro.navigateTo({
      url: `/pages/product-detail/index?id=${productId}`,
    });
  };

  const methodColors: Record<string, string> = {
    cash: '#F59E0B',
    scan: '#3B82F6',
    credit: '#FF7D00',
    transfer: '#2DB84D',
  };

  const methodIcons: Record<string, string> = {
    cash: '💵',
    scan: '📱',
    credit: '📒',
    transfer: '🏦',
  };

  return (
    <ScrollView scrollY className={classnames(styles.pageContainer)} style={{ height: '100vh' }}>
      <View className={classnames(styles.periodTabs)}>
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

      <View className={classnames(styles.kpiSection)}>
        <View className={classnames(styles.kpiMain)}>
          <Text className={classnames(styles.kpiLabel)}>📈 周期总利润</Text>
          <View className={classnames(styles.kpiValue)}>
            <Text className={classnames(styles.kpiValueSymbol)}>¥</Text>
            <Text>{stats.profit.toFixed(2)}</Text>
          </View>
          <View className={classnames(styles.kpiChange, stats.change >= 0 ? styles.up : styles.down)}>
            {stats.change >= 0 ? '↑' : '↓'} {Math.abs(stats.change)}% 对比上期
          </View>
        </View>

        <View className={classnames(styles.kpiGrid)}>
          <View className={classnames(styles.kpiItem)}>
            <Text className={classnames(styles.kpiItemLabel)}>
              <Text className={classnames(styles.kpiItemIcon)}>💰</Text>总收入
            </Text>
            <Text className={classnames(styles.kpiItemValue)} style={{ color: '#2DB84D' }}>¥{stats.totalIncome.toFixed(0)}</Text>
          </View>
          <View className={classnames(styles.kpiItem)}>
            <Text className={classnames(styles.kpiItemLabel)}>
              <Text className={classnames(styles.kpiItemIcon)}>💸</Text>总支出
            </Text>
            <Text className={classnames(styles.kpiItemValue)} style={{ color: '#FF4D4F' }}>¥{stats.totalExpense.toFixed(0)}</Text>
          </View>
          <View className={classnames(styles.kpiItem)}>
            <Text className={classnames(styles.kpiItemLabel)}>
              <Text className={classnames(styles.kpiItemIcon)}>📊</Text>毛利率
            </Text>
            <Text className={classnames(styles.kpiItemValue)} style={{ color: '#F59E0B' }}>{stats.profitRate.toFixed(1)}%</Text>
          </View>
          <View className={classnames(styles.kpiItem)}>
            <Text className={classnames(styles.kpiItemLabel)}>
              <Text className={classnames(styles.kpiItemIcon)}>🧾</Text>流水笔数
            </Text>
            <Text className={classnames(styles.kpiItemValue)} style={{ color: '#3B82F6' }}>{stats.totalTx}笔</Text>
          </View>
        </View>
      </View>

      <View className={classnames(styles.chartSection)}>
        <View className={classnames(styles.chartHeader)}>
          <Text className={classnames(styles.chartTitle)}>
            <Text className={classnames(styles.chartTitleIcon)}>📊</Text>每日利润走势
          </Text>
        </View>
        <View className={classnames(styles.chartBars)}>
          {dailyStats.map((d, i) => {
            const heightPct = (Math.abs(d.profit) / maxValue) * 100;
            return (
              <View key={i} className={classnames(styles.chartBarWrap)}>
                <View
                  className={classnames(styles.chartBar, d.profit < 0 && styles.negative)}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                >
                  {d.profit > 100 && (
                    <Text className={classnames(styles.chartBarValue)}>¥{(d.profit / 100).toFixed(0)}百</Text>
                  )}
                </View>
                <Text className={classnames(styles.chartBarLabel)}>{formatDate(d.date, 'MM/DD')}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={classnames(styles.paymentPieSection)}>
        <SectionHeader title="💳 收款方式占比" />
        <View className={classnames(styles.pieRow)}>
          <View className={classnames(styles.pieVisual)}>
            <View className={classnames(styles.pieCashFill)} style={{ height: `${cashPercent}%` }} />
            <View
              className={classnames(styles.pieScanFill)}
              style={{ top: `${cashPercent}%`, height: `${scanPercent}%` }}
            />
            <View
              className={classnames(styles.pieOtherFill)}
              style={{ top: `${cashPercent + scanPercent}%`, height: `${100 - cashPercent - scanPercent}%` }}
            />
          </View>
          <View className={classnames(styles.pieLegend)}>
            <View className={classnames(styles.legendItem)}>
              <View className={classnames(styles.legendDot)} style={{ background: '#F59E0B' }} />
              <Text className={classnames(styles.legendText)}>💵 现金</Text>
              <Text className={classnames(styles.legendValue)}>{cashPercent}%</Text>
            </View>
            <View className={classnames(styles.legendItem)}>
              <View className={classnames(styles.legendDot)} style={{ background: '#3B82F6' }} />
              <Text className={classnames(styles.legendText)}>📱 扫码</Text>
              <Text className={classnames(styles.legendValue)}>{scanPercent}%</Text>
            </View>
            <View className={classnames(styles.legendItem)}>
              <View className={classnames(styles.legendDot)} style={{ background: '#FF7D00' }} />
              <Text className={classnames(styles.legendText)}>📒 其他</Text>
              <Text className={classnames(styles.legendValue)}>{100 - cashPercent - scanPercent}%</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={classnames(styles.paymentBreakdownSection)}>
        <SectionHeader title="💳 收款方式利润拆解" />
        <View className={classnames(styles.paymentBreakdown)}>
          {paymentBreakdown.map(item => (
            <View key={item.method} className={classnames(styles.breakdownItem)}>
              <View className={classnames(styles.breakdownHeader)}>
                <View className={classnames(styles.breakdownIcon)} style={{ background: methodColors[item.method] }}>
                  <Text>{methodIcons[item.method]}</Text>
                </View>
                <View className={classnames(styles.breakdownInfo)}>
                  <Text className={classnames(styles.breakdownLabel)}>{getPaymentMethodText(item.method)}</Text>
                  <Text className={classnames(styles.breakdownPercent)}>占总收入 {item.percent}%</Text>
                </View>
              </View>
              <View className={classnames(styles.breakdownValues)}>
                <View className={classnames(styles.breakdownValueItem)}>
                  <Text className={classnames(styles.breakdownValueLabel)}>收入</Text>
                  <Text className={classnames(styles.breakdownValue)}>¥{item.totalAmount.toFixed(0)}</Text>
                </View>
                <View className={classnames(styles.breakdownValueItem)}>
                  <Text className={classnames(styles.breakdownValueLabel)}>笔数</Text>
                  <Text className={classnames(styles.breakdownValue)}>{item.count}笔</Text>
                </View>
              </View>
              <View className={classnames(styles.breakdownBar)}>
                <View
                  className={classnames(styles.breakdownBarFill)}
                  style={{ width: `${item.percent}%`, background: methodColors[item.method] }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={classnames(styles.hotProductsSection)}>
        <SectionHeader title="🏆 热销商品排行" subtitle="按周期内营收" />
        {hotProducts.length === 0 ? (
          <View className={classnames(styles.emptyTip)}>
            <Text>暂无销售数据</Text>
          </View>
        ) : (
          <View className={classnames(styles.hotList)}>
            {hotProducts.map((p, i) => (
              <View
                key={p.id}
                className={classnames(styles.hotItem)}
                onClick={() => handleProductClick(p.id)}
              >
                <View
                  className={classnames(
                    styles.hotRank,
                    i === 0 ? styles.rank1 : i === 1 ? styles.rank2 : i === 2 ? styles.rank3 : styles.rankOther
                  )}
                >
                  {i + 1}
                </View>
                <View className={classnames(styles.hotInfo)}>
                  <Text className={classnames(styles.hotName)}>{p.name}</Text>
                  <Text className={classnames(styles.hotMeta)}>
                    已售{p.totalSold}{p.unit} · 利润¥{p.totalProfit.toFixed(0)}
                  </Text>
                </View>
                <Text className={classnames(styles.hotRevenue)}>¥{p.totalRevenue.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={classnames(styles.profitRankSection)}>
        <SectionHeader title="📊 商品利润排行" subtitle="按周期内利润" />
        {profitRankProducts.length === 0 ? (
          <View className={classnames(styles.emptyTip)}>
            <Text>暂无利润数据</Text>
          </View>
        ) : (
          <View className={classnames(styles.profitRankList)}>
            {profitRankProducts.map((p, i) => (
              <View
                key={p.id}
                className={classnames(styles.profitRankItem)}
                onClick={() => handleProductClick(p.id)}
              >
                <View
                  className={classnames(
                    styles.profitRankRank,
                    i === 0 ? styles.rank1 : i === 1 ? styles.rank2 : i === 2 ? styles.rank3 : styles.rankOther
                  )}
                >
                  {i + 1}
                </View>
                <View className={classnames(styles.profitRankInfo)}>
                  <View className={classnames(styles.profitRankHeader)}>
                    <Text className={classnames(styles.profitRankName)}>{p.name}</Text>
                    <Text className={classnames(styles.profitRankProfit)}>¥{p.profit.toFixed(0)}</Text>
                  </View>
                  <View className={classnames(styles.profitRankMeta)}>
                    已售{p.quantity}{p.unit} · 毛利率{p.profitRate.toFixed(1)}%
                  </View>
                  <View className={classnames(styles.profitRankValues)}>
                    <View className={classnames(styles.profitRankValueItem)}>
                      <Text className={classnames(styles.profitRankValueLabel)}>销售额</Text>
                      <Text className={classnames(styles.profitRankValue)}>¥{p.revenue.toFixed(0)}</Text>
                    </View>
                    <View className={classnames(styles.profitRankValueItem)}>
                      <Text className={classnames(styles.profitRankValueLabel)}>估算成本</Text>
                      <Text className={classnames(styles.profitRankValue)}>¥{p.cost.toFixed(0)}</Text>
                    </View>
                    <View className={classnames(styles.profitRankValueItem)}>
                      <Text className={classnames(styles.profitRankValueLabel)}>估算利润</Text>
                      <Text className={classnames(styles.profitRankValue, styles.profitHighlight)}>¥{p.profit.toFixed(0)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={classnames(styles.turnoverSection)}>
        <SectionHeader title="🔄 库存周转" />
        <View className={classnames(styles.turnoverStats)}>
          <View className={classnames(styles.turnoverItem)}>
            <Text className={classnames(styles.turnoverLabel)}>库存价值</Text>
            <Text className={classnames(styles.turnoverValue)}>¥{totalStockValue.toFixed(0)}</Text>
          </View>
          <View className={classnames(styles.turnoverItem)}>
            <Text className={classnames(styles.turnoverLabel)}>日均销售</Text>
            <Text className={classnames(styles.turnoverValue)}>¥{avgDailySales.toFixed(0)}</Text>
          </View>
          <View className={classnames(styles.turnoverItem)}>
            <Text className={classnames(styles.turnoverLabel)}>周转天数</Text>
            <Text className={classnames(styles.turnoverValue)}>{turnoverDays}天</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default DashboardPage;
