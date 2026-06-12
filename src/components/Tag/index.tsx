import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface TagProps {
  text: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
}

const Tag: React.FC<TagProps> = ({ text, color = 'default', size = 'sm' }) => {
  return (
    <View className={classnames(styles.tag, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`], styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`])}>
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default Tag;
