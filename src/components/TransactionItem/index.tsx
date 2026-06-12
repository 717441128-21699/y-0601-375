import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Transaction } from '../../types';
import { formatMoney, getPaymentMethodText, getTransactionTypeText, formatDate } from '../../utils';

interface TransactionItemProps {
  transaction: Transaction;
}

const typeIconMap: Record<string, string> = {
  income: '💰',
  expense: '💸',
  purchase: '📦',
  rent: '🏪',
  transport: '🚚',
  loss: '📉',
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isIncome = transaction.type === 'income';

  return (
    <View className={styles.item}>
      <View className={styles.iconWrap}>
        <Text className={styles.icon}>{typeIconMap[transaction.type] || '📝'}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.topRow}>
          <Text className={styles.title}>
            {transaction.productName || getTransactionTypeText(transaction.type)}
          </Text>
          <Text className={classnames(styles.amount, isIncome ? styles.income : styles.expense)}>
            {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
          </Text>
        </View>
        <View className={styles.bottomRow}>
          <View className={styles.metaRow}>
            <Text className={styles.metaItem}>{getTransactionTypeText(transaction.type)}</Text>
            {transaction.quantity && (
              <Text className={styles.metaItem}>x{transaction.quantity}</Text>
            )}
          </View>
          <View className={styles.metaRow}>
            <Text className={classnames(styles.methodTag, styles[`method${transaction.method.charAt(0).toUpperCase() + transaction.method.slice(1)}`])}>
              {getPaymentMethodText(transaction.method)}
            </Text>
            <Text className={styles.time}>
              {formatDate(transaction.createdAt, 'HH:mm')}
            </Text>
          </View>
        </View>
        {transaction.note && <Text className={styles.note}>📝 {transaction.note}</Text>}
        {transaction.customerName && <Text className={styles.customer}>👤 {transaction.customerName}</Text>}
      </View>
    </View>
  );
};

export default TransactionItem;
