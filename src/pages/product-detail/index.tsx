import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { formatMoney, calculateProfitRate, formatDate, getTransactionTypeText, getPaymentMethodText } from '../../utils';
import SectionHeader from '../../components/SectionHeader';

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const { products, transactions, updateProductStock } = useStore();
  const productId = router.params?.id;

  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  const productTx = useMemo(() => {
    if (!productId) return [];
    return [...transactions.filter(t => t.productId === productId)]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }, [transactions, productId]);

  const totalSold = productTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.quantity || 0), 0);
  const totalPurchased = productTx.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.quantity || 0), 0);
  const totalRevenue = productTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalCost = productTx.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);

  const handleStockChange = (delta: number) => {
    if (!productId) return;
    if (delta < 0) {
      Taro.showModal({
        title: '减少库存',
        editable: true,
        placeholderText: '请输入减少数量',
        success: (res) => {
          if (res.confirm && res.content) {
            const n = parseInt(res.content) || 0;
            if (n > 0) {
              updateProductStock(productId, -n);
              Taro.showToast({ title: '已更新', icon: 'success' });
            }
          }
        }
      });
    } else {
      Taro.showModal({
        title: '增加库存',
        editable: true,
        placeholderText: '请输入增加数量',
        success: (res) => {
          if (res.confirm && res.content) {
            const n = parseInt(res.content) || 0;
            if (n > 0) {
              updateProductStock(productId, n);
              Taro.showToast({ title: '已更新', icon: 'success' });
            }
          }
        }
      });
    }
  };

  if (!product) {
    return (
      <View style={{ padding: 80, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, color: '#86909C' }}>商品不存在</Text>
      </View>
    );
  }

  const isLowStock = product.stock <= product.minStock;

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.header}>
        <Text className={styles.productName}>{product.name}</Text>
        <View className={styles.productCategory}>{product.category}</View>
        <View className={styles.headerStats}>
          <View className={styles.headerItem}>
            <Text className={styles.headerItemLabel}>累计售出</Text>
            <Text className={styles.headerItemValue}>{product.totalSold}{product.unit}</Text>
          </View>
          <View className={styles.headerItem}>
            <Text className={styles.headerItemLabel}>累计营收</Text>
            <Text className={styles.headerItemValue}>¥{product.totalRevenue.toFixed(0)}</Text>
          </View>
          <View className={styles.headerItem}>
            <Text className={styles.headerItemLabel}>毛利率</Text>
            <Text className={styles.headerItemValue}>{calculateProfitRate(product.salePrice, product.costPrice).toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text style={{ fontSize: 28, fontWeight: 600, color: '#1D2129', marginBottom: 16 }}>价格分析</Text>
        <View className={styles.priceCompare}>
          <View className={styles.priceItem}>
            <Text className={styles.priceLabel}>进货成本</Text>
            <Text className={classnames(styles.priceValue, styles.priceCost)}>{formatMoney(product.costPrice)}</Text>
          </View>
          <View className={styles.priceItem}>
            <Text className={styles.priceLabel}>对外售价</Text>
            <Text className={classnames(styles.priceValue, styles.priceSale)}>{formatMoney(product.salePrice)}</Text>
          </View>
          <View className={styles.priceItem}>
            <Text className={styles.priceLabel}>单件毛利</Text>
            <Text className={classnames(styles.priceValue, styles.priceProfit)}>+{formatMoney(product.salePrice - product.costPrice)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.stockSection}>
          <View className={styles.stockInfo}>
            <Text className={styles.stockLabel}>当前库存</Text>
            <Text className={classnames(styles.stockValue, isLowStock && styles.stockWarn)}>
              {product.stock} {product.unit}
            </Text>
            <Text style={{ fontSize: 22, color: '#86909C', marginTop: 4 }}>
              最低库存预警: {product.minStock} {product.unit}
            </Text>
          </View>
          <View className={styles.stockBtns}>
            <View className={classnames(styles.stockBtn, styles.btnAdd)} onClick={() => handleStockChange(1)}>
              + 补货
            </View>
            <View className={classnames(styles.stockBtn, styles.btnMinus)} onClick={() => handleStockChange(-1)}>
              - 盘减
            </View>
          </View>
        </View>
      </View>

      <SectionHeader title="📋 最近交易记录" subtitle={`${productTx.length}条`} />
      <View className={styles.section}>
        {productTx.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 60, opacity: 0.4, marginBottom: 12 }}>📝</Text>
            <Text style={{ fontSize: 26, color: '#86909C' }}>暂无该商品交易记录</Text>
          </View>
        ) : (
          <View className={styles.txList}>
            {productTx.map(t => (
              <View key={t.id} className={styles.txItem}>
                <View className={styles.txLeft}>
                  <Text className={styles.txType}>
                    {getTransactionTypeText(t.type)}
                  </Text>
                  <Text className={styles.txDate}>
                    {formatDate(t.createdAt, 'MM/DD HH:mm')}
                  </Text>
                  <Text className={styles.txMethod}>
                    {getPaymentMethodText(t.method)}
                  </Text>
                </View>
                <View className={styles.txRight}>
                  <Text className={classnames(styles.txAmount, t.type === 'income' ? styles.amountIn : styles.amountOut)}>
                    {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                  </Text>
                  <Text className={styles.txQty}>
                    {t.quantity && `x${t.quantity}${product.unit}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default ProductDetailPage;
