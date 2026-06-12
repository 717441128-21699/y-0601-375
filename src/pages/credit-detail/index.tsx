import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { formatMoney, formatDate, getTodayStr } from '../../utils';
import dayjs from 'dayjs';

type FilterType = 'week' | 'month' | 'all';

const CreditDetailPage: React.FC = () => {
  const router = useRouter();
  const customerId = router.params?.id;
  const { customers, creditRecords, addCreditRecord } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const customer = useMemo(
    () => customers.find(c => c.id === customerId),
    [customers, customerId]
  );

  const customerRecords = useMemo(
    () => creditRecords.filter(r => r.customerId === customerId),
    [creditRecords, customerId]
  );

  const stats = useMemo(() => {
    let totalBorrowed = 0;
    let totalRepaid = 0;
    customerRecords.forEach(r => {
      if (r.type === 'borrow') {
        totalBorrowed += r.amount;
      } else {
        totalRepaid += r.amount;
      }
    });
    const outstanding = Math.max(0, totalBorrowed - totalRepaid);
    return { totalBorrowed, totalRepaid, outstanding };
  }, [customerRecords]);

  const allRecordsWithBalance = useMemo(() => {
    const sorted = [...customerRecords].sort((a, b) => a.createdAt - b.createdAt);
    let balance = 0;
    return sorted.map(r => {
      if (r.type === 'borrow') {
        balance += r.amount;
      } else {
        balance -= r.amount;
      }
      return { ...r, balance: Math.max(0, balance) };
    });
  }, [customerRecords]);

  const { filteredRecords, openingBalance, closingBalance } = useMemo(() => {
    const now = dayjs();
    let startTime = 0;
    if (filter === 'week') {
      startTime = now.startOf('week').valueOf();
    } else if (filter === 'month') {
      startTime = now.startOf('month').valueOf();
    }

    const filtered = filter === 'all'
      ? allRecordsWithBalance
      : allRecordsWithBalance.filter(r => r.createdAt >= startTime);

    let opening = 0;
    if (filter !== 'all' && allRecordsWithBalance.length > 0) {
      const beforeStart = allRecordsWithBalance.filter(r => r.createdAt < startTime);
      if (beforeStart.length > 0) {
        opening = beforeStart[beforeStart.length - 1].balance;
      }
    }

    const closing = filtered.length > 0
      ? filtered[filtered.length - 1].balance
      : opening;

    return {
      filteredRecords: filtered,
      openingBalance: opening,
      closingBalance: closing,
    };
  }, [allRecordsWithBalance, filter]);

  const recordsWithBalance = useMemo(() => {
    return [...filteredRecords].sort((a, b) => b.createdAt - a.createdAt);
  }, [filteredRecords]);

  const handleBorrow = () => {
    if (!customer) return;
    Taro.showModal({
      title: `登记${customer.name}赊账`,
      editable: true,
      placeholderText: '请输入赊账金额',
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content) || 0;
          if (amount > 0) {
            Taro.showModal({
              title: '备注（选填）',
              editable: true,
              placeholderText: '例如：购买商品',
              success: (noteRes) => {
                addCreditRecord({
                  customerId: customer.id,
                  customerName: customer.name,
                  type: 'borrow',
                  amount,
                  date: getTodayStr(),
                  note: noteRes.content || undefined,
                });
                Taro.showToast({ title: '已登记', icon: 'success' });
              }
            });
          }
        }
      }
    });
  };

  const handleRepay = () => {
    if (!customer) return;
    if (stats.outstanding <= 0) {
      Taro.showToast({ title: '该客户无欠款', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: `登记${customer.name}还款`,
      editable: true,
      placeholderText: `最多 ${stats.outstanding.toFixed(2)} 元`,
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content) || 0;
          if (amount > 0) {
            Taro.showModal({
              title: '备注（选填）',
              editable: true,
              placeholderText: '例如：现金还款',
              success: (noteRes) => {
                addCreditRecord({
                  customerId: customer.id,
                  customerName: customer.name,
                  type: 'repay',
                  amount,
                  date: getTodayStr(),
                  note: noteRes.content || undefined,
                });
                Taro.showToast({ title: '已登记还款', icon: 'success' });
              }
            });
          }
        }
      }
    });
  };

  if (!customer) {
    return (
      <View style={{ padding: 80, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, color: '#86909C' }}>客户不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.summaryHeader}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryTitle}>📋 {customer.name} 对账单</Text>
        </View>
        <View className={styles.summaryMain}>
          <Text className={styles.summaryLabel}>待收款</Text>
          <Text className={styles.summaryValue}>¥{stats.outstanding.toFixed(2)}</Text>
        </View>
        <View className={styles.summaryStats}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>累计赊账</Text>
            <Text className={styles.statValue}>¥{stats.totalBorrowed.toFixed(0)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>已还款</Text>
            <Text className={styles.statValue}>¥{stats.totalRepaid.toFixed(0)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>交易笔数</Text>
            <Text className={styles.statValue}>{customerRecords.length}</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View
          className={classnames(styles.filterTab, filter === 'week' && styles.active)}
          onClick={() => setFilter('week')}
        >
          本周
        </View>
        <View
          className={classnames(styles.filterTab, filter === 'month' && styles.active)}
          onClick={() => setFilter('month')}
        >
          本月
        </View>
        <View
          className={classnames(styles.filterTab, filter === 'all' && styles.active)}
          onClick={() => setFilter('all')}
        >
          全部
        </View>
      </View>

      {recordsWithBalance.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📝</Text>
          <Text className={styles.emptyText}>暂无交易记录</Text>
        </View>
      ) : (
        <View className={styles.txTimeline}>
          {filter !== 'all' && (
            <View className={styles.balanceRow}>
              <Text className={styles.balanceLabel}>期初余额</Text>
              <Text className={styles.balanceValue}>¥{openingBalance.toFixed(2)}</Text>
            </View>
          )}
          {recordsWithBalance.map(r => (
            <View key={r.id} className={styles.txItem}>
              <View className={styles.txItemLeft}>
                <View className={classnames(styles.txIcon, r.type)}>
                  {r.type === 'borrow' ? '📒' : '✅'}
                </View>
              </View>
              <View className={styles.txInfo}>
                <Text className={styles.txType}>
                  {r.type === 'borrow' ? '赊账' : '还款'}
                </Text>
                <Text className={styles.txDate}>
                  {formatDate(r.createdAt, 'MM/DD HH:mm')}
                </Text>
                {r.note && <Text className={styles.txNote}>{r.note}</Text>}
              </View>
              <View>
                <Text className={classnames(styles.txAmount, r.type)}>
                  {r.type === 'borrow' ? '+' : '-'}{formatMoney(r.amount)}
                </Text>
                <Text className={styles.txBalance}>余额 ¥{r.balance.toFixed(2)}</Text>
              </View>
            </View>
          ))}
          <View className={styles.balanceRow}>
            <Text className={styles.balanceLabel}>当前余额</Text>
            <Text className={styles.balanceValue}>¥{closingBalance.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View style={{ height: 160 }} />

      <View className={styles.footerSummary}>
        <View
          className={classnames(styles.footerBtn, styles.btnBorrow)}
          onClick={handleBorrow}
        >
          登记赊账
        </View>
        <View
          className={classnames(styles.footerBtn, styles.btnRepay)}
          onClick={handleRepay}
        >
          登记还款
        </View>
      </View>
    </ScrollView>
  );
};

export default CreditDetailPage;
