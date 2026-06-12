import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface QuickActionBtnProps {
  icon: string;
  label: string;
  color?: 'green' | 'red' | 'orange' | 'blue' | 'purple';
  onClick?: () => void;
}

const QuickActionBtn: React.FC<QuickActionBtnProps> = ({ icon, label, color = 'orange', onClick }) => {
  return (
    <View className={classnames(styles.btn, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`])} onClick={onClick}>
      <View className={styles.iconWrap}>
        <Text className={styles.icon}>{icon}</Text>
      </View>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default QuickActionBtn;
