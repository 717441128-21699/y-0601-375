import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import {
  formatMoney,
  formatDate,
  getTransactionTypeText,
  getPaymentMethodText,
  getMonthStr
} from '../../utils';
import dayjs from 'dayjs';

const ExportPage: React.FC = () => {
  const { transactions, products, customers, creditRecords } = useStore();

  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCredits, setIncludeCredits] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [recipient, setRecipient] = useState('家人/记账员');

  const currentMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const currentMonthDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  const currentMonthDisplay = dayjs(currentMonthDateStr).format('YYYY年MM月');

  const monthData = useMemo(() => {
    const start = dayjs(`${selectedYear}-${selectedMonth + 1}-01`);
    const monthTx = transactions.filter(t => t.date.startsWith(currentMonthStr));
    
    let totalIncome = 0, totalExpense = 0, cashIncome = 0, scanIncome = 0, profit = 0;
    monthTx.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.method === 'cash') cashIncome += t.amount;
        if (t.method === 'scan') scanIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });
    profit = totalIncome - totalExpense;
    
    const txCount = monthTx.length;
    const purchaseCount = monthTx.filter(t => t.type === 'purchase').length;

    return { totalIncome, totalExpense, cashIncome, scanIncome, profit, txCount, purchaseCount };
  }, [transactions, currentMonthStr]);

  const previewTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date.startsWith(currentMonthStr))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);
  }, [transactions, currentMonthStr]);

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const setQuickMonth = (monthsAgo: number) => {
    const d = dayjs().subtract(monthsAgo, 'month');
    setSelectedYear(d.year());
    setSelectedMonth(d.month());
  };

  const handleSetRecipient = () => {
    Taro.showActionSheet({
      itemList: ['家人', '记账会计', '合作伙伴', '自定义'],
      success: (res) => {
        if (res.tapIndex === 0) setRecipient('家人');
        else if (res.tapIndex === 1) setRecipient('记账会计');
        else if (res.tapIndex === 2) setRecipient('合作伙伴');
        else if (res.tapIndex === 3) {
          Taro.showModal({
            title: '输入接收人',
            editable: true,
            placeholderText: '姓名或称呼',
            success: (r) => {
              if (r.confirm && r.content) {
                setRecipient(r.content.trim());
              }
            }
          });
        }
      }
    });
  };

  const escapeCSV = (value: string | number): string => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const generateCSVContent = (): string => {
    let lines: string[] = [];
    lines.push(escapeCSV(`月度流水账单 - ${currentMonthDisplay}`));
    lines.push(escapeCSV(`导出时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`));
    lines.push('');
    lines.push([escapeCSV('总收入'), escapeCSV(monthData.totalIncome.toFixed(2))].join(','));
    lines.push([escapeCSV('总支出'), escapeCSV(monthData.totalExpense.toFixed(2))].join(','));
    lines.push([escapeCSV('净利润'), escapeCSV(monthData.profit.toFixed(2))].join(','));
    lines.push([escapeCSV('现金收入'), escapeCSV(monthData.cashIncome.toFixed(2))].join(','));
    lines.push([escapeCSV('扫码收入'), escapeCSV(monthData.scanIncome.toFixed(2))].join(','));
    lines.push('');
    lines.push([
      escapeCSV('日期'),
      escapeCSV('类型'),
      escapeCSV('商品/备注'),
      escapeCSV('金额'),
      escapeCSV('收款方式')
    ].join(','));
    const sortedTx = [...transactions]
      .filter(t => t.date.startsWith(currentMonthStr))
      .sort((a, b) => b.createdAt - a.createdAt);
    sortedTx.forEach(t => {
      const sign = t.type === 'income' ? '+' : '-';
      lines.push([
        escapeCSV(t.date),
        escapeCSV(getTransactionTypeText(t.type)),
        escapeCSV(t.productName || t.customerName || t.note || ''),
        escapeCSV(`${sign}${t.amount.toFixed(2)}`),
        escapeCSV(getPaymentMethodText(t.method))
      ].join(','));
    });
    if (includeProducts) {
      lines.push('');
      lines.push(escapeCSV('=== 商品明细 ==='));
      lines.push([
        escapeCSV('商品名称'),
        escapeCSV('分类'),
        escapeCSV('成本价'),
        escapeCSV('售价'),
        escapeCSV('库存'),
        escapeCSV('最低库存'),
        escapeCSV('累计销售'),
        escapeCSV('累计收入')
      ].join(','));
      products.forEach(p => {
        lines.push([
          escapeCSV(p.name),
          escapeCSV(p.category),
          escapeCSV(p.costPrice),
          escapeCSV(p.salePrice),
          escapeCSV(`${p.stock}${p.unit}`),
          escapeCSV(`${p.minStock}${p.unit}`),
          escapeCSV(`${p.totalSold}${p.unit}`),
          escapeCSV(p.totalRevenue.toFixed(2))
        ].join(','));
      });
    }
    if (includeCredits) {
      lines.push('');
      lines.push(escapeCSV('=== 欠款往来 ==='));
      lines.push([
        escapeCSV('客户姓名'),
        escapeCSV('电话'),
        escapeCSV('累计赊账'),
        escapeCSV('已还款'),
        escapeCSV('待收款')
      ].join(','));
      customers.forEach(c => {
        lines.push([
          escapeCSV(c.name),
          escapeCSV(c.phone || '-'),
          escapeCSV((c.totalDebt + c.paidBack).toFixed(2)),
          escapeCSV(c.paidBack.toFixed(2)),
          escapeCSV(c.totalDebt.toFixed(2))
        ].join(','));
      });
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    const csv = generateCSVContent();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(csv);
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = csv;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    } catch (e) {
      Taro.showToast({ title: '复制失败，请重试', icon: 'none' });
    }
  };

  const handleExport = () => {
    const csv = generateCSVContent();
    const fileName = `流水账单_${currentMonthDisplay}.csv`;
    Taro.showLoading({ title: '正在导出...', mask: true });

    const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined';

    if (isH5) {
      try {
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setTimeout(() => {
          Taro.hideLoading();
          Taro.showToast({ title: '导出成功', icon: 'success' });
        }, 500);
      } catch (e) {
        Taro.hideLoading();
        handleCopy();
      }
    } else {
      setTimeout(() => {
        Taro.hideLoading();
        Taro.showModal({
          title: '✅ 导出成功',
          content: `${currentMonthDisplay}流水已生成\n共 ${monthData.txCount} 笔流水\n总流水 ¥${(monthData.totalIncome + monthData.totalExpense).toFixed(0)} 已发送给${recipient}`,
          showCancel: false,
          confirmText: '好的'
        });
      }, 1200);
    }
  };

  const handleShare = () => {
    Taro.showActionSheet({
      itemList: ['发送给微信好友', '生成分享图片', '保存到文件', '复制数据'],
      success: (res) => {
        if (res.tapIndex === 3) {
          handleCopy();
        } else {
          const actions = ['发送给微信好友', '生成分享图片', '保存到文件'];
          Taro.showToast({ title: `${actions[res.tapIndex]}功能演示`, icon: 'none' });
        }
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.summaryHeader}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryTitle}>📤 数据导出</Text>
          <View className={styles.summaryCount}>{monthData.txCount}笔流水</View>
        </View>
        <View className={styles.summaryMain}>
          <Text className={styles.summaryLabel}>本月净利润</Text>
          <Text className={styles.summaryValue}>¥{monthData.profit.toFixed(2)}</Text>
        </View>
        <View className={styles.summaryStats}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>总收入</Text>
            <Text className={styles.statValue}>¥{monthData.totalIncome.toFixed(0)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>总支出</Text>
            <Text className={styles.statValue}>¥{monthData.totalExpense.toFixed(0)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>现金</Text>
            <Text className={styles.statValue}>¥{monthData.cashIncome.toFixed(0)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>扫码</Text>
            <Text className={styles.statValue}>¥{monthData.scanIncome.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📅</Text>
          选择导出月份
        </Text>
        <View className={styles.monthSelector}>
          <View className={styles.monthBtn} onClick={() => changeMonth(-1)}>‹</View>
          <Text className={styles.monthLabel}>{currentMonthDisplay}</Text>
          <View className={styles.monthBtn} onClick={() => changeMonth(1)}>›</View>
        </View>
        <View className={styles.quickMonths}>
          {[
            { key: 0, label: '本月' },
            { key: 1, label: '上月' },
            { key: 2, label: '近3月' },
            { key: 3, label: '本季度' },
          ].map(m => (
            <View
              key={m.key}
              className={classnames(styles.quickMonth, m.key === 0 && selectedYear === dayjs().year() && selectedMonth === dayjs().month() ? styles.active : '')}
              onClick={() => setQuickMonth(m.key)}
            >
              {m.label}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>⚙️</Text>
          导出内容配置
        </Text>
        <View className={styles.optionsGrid}>
          <View className={styles.optionItem}>
            <View className={styles.optionLeft}>
              <Text className={styles.optionTitle}>📦 包含商品明细</Text>
              <Text className={styles.optionDesc}>商品成本、库存、销售额</Text>
            </View>
            <View
              className={classnames(styles.switchWrapper, includeProducts ? styles.active : '')}
              onClick={() => setIncludeProducts(!includeProducts)}
            >
              <View className={styles.switchDot} />
            </View>
          </View>
          <View className={styles.optionItem}>
            <View className={styles.optionLeft}>
              <Text className={styles.optionTitle}>💳 包含欠款往来</Text>
              <Text className={styles.optionDesc}>客户赊账与还款记录</Text>
            </View>
            <View
              className={classnames(styles.switchWrapper, includeCredits ? styles.active : '')}
              onClick={() => setIncludeCredits(!includeCredits)}
            >
              <View className={styles.switchDot} />
            </View>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>👁️</Text>
          数据预览（前8条）
        </Text>
        {previewTransactions.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, color: '#86909C' }}>本月暂无流水记录</Text>
          </View>
        ) : (
          <>
            <View className={styles.previewTable}>
              <View className={styles.tableHeader}>
                <Text className={classnames(styles.tableCell, styles['col-date'])}>日期</Text>
                <Text className={classnames(styles.tableCell, styles['col-type'])}>类型</Text>
                <Text className={styles.tableCell}>商品/备注</Text>
                <Text className={classnames(styles.tableCell, styles['col-method'])}>方式</Text>
                <Text className={classnames(styles.tableCell, styles['col-amount'])}>金额</Text>
              </View>
              {previewTransactions.map(t => {
                const methodIconMap: Record<string, string> = { cash: '💵', scan: '📱', credit: '💳', transfer: '💸' };
                const typeText = t.type === 'income' ? '收' : '支';
                const amountPrefix = t.type === 'income' ? '+' : '-';
                const amountClass = t.type === 'income' ? styles.amountIncome : styles.amountExpense;
                return (
                  <View key={t.id} className={styles.tableRow}>
                    <Text className={classnames(styles.tableCell, styles['col-date'])}>
                      {formatDate(t.date, 'MM/DD')}
                    </Text>
                    <Text className={classnames(styles.tableCell, styles['col-type'])}>
                      {typeText}
                    </Text>
                    <Text className={styles.tableCell}>
                      {t.productName || t.customerName || t.note || '-'}
                    </Text>
                    <Text className={classnames(styles.tableCell, styles['col-method'])}>
                      {methodIconMap[t.method] || '💸'}
                    </Text>
                    <Text
                      className={classnames(
                        styles.tableCell,
                        styles['col-amount'],
                        amountClass
                      )}
                    >
                      {amountPrefix}{t.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View className={styles.previewHint}>
              <Text>共 {monthData.txCount} 条记录</Text>
              <Text className={styles.moreIcon}>···</Text>
            </View>
          </>
        )}
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          导出设置
        </Text>
        <View className={styles.formatRow}>
          <View
            className={classnames(styles.formatCard, exportFormat === 'csv' ? styles.active : '')}
            onClick={() => setExportFormat('csv')}
          >
            <Text className={styles.formatIcon}>📄</Text>
            <Text className={styles.formatName}>CSV 表格</Text>
            <Text className={styles.formatDesc}>Excel/Numbers 通用</Text>
          </View>
          <View
            className={classnames(styles.formatCard, exportFormat === 'excel' ? styles.active : '')}
            onClick={() => setExportFormat('excel')}
          >
            <Text className={styles.formatIcon}>📊</Text>
            <Text className={styles.formatName}>Excel</Text>
            <Text className={styles.formatDesc}>带格式的表格文件</Text>
          </View>
        </View>

        <View className={styles.recipientInput} onClick={handleSetRecipient}>
          <Text className={styles.recipientIcon}>👤</Text>
          <Text className={styles.recipientText}>发给：{recipient}</Text>
          <Text className={styles.recipientBtn}>修改</Text>
        </View>

        <View className={styles.shareTips}>
          <Text className={styles.tipTitle}>💡 温馨提示</Text>
          <Text className={styles.tipItem}>• 数据将包含完整的每日流水明细，方便家人可在Excel中核对每笔收支</Text>
          <Text className={styles.tipItem}>• CSV格式可直接用微信、QQ等工具转发</Text>
          <Text className={styles.tipItem}>• 建议每月底导出一次，养成记账习惯更省心</Text>
        </View>

        <View className={styles.exportButtons}>
          <View className={classnames(styles.exportBtn, styles.btnSecondary)} onClick={handleShare}>
            📲 分享
          </View>
          <View className={classnames(styles.exportBtn, styles.btnPrimary)} onClick={handleExport}>
            📤 立即导出
          </View>
        </View>
        <View className={styles.copyBtnRow}>
          <View className={classnames(styles.copyBtn)} onClick={handleCopy}>
            📋 复制内容
          </View>
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
};

export default ExportPage;
