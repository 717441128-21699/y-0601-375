import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { formatMoney, formatDate, getTodayStr } from '../../utils';

const CreditPage: React.FC = () => {
  const { customers, creditRecords, addCustomer, addCreditRecord } = useStore();

  const customerStats = useMemo(() => {
    const stats: Record<string, { totalBorrowed: number; totalRepaid: number; outstanding: number }> = {};
    creditRecords.forEach(r => {
      if (!stats[r.customerId]) {
        stats[r.customerId] = { totalBorrowed: 0, totalRepaid: 0, outstanding: 0 };
      }
      if (r.type === 'borrow') {
        stats[r.customerId].totalBorrowed += r.amount;
        stats[r.customerId].outstanding += r.amount;
      } else {
        stats[r.customerId].totalRepaid += r.amount;
        stats[r.customerId].outstanding -= r.amount;
      }
    });
    Object.keys(stats).forEach(k => {
      stats[k].outstanding = Math.max(0, stats[k].outstanding);
    });
    return stats;
  }, [creditRecords]);

  const totalDebt = useMemo(() =>
    customers.reduce((s, c) => s + (customerStats[c.id]?.outstanding || 0), 0),
    [customers, customerStats]
  );
  const totalPaid = useMemo(() =>
    customers.reduce((s, c) => s + (customerStats[c.id]?.totalRepaid || 0), 0),
    [customers, customerStats]
  );
  const totalLent = useMemo(() =>
    customers.reduce((s, c) => s + (customerStats[c.id]?.totalBorrowed || 0), 0),
    [customers, customerStats]
  );
  const unpaidCount = useMemo(() =>
    customers.filter(c => (customerStats[c.id]?.outstanding || 0) > 0).length,
    [customers, customerStats]
  );

  const recordsByCustomer = useMemo(() => {
    const map: Record<string, any[]> = {};
    creditRecords.forEach(r => {
      if (!map[r.customerId]) map[r.customerId] = [];
      map[r.customerId].push(r);
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => b.createdAt - a.createdAt);
    });
    return map;
  }, [creditRecords]);

  const handleAddCustomer = () => {
    Taro.showModal({
      title: '新增客户',
      editable: true,
      placeholderText: '客户姓名',
      success: (nameRes) => {
        if (nameRes.confirm && nameRes.content) {
          const name = nameRes.content.trim();
          Taro.showModal({
            title: '客户电话（选填）',
            editable: true,
            placeholderText: '例如 138****8888',
            success: (phoneRes) => {
              addCustomer({
                name,
                phone: phoneRes.content || undefined,
              });
              Taro.showToast({ title: '客户已添加', icon: 'success' });
              console.log('[Credit] addCustomer:', name);
            }
          });
        }
      }
    });
  };

  const handleBorrow = (customer: any) => {
    Taro.showModal({
      title: `登记${customer.name}赊账`,
      editable: true,
      placeholderText: '请输入赊账金额',
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content) || 0;
          if (amount > 0) {
            addCreditRecord({
              customerId: customer.id,
              customerName: customer.name,
              type: 'borrow',
              amount,
              date: getTodayStr(),
            });
            Taro.showToast({ title: '已登记', icon: 'success' });
          }
        }
      }
    });
  };

  const handleRepay = (customer: any) => {
    const cs = customerStats[customer.id];
    const outstanding = cs?.outstanding || 0;
    if (outstanding <= 0) {
      Taro.showToast({ title: '该客户无欠款', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: `登记${customer.name}还款`,
      editable: true,
      placeholderText: `最多 ${outstanding.toFixed(2)} 元`,
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content) || 0;
          if (amount > 0) {
            addCreditRecord({
              customerId: customer.id,
              customerName: customer.name,
              type: 'repay',
              amount,
              date: getTodayStr(),
            });
            Taro.showToast({ title: '已登记还款', icon: 'success' });
          }
        }
      }
    });
  };

  const handleCall = (customer: any) => {
    if (customer.phone) {
      Taro.showActionSheet({
        itemList: ['拨打电话', '登记赊账', '登记还款'],
        success: (res) => {
          if (res.tapIndex === 0) {
            console.log('[Credit] call:', customer.phone);
            Taro.showToast({ title: '拨号功能', icon: 'none' });
          } else if (res.tapIndex === 1) {
            handleBorrow(customer);
          } else if (res.tapIndex === 2) {
            handleRepay(customer);
          }
        }
      });
    } else {
      Taro.showActionSheet({
        itemList: ['登记赊账', '登记还款'],
        success: (res) => {
          if (res.tapIndex === 0) handleBorrow(customer);
          else if (res.tapIndex === 1) handleRepay(customer);
        }
      });
    }
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.summaryHeader}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryTitle}>💰 赊账总览</Text>
          <View className={styles.summaryCount}>{unpaidCount}/{customers.length}位</View>
        </View>
        <View className={styles.summaryMain}>
          <Text className={styles.summaryLabel}>待收欠款总额</Text>
          <Text className={styles.summaryValue}>¥{totalDebt.toFixed(2)}</Text>
        </View>
        <View className={styles.summaryStats}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>累计赊账</Text>
            <Text className={styles.statValue}>¥{totalLent.toFixed(0)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>已收回款</Text>
            <Text className={styles.statValue}>¥{totalPaid.toFixed(0)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>回款率</Text>
            <Text className={styles.statValue}>
              {totalLent > 0 ? Math.round((totalPaid / totalLent) * 100) : 0}%
            </Text>
          </View>
        </View>
      </View>

      {customers.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>👥</Text>
          <Text className={styles.emptyText}>暂无赊账客户</Text>
          <Text className={styles.emptyText} style={{ fontSize: 22, marginTop: 8 }}>点击右下角添加客户</Text>
        </View>
      ) : (
        customers.map(c => {
          const records = recordsByCustomer[c.id] || [];
          const cs = customerStats[c.id] || { totalBorrowed: 0, totalRepaid: 0, outstanding: 0 };
          const outstanding = cs.outstanding;
          const totalBorrowed = cs.totalBorrowed;
          const totalRepaid = cs.totalRepaid;
          const total = totalBorrowed || 1;
          const progress = Math.round((totalRepaid / total) * 100);
          return (
            <View key={c.id} className={styles.customerCard}>
              <View className={styles.customerHeader}>
                <View className={styles.customerInfo}>
                  <View className={styles.customerAvatar}>
                    {c.name.charAt(0)}
                  </View>
                  <View className={styles.customerText}>
                    <Text className={styles.customerName}>{c.name}</Text>
                    <Text className={styles.customerPhone}>{c.phone || '暂无联系电话'}</Text>
                  </View>
                </View>
                <View className={classnames(styles.debtBadge, outstanding > 0 ? styles.hasDebt : styles.clear)}>
                  {outstanding > 0 ? `欠¥${outstanding.toFixed(0)}` : '已结清 ✓'}
                </View>
              </View>

              {outstanding > 0 && (
                <>
                  <View className={styles.customerProgress}>
                    <View className={styles.progressBar}>
                      <View className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </View>
                    <View className={styles.progressLabels}>
                      <Text className={styles.progressLabel}>已还 ¥{totalRepaid.toFixed(0)}</Text>
                      <Text className={styles.progressLabel}>还款进度 {progress}%</Text>
                    </View>
                  </View>
                </>
              )}

              {records.length > 0 && (
                <View className={styles.customerRecords}>
                  {records.slice(0, 3).map(r => (
                    <View key={r.id} className={styles.recordItem}>
                      <View className={styles.recordLeft}>
                        <View className={classnames(styles.recordIcon, r.type)}>
                          {r.type === 'borrow' ? '📒' : '✅'}
                        </View>
                        <View className={styles.recordInfo}>
                          <Text className={styles.recordType}>
                            {r.type === 'borrow' ? '赊账' : '还款'}
                            {r.note && ` · ${r.note}`}
                          </Text>
                          <Text className={styles.recordDate}>{formatDate(r.date, 'MM月DD日')}</Text>
                        </View>
                      </View>
                      <Text className={classnames(styles.recordAmount, r.type)}>
                        {r.type === 'borrow' ? '+' : '-'}{formatMoney(r.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View className={styles.actionRow}>
                <View className={classnames(styles.actionBtn, styles.btnCall)} onClick={() => handleCall(c)}>
                  ⋯ 更多操作
                </View>
                <View
                  className={classnames(styles.actionBtn, styles.btnRepay)}
                  onClick={() => handleRepay(c)}
                >
                  💰 登记还款
                </View>
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: 80 }} />

      <View className={styles.addCustomerBtn} onClick={handleAddCustomer}>
        <Text className={styles.addCustomerText}>＋ 添加客户</Text>
      </View>
    </ScrollView>
  );
};

export default CreditPage;
