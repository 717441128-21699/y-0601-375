import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { formatMoney, getTodayStr, formatDate } from '../../utils';
import { Product } from '../../types';

type FilterType = 'all' | 'critical' | 'warning' | 'normal';
type StockLevel = 'critical' | 'warning' | 'normal';

interface RestockResultData {
  productId: string;
  productName: string;
  emoji: string;
  unit: string;
  minStock: number;
  stockBefore: number;
  stockAfter: number;
  restockQty: number;
  unitPrice: number;
  totalAmount: number;
  levelBefore: StockLevel;
  levelAfter: StockLevel;
  restockTime: string;
  recordType: string;
  stockRatioBefore: number;
  stockRatioAfter: number;
}

const InventoryPage: React.FC = () => {
  const { products, transactions, updateProduct, updateProductStock, addTransaction } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [restockResult, setRestockResult] = useState<RestockResultData | null>(null);
  const [highlightedProductIds, setHighlightedProductIds] = useState<Set<string>>(new Set());

  const getStockLevel = (product: Product): 'critical' | 'warning' | 'normal' => {
    const ratio = product.stock / product.minStock;
    if (ratio <= 0.5) return 'critical';
    if (ratio <= 1) return 'warning';
    return 'normal';
  };

  const getDaysUntilOut = (product: Product): number => {
    const salesIn7Days = transactions
      .filter(t => t.type === 'income' && t.productId === product.id)
      .reduce((s, t) => s + (t.quantity || 0), 0);
    const avgDaily = salesIn7Days / 7;
    if (avgDaily <= 0) return 999;
    return Math.ceil(product.stock / avgDaily);
  };

  const getRestockAmount = (product: Product): number => {
    const target = product.minStock * 2;
    return Math.max(0, target - product.stock);
  };

  const { lowStockProducts, criticalCount, warningCount, normalCount, totalStockValue } = useMemo(() => {
    const low = products.filter(p => getStockLevel(p) !== 'normal');
    let critical = 0, warning = 0, normal = 0;
    let value = 0;
    products.forEach(p => {
      value += p.stock * p.costPrice;
      const level = getStockLevel(p);
      if (level === 'critical') critical++;
      else if (level === 'warning') warning++;
      else normal++;
    });
    return {
      lowStockProducts: low,
      criticalCount: critical,
      warningCount: warning,
      normalCount: normal,
      totalStockValue: value
    };
  }, [products, transactions]);

  const restockHistory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'purchase')
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        productId: t.productId,
        productName: t.productName || '进货',
        date: t.date,
        amount: t.quantity || 0,
        unit: products.find(p => p.id === t.productId)?.unit || ''
      }));
  }, [transactions, products]);

  const { highlightedProducts, normalFilteredProducts } = useMemo(() => {
    let baseFiltered: Product[];
    if (filter === 'all') {
      baseFiltered = products.filter(p => getStockLevel(p) !== 'normal');
    } else if (filter === 'normal') {
      baseFiltered = products.filter(p => getStockLevel(p) === filter);
    } else {
      baseFiltered = products.filter(p => getStockLevel(p) === filter);
    }
    const highlighted: Product[] = [];
    const normalFiltered: Product[] = [];
    baseFiltered.forEach(p => {
      if (highlightedProductIds.has(p.id)) {
        highlighted.push(p);
      } else {
        normalFiltered.push(p);
      }
    });
    products.forEach(p => {
      if (highlightedProductIds.has(p.id) && !highlighted.find(h => h.id === p.id)) {
        highlighted.push(p);
      }
    });
    const sortFn = (a: Product, b: Product) => {
      const levelA = getStockLevel(a);
      const levelB = getStockLevel(b);
      const order = { critical: 0, warning: 1, normal: 2 };
      if (order[levelA] !== order[levelB]) return order[levelA] - order[levelB];
      return a.stock / a.minStock - b.stock / b.minStock;
    };
    highlighted.sort(sortFn);
    normalFiltered.sort(sortFn);
    return { highlightedProducts: highlighted, normalFilteredProducts: normalFiltered };
  }, [products, filter, transactions, highlightedProductIds]);

  const handleQuickRestock = (product: Product) => {
    const recommended = getRestockAmount(product);
    Taro.showModal({
      title: `补货 ${product.name}`,
      editable: true,
      placeholderText: `建议补货 ${recommended}${product.unit}`,
      success: (qtyRes) => {
        if (qtyRes.confirm && qtyRes.content) {
          const qty = parseInt(qtyRes.content) || 0;
          if (qty > 0) {
            Taro.showModal({
              title: '进货单价',
              editable: true,
              placeholderText: `当前成本价 ¥${product.costPrice}`,
              success: (priceRes) => {
                const unitPrice = parseFloat(priceRes.content) || product.costPrice;
                const totalAmount = qty * unitPrice;
                const stockBefore = product.stock;
                const stockAfter = stockBefore + qty;
                const levelBefore = getStockLevel(product);
                const tempProduct: Product = { ...product, stock: stockAfter };
                const levelAfter = getStockLevel(tempProduct);
                addTransaction({
                  type: 'purchase',
                  amount: totalAmount,
                  method: 'transfer',
                  productId: product.id,
                  productName: product.name,
                  quantity: qty,
                  unitPrice,
                  note: `库存提醒页快速补货`,
                  date: getTodayStr(),
                });
                const now = Date.now();
                const timeStr = new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const stockRatioBefore = stockBefore / product.minStock;
                const stockRatioAfter = stockAfter / product.minStock;
                setRestockResult({
                  productId: product.id,
                  productName: product.name,
                  emoji: getProductEmoji(product.name),
                  unit: product.unit,
                  minStock: product.minStock,
                  stockBefore,
                  stockAfter,
                  restockQty: qty,
                  unitPrice,
                  totalAmount,
                  levelBefore,
                  levelAfter,
                  restockTime: timeStr,
                  recordType: '进货',
                  stockRatioBefore,
                  stockRatioAfter,
                });
                setHighlightedProductIds(prev => new Set(prev).add(product.id));
                console.log('[Inventory] restock:', product.name, qty, unitPrice);
              }
            });
          }
        }
      }
    });
  };

  const handleCloseRestockModal = () => {
    setRestockResult(null);
  };

  const handleViewProductDetail = () => {
    if (restockResult) {
      Taro.navigateTo({ url: `/pages/product-detail/index?id=${restockResult.productId}` });
      setRestockResult(null);
    }
  };

  const handleAdjustStock = (product: Product) => {
    Taro.showActionSheet({
      itemList: ['盘点增加', '损耗减少', '调整最低库存线'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.showModal({
            title: '盘点增加数量',
            editable: true,
            placeholderText: '请输入增加的数量',
            success: (r) => {
              if (r.confirm && r.content) {
                const qty = parseInt(r.content) || 0;
                if (qty > 0) {
                  addTransaction({
                    type: 'adjust',
                    amount: 0,
                    method: 'cash',
                    productId: product.id,
                    productName: product.name,
                    quantity: qty,
                    unitPrice: product.costPrice,
                    note: '盘点增加',
                    date: getTodayStr(),
                  });
                  Taro.showToast({ title: '已更新', icon: 'success' });
                }
              }
            }
          });
        } else if (res.tapIndex === 1) {
          Taro.showModal({
            title: '损耗减少数量',
            editable: true,
            placeholderText: '请输入损耗的数量',
            success: (r) => {
              if (r.confirm && r.content) {
                const qty = parseInt(r.content) || 0;
                if (qty > 0) {
                  addTransaction({
                    type: 'loss',
                    amount: qty * product.costPrice,
                    method: 'cash',
                    productId: product.id,
                    productName: product.name,
                    quantity: qty,
                    unitPrice: product.costPrice,
                    note: `库存损耗`,
                    date: getTodayStr(),
                  });
                  Taro.showToast({ title: '已记录损耗', icon: 'success' });
                }
              }
            }
          });
        } else if (res.tapIndex === 2) {
          Taro.showModal({
            title: '设置最低库存',
            editable: true,
            placeholderText: `当前最低 ${product.minStock}${product.unit}`,
            success: (r) => {
              if (r.confirm && r.content) {
                const min = parseInt(r.content) || 0;
                if (min >= 0) {
                  updateProduct(product.id, { minStock: min });
                  Taro.showToast({ title: `已设为${min}${product.unit}`, icon: 'success' });
                }
              }
            }
          });
        }
      }
    });
  };

  const getProductEmoji = (name: string) => {
    const map: Record<string, string> = {
      '苹果': '🍎', '香蕉': '🍌', '橙子': '🍊', '西瓜': '🍉', '葡萄': '🍇',
      '草莓': '🍓', '桃子': '🍑', '梨': '🍐', '菠萝': '🍍', '芒果': '🥭',
      '蔬菜': '🥬', '白菜': '🥬', '土豆': '🥔', '番茄': '🍅', '黄瓜': '🥒',
      '辣椒': '🌶️', '鸡蛋': '🥚', '肉': '🥩', '鱼': '🐟', '面包': '🍞'
    };
    for (const key in map) {
      if (name.includes(key)) return map[key];
    }
    return '📦';
  };

  const getStockLevelLabel = (level: StockLevel) => {
    if (level === 'critical') return { text: '🚨 紧急', color: '#EF4444' };
    if (level === 'warning') return { text: '⚠️ 预警', color: '#F59E0B' };
    return { text: '✅ 正常', color: '#22C55E' };
  };

  const renderProductCard = (p: Product) => {
    const level = getStockLevel(p);
    const progress = Math.min(100, (p.stock / (p.minStock * 2)) * 100);
    const days = getDaysUntilOut(p);
    const daysText = days >= 999 ? '暂无销售记录' : `预计 ${days} 天后缺货`;
    const handleProductClick = () => {
      Taro.navigateTo({ url: `/pages/product-detail/index?id=${p.id}` });
    };
    const levelInfo = getStockLevelLabel(level);
    return (
      <View
        key={p.id}
        className={classnames(styles.productCard, level === 'critical' ? styles.critical : '', styles.clickable)}
        onClick={handleProductClick}
      >
        {level !== 'normal' && (
          <View
            className={classnames(styles.alertBadge, level === 'critical' ? styles.critical : styles.warning)}
          >
            {levelInfo.text}
          </View>
        )}

        <View className={styles.productHeader}>
          <View className={styles.productEmoji}>{getProductEmoji(p.name)}</View>
          <View className={styles.productInfo}>
            <Text className={styles.productName}>{p.name}</Text>
            <Text className={styles.productCategory}>
              {p.category} · 成本 {formatMoney(p.costPrice)} · 售价 {formatMoney(p.salePrice)}
            </Text>
          </View>
        </View>

        <View className={styles.stockProgress}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>库存水位</Text>
            <Text className={classnames(styles.progressValue, level === 'critical' ? styles.critical : level === 'warning' ? styles.warning : styles.normal)}>
              {p.stock}{p.unit} / 最低 {p.minStock}{p.unit}
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classnames(
                styles.progressFill,
                level === 'critical' ? styles.critical : level === 'warning' ? styles.warning : styles.normal
              )}
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <View className={styles.stockDetails}>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>当前库存</Text>
            <Text className={styles.detailValue}>{p.stock}{p.unit}</Text>
          </View>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>最低库存</Text>
            <Text className={styles.detailValue}>{p.minStock}{p.unit}</Text>
          </View>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>建议补货</Text>
            <Text className={styles.detailValue}>{getRestockAmount(p)}{p.unit}</Text>
          </View>
          <View className={styles.detailItem}>
            <Text className={styles.detailLabel}>库存价值</Text>
            <Text className={styles.detailValue}>¥{(p.stock * p.costPrice).toFixed(0)}</Text>
          </View>
        </View>

        {days <= 3 && level !== 'normal' && (
          <View className={styles.daysAlert}>
            <Text className={styles.alertIcon}>⏰</Text>
            <Text className={styles.alertText}>{daysText}，建议尽快补货</Text>
          </View>
        )}

        <View className={styles.actionRow}>
          <View
            className={classnames(styles.actionBtn, styles.btnAdjust)}
            onClick={(e) => { e.stopPropagation(); handleAdjustStock(p); }}
          >
            🔧 调整库存
          </View>
          <View
            className={classnames(styles.actionBtn, styles.btnRestock)}
            onClick={(e) => { e.stopPropagation(); handleQuickRestock(p); }}
          >
            📦 立即补货
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.summaryHeader}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryTitle}>📦 库存总览</Text>
          <View className={styles.summaryCount}>{lowStockProducts.length}/{products.length}种</View>
        </View>
        <View className={styles.summaryMain}>
          <Text className={styles.summaryLabel}>库存占用资金</Text>
          <Text className={styles.summaryValue}>¥{totalStockValue.toFixed(0)}</Text>
        </View>
        <View className={styles.summaryStats}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>紧急补货</Text>
            <Text className={styles.statValue}>{criticalCount}种</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>库存预警</Text>
            <Text className={styles.statValue}>{warningCount}种</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>库存正常</Text>
            <Text className={styles.statValue}>{normalCount}种</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {[
          { key: 'all', label: '全部预警' },
          { key: 'critical', label: '紧急补货' },
          { key: 'warning', label: '库存预警' },
          { key: 'normal', label: '全部商品' },
        ].map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.filterTab, filter === tab.key ? styles.active : '')}
            onClick={() => setFilter(tab.key as FilterType)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      {highlightedProducts.length === 0 && normalFilteredProducts.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>库存状态良好</Text>
          <Text className={styles.emptyDesc}>暂无需要补货的商品</Text>
        </View>
      ) : (
        <>
          {highlightedProducts.length > 0 && (
            <View className={styles.highlightedSection}>
              <Text className={styles.highlightedTitle}>✨ 刚刚补货</Text>
              {highlightedProducts.map(p => renderProductCard(p))}
            </View>
          )}
          {normalFilteredProducts.map(p => renderProductCard(p))}
        </>
      )}

      {restockHistory.length > 0 && (
        <View className={styles.restockHistory}>
          <Text className={styles.historyTitle}>
            <Text className={styles.historyIcon}>📋</Text>
            最近补货记录
          </Text>
          {restockHistory.map(h => (
            <View
              key={h.id}
              className={classnames(styles.historyItem, styles.clickable)}
              onClick={() => Taro.navigateTo({ url: `/pages/product-detail/index?id=${h.productId}` })}
            >
              <View className={styles.historyLeft}>
                <View className={styles.historyDot} />
                <View className={styles.historyInfo}>
                  <Text className={styles.historyProduct}>{h.productName}</Text>
                  <Text className={styles.historyDate}>{formatDate(h.date, 'MM月DD日')}</Text>
                </View>
              </View>
              <Text className={styles.historyAmount}>+{h.amount}{h.unit}</Text>
            </View>
          ))}
        </View>
      )}

      {restockResult && (
        <View className={styles.restockModal}>
          <View className={styles.restockModalMask} onClick={handleCloseRestockModal} />
          <View className={styles.restockModalCard}>
            <Text className={styles.restockModalTitle}>📦 补货成功</Text>

            <View className={styles.productHeader}>
              <View className={styles.productEmoji}>{restockResult.emoji}</View>
              <View className={styles.productInfo}>
                <Text className={styles.productName}>{restockResult.productName}</Text>
              </View>
            </View>

            <View className={classnames(styles.restockStockLevel)}>
              <View className={styles.stockLevelItem}>
                <Text className={styles.stockLevelLabel}>补货前</Text>
                <Text className={styles.stockLevelValue}>{restockResult.stockBefore}{restockResult.unit}</Text>
                <Text className={styles.stockLevelSub}>最低线的 {restockResult.stockRatioBefore.toFixed(1)} 倍</Text>
              </View>
              <View className={styles.stockLevelArrow}>→</View>
              <View className={styles.stockLevelItem}>
                <Text className={styles.stockLevelLabel}>补货后</Text>
                <Text className={classnames(styles.stockLevelValue, styles.stockLevelAfter)}>{restockResult.stockAfter}{restockResult.unit}</Text>
                <Text className={styles.stockLevelSub}>最低线的 {restockResult.stockRatioAfter.toFixed(1)} 倍</Text>
              </View>
            </View>

            <View className={styles.restockModalRow}>
              <Text className={styles.restockModalLabel}>最低库存线</Text>
              <Text className={styles.restockModalValue}>{restockResult.minStock}{restockResult.unit}</Text>
            </View>

            <View className={styles.restockModalRow}>
              <Text className={styles.restockModalLabel}>补货数量</Text>
              <Text className={styles.restockModalValue}>+{restockResult.restockQty}{restockResult.unit}</Text>
            </View>

            <View className={styles.restockModalRow}>
              <Text className={styles.restockModalLabel}>库存预警状态</Text>
              <View className={styles.restockModalCompare}>
                <Text style={{ color: getStockLevelLabel(restockResult.levelBefore).color }}>
                  {getStockLevelLabel(restockResult.levelBefore).text}
                </Text>
                <Text style={{ margin: '0 8rpx' }}>→</Text>
                <Text style={{ color: getStockLevelLabel(restockResult.levelAfter).color }}>
                  {getStockLevelLabel(restockResult.levelAfter).text}
                </Text>
              </View>
            </View>

            <View className={classnames(styles.restockRecordInfo)}>
              <Text className={styles.restockRecordTitle}>📋 进货记录详情</Text>
              <View className={styles.restockRecordTime}>
                <Text className={styles.recordTimeIcon}>🕐</Text>
                <Text className={styles.recordTimeText}>{restockResult.restockTime}</Text>
              </View>
              <View className={styles.restockRecordRow}>
                <Text className={styles.restockRecordLabel}>记录类型</Text>
                <Text className={styles.restockRecordValue}>{restockResult.recordType}</Text>
              </View>
              <View className={styles.restockRecordRow}>
                <Text className={styles.restockRecordLabel}>补货数量</Text>
                <Text className={styles.restockRecordValue}>+{restockResult.restockQty}{restockResult.unit}</Text>
              </View>
              <View className={styles.restockRecordRow}>
                <Text className={styles.restockRecordLabel}>进货单价</Text>
                <Text className={styles.restockRecordValue}>¥{restockResult.unitPrice.toFixed(2)}</Text>
              </View>
              <View className={styles.restockRecordRow}>
                <Text className={styles.restockRecordLabel}>总金额</Text>
                <Text className={classnames(styles.restockRecordValue, styles.recordTotalAmount)}>¥{restockResult.totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            <View className={classnames(styles.restockStatusTip, restockResult.levelAfter === 'normal' ? styles.statusNormal : restockResult.levelAfter === 'warning' ? styles.statusWarning : styles.statusCritical)}>
              <Text className={styles.statusTipIcon}>
                {restockResult.levelAfter === 'normal' ? '✅' : restockResult.levelAfter === 'warning' ? '⚠️' : '🚨'}
              </Text>
              <Text className={styles.statusTipText}>
                当前库存是最低线的 {restockResult.stockRatioAfter.toFixed(1)} 倍，
                {restockResult.levelAfter === 'normal' ? '已恢复安全水位' : restockResult.levelAfter === 'warning' ? '仍在预警水位，请关注' : '仍处于紧急状态，建议继续补货'}
              </Text>
            </View>

            <View className={styles.restockModalBtns}>
              <View
                className={classnames(styles.restockModalBtn)}
                onClick={handleViewProductDetail}
              >
                查看详情
              </View>
              <View
                className={classnames(styles.restockModalBtn, styles.restockModalBtnPrimary)}
                onClick={handleCloseRestockModal}
              >
                我知道了
              </View>
            </View>
          </View>
        </View>
      )}

      <View className={styles.bottomSpacing} />
    </ScrollView>
  );
};

export default InventoryPage;
