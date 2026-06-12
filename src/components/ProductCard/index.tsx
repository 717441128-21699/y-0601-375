import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Product } from '../../types';
import { formatMoney, calculateProfitRate } from '../../utils';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const isLowStock = product.stock <= product.minStock;
  const profitRate = calculateProfitRate(product.salePrice, product.costPrice);
  const profit = product.salePrice - product.costPrice;

  return (
    <View className={classnames(styles.card, compact && styles.compact)}>
      <View className={styles.header}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{product.name}</Text>
          <Text className={styles.category}>{product.category}</Text>
        </View>
        {isLowStock && (
          <View className={styles.lowStockTag}>
            <Text className={styles.lowStockText}>⚠️ 库存低</Text>
          </View>
        )}
      </View>

      <View className={styles.priceGrid}>
        <View className={styles.priceItem}>
          <Text className={styles.priceLabel}>成本</Text>
          <Text className={styles.costPrice}>{formatMoney(product.costPrice)}/{product.unit}</Text>
        </View>
        <View className={styles.priceItem}>
          <Text className={styles.priceLabel}>售价</Text>
          <Text className={styles.salePrice}>{formatMoney(product.salePrice)}/{product.unit}</Text>
        </View>
        <View className={styles.priceItem}>
          <Text className={styles.priceLabel}>毛利</Text>
          <Text className={styles.profitText}>+{formatMoney(profit)}</Text>
        </View>
        <View className={styles.priceItem}>
          <Text className={styles.priceLabel}>毛利率</Text>
          <Text className={styles.rateText}>{profitRate.toFixed(1)}%</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.stockRow}>
          <Text className={styles.stockLabel}>库存</Text>
          <Text className={classnames(styles.stockValue, isLowStock && styles.stockWarn)}>
            {product.stock} {product.unit}
          </Text>
          <Text className={styles.minStock}>（最低 {product.minStock}）</Text>
        </View>
        {!compact && product.totalRevenue > 0 && (
          <View className={styles.revenueRow}>
            <Text className={styles.revenueText}>累计营收 {formatMoney(product.totalRevenue)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ProductCard;
