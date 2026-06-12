import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  extra?: string;
  onExtraClick?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, extra, onExtraClick }) => {
  return (
    <View className={styles.header}>
      <View className={styles.left}>
        <View className={styles.titleBar} />
        <Text className={styles.title}>{title}</Text>
      </View>
      <View className={styles.right}>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
        {extra && (
          <Text className={styles.extra} onClick={onExtraClick}>{extra} ›</Text>
        )}
      </View>
    </View>
  );
};

export default SectionHeader;
