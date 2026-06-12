import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useStore } from '../../store/useStore';
import { formatMoney } from '../../utils';
import SectionHeader from '../../components/SectionHeader';

const DataPage: React.FC = () => {
  const { products, customers, getLowStockProducts, getUnpaidCustomers, transactions, calendarEvents } = useStore();

  const lowStock = getLowStockProducts();
  const unpaidCustomers = getUnpaidCustomers();
  const totalDebt = unpaidCustomers.reduce((s, c) => s + c.totalDebt, 0);
  const thisMonthEvents = calendarEvents.filter(e => e.isMarketDay).length;

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url });
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>🗂️ 数据中心</Text>
        <Text className={styles.headerDesc}>
          摊位日历、欠款往来、库存提醒和数据导出一站式管理
        </Text>
      </View>

      <View className={styles.functionGrid}>
        <View className={styles.functionCard} onClick={() => handleNavigate('/pages/calendar/index')}>
          <View className={classnames(styles.functionIcon, styles.functionIcon1)}>📅</View>
          <Text className={styles.functionTitle}>摊位日历</Text>
          <Text className={styles.functionDesc}>标记赶集日期、天气、客流</Text>
          {thisMonthEvents > 0 && (
            <View className={classnames(styles.functionBadge, styles.badgeInfo)}>本月{thisMonthEvents}个赶集日</View>
          )}
        </View>

        <View className={styles.functionCard} onClick={() => handleNavigate('/pages/credit/index')}>
          <View className={classnames(styles.functionIcon, styles.functionIcon2)}>💳</View>
          <Text className={styles.functionTitle}>欠款往来</Text>
          <Text className={styles.functionDesc}>赊账客户记录与还款追踪</Text>
          {totalDebt > 0 && (
            <View className={classnames(styles.functionBadge, styles.badgeDanger)}>待收 ¥{totalDebt.toFixed(0)}</View>
          )}
        </View>

        <View className={styles.functionCard} onClick={() => handleNavigate('/pages/inventory/index')}>
          <View className={classnames(styles.functionIcon, styles.functionIcon3)}>📦</View>
          <Text className={styles.functionTitle}>库存提醒</Text>
          <Text className={styles.functionDesc}>低库存商品补货预警</Text>
          {lowStock.length > 0 && (
            <View className={classnames(styles.functionBadge, styles.badgeWarn)}>{lowStock.length}种库存不足</View>
          )}
        </View>

        <View className={styles.functionCard} onClick={() => handleNavigate('/pages/export/index')}>
          <View className={classnames(styles.functionIcon, styles.functionIcon4)}>📤</View>
          <Text className={styles.functionTitle}>数据导出</Text>
          <Text className={styles.functionDesc}>月度流水导出给家人核对</Text>
        </View>
      </View>

      <SectionHeader title="💰 赊账客户" subtitle={`${unpaidCustomers.length}位`} extra="查看全部" onExtraClick={() => handleNavigate('/pages/credit/index')} />
      <View className={styles.quickSection}>
        {unpaidCustomers.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 60, opacity: 0.4, marginBottom: 16 }}>🎉</Text>
            <Text style={{ fontSize: 28, color: '#86909C' }}>暂无赊账客户</Text>
          </View>
        ) : (
          <View className={styles.quickList}>
            {unpaidCustomers.slice(0, 3).map(c => (
              <View key={c.id} className={styles.quickItem} onClick={() => handleNavigate('/pages/credit/index')}>
                <View className={styles.quickLeft}>
                  <View className={styles.quickIcon}>👤</View>
                  <View className={styles.quickInfo}>
                    <Text className={styles.quickName}>{c.name}</Text>
                    <Text className={styles.quickMeta}>{c.phone || '暂无电话'}</Text>
                  </View>
                </View>
                <Text className={classnames(styles.quickAmount, styles.amountDebt)}>¥{c.totalDebt.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <SectionHeader title="⚠️ 低库存商品" subtitle={`${lowStock.length}种`} extra="查看全部" onExtraClick={() => handleNavigate('/pages/inventory/index')} />
      <View className={styles.quickSection}>
        {lowStock.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 60, opacity: 0.4, marginBottom: 16 }}>✅</Text>
            <Text style={{ fontSize: 28, color: '#86909C' }}>库存状态良好</Text>
          </View>
        ) : (
          <View className={styles.quickList}>
            {lowStock.slice(0, 3).map(p => (
              <View key={p.id} className={styles.quickItem} onClick={() => handleNavigate(`/pages/product-detail/index?id=${p.id}`)}>
                <View className={styles.quickLeft}>
                  <View className={styles.quickIcon}>📦</View>
                  <View className={styles.quickInfo}>
                    <Text className={styles.quickName}>{p.name}</Text>
                    <Text className={styles.quickMeta}>最低 {p.minStock}{p.unit} / 当前 {p.stock}{p.unit}</Text>
                  </View>
                </View>
                <Text className={classnames(styles.quickAmount, styles.amountLow)}>-{p.minStock - p.stock}{p.unit}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <SectionHeader title="📊 数据统计" />
      <View className={styles.quickSection}>
        <View className={styles.quickList}>
          <View className={styles.quickItem}>
            <View className={styles.quickLeft}>
              <View className={styles.quickIcon}>📦</View>
              <View className={styles.quickInfo}>
                <Text className={styles.quickName}>商品总数</Text>
                <Text className={styles.quickMeta}>在售商品种类</Text>
              </View>
            </View>
            <Text className={classnames(styles.quickAmount, styles.amountPositive)}>{products.length}种</Text>
          </View>
          <View className={styles.quickItem}>
            <View className={styles.quickLeft}>
              <View className={styles.quickIcon}>🧾</View>
              <View className={styles.quickInfo}>
                <Text className={styles.quickName}>流水记录</Text>
                <Text className={styles.quickMeta}>累计记账笔数</Text>
              </View>
            </View>
            <Text className={classnames(styles.quickAmount, styles.amountPositive)}>{transactions.length}笔</Text>
          </View>
          <View className={styles.quickItem}>
            <View className={styles.quickLeft}>
              <View className={styles.quickIcon}>👥</View>
              <View className={styles.quickInfo}>
                <Text className={styles.quickName}>客户总数</Text>
                <Text className={styles.quickMeta}>赊账客户档案</Text>
              </View>
            </View>
            <Text className={classnames(styles.quickAmount, styles.amountPositive)}>{customers.length}位</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default DataPage;
