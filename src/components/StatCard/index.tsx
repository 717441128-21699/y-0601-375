import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  icon?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, color = 'primary', icon }) => {
  return (
    <View className={classnames(styles.statCard, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`])}>
      <View className={styles.header}>
        {icon && <Text className={styles.icon}>{icon}</Text>}
        <Text className={styles.title}>{title}</Text>
      </View>
      <View className={styles.valueRow}>
        <Text className={styles.value}>{value}</Text>
      </View>
      {subValue && <Text className={styles.subValue}>{subValue}</Text>}
    </View>
  );
};

export default StatCard;
