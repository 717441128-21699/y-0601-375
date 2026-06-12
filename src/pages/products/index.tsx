import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { formatMoney, calculateProfitRate } from '../../utils';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/SectionHeader';

const ProductsPage: React.FC = () => {
  const { products, addProduct, getLowStockProducts, getHotProducts } = useStore();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const categories = useMemo(() => {
    const cats = ['全部', ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== '全部') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchText.trim()) {
      const kw = searchText.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(kw));
    }
    return list;
  }, [products, activeCategory, searchText]);

  const lowStock = getLowStockProducts();
  const hotProducts = getHotProducts();

  const totalCostValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const totalSaleValue = products.reduce((s, p) => s + p.stock * p.salePrice, 0);
  const potentialProfit = totalSaleValue - totalCostValue;

  const handleAddProduct = () => {
    Taro.showModal({
      title: '新增商品',
      editable: true,
      placeholderText: '请输入商品名称',
      success: (nameRes) => {
        if (nameRes.confirm && nameRes.content) {
          const name = nameRes.content.trim();
          Taro.showModal({
            title: '进货价（元）',
            editable: true,
            placeholderText: '例如：5',
            success: (costRes) => {
              if (costRes.confirm && costRes.content) {
                const costPrice = parseFloat(costRes.content) || 0;
                Taro.showModal({
                  title: '售价（元）',
                  editable: true,
                  placeholderText: '例如：10',
                  success: (saleRes) => {
                    if (saleRes.confirm && saleRes.content) {
                      const salePrice = parseFloat(saleRes.content) || 0;
                      Taro.showModal({
                        title: '初始库存',
                        editable: true,
                        placeholderText: '例如：50',
                        success: (stockRes) => {
                          if (stockRes.confirm) {
                            const stock = parseInt(stockRes.content) || 0;
                            addProduct({
                              name,
                              category: '其他',
                              costPrice,
                              salePrice,
                              stock,
                              minStock: Math.round(stock * 0.2),
                              unit: '个',
                            });
                            Taro.showToast({ title: '商品已添加', icon: 'success' });
                            console.log('[Products] addProduct:', name);
                          }
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
  };

  const handleProductClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/product-detail/index?id=${id}` });
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.summarySection}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryTitle}>📦 库存总览</Text>
          <View className={styles.summaryCount}>{products.length}种商品</View>
        </View>
        <View className={styles.summaryStats}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryItemLabel}>成本价值</Text>
            <View>
              <Text className={styles.summaryItemValue}>¥{totalCostValue.toFixed(0)}</Text>
            </View>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryItemLabel}>潜在营收</Text>
            <View>
              <Text className={styles.summaryItemValue}>¥{totalSaleValue.toFixed(0)}</Text>
            </View>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryItemLabel}>预计利润</Text>
            <View>
              <Text className={styles.summaryItemValue}>¥{potentialProfit.toFixed(0)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.searchSection}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索商品名称..."
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView scrollX className={styles.categoryTabs}>
        {categories.map(cat => (
          <View
            key={cat}
            className={classnames(styles.categoryTab, activeCategory === cat && styles.active)}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
            {cat === '全部' && ''}
          </View>
        ))}
      </ScrollView>

      {lowStock.length > 0 && activeCategory === '全部' && !searchText && (
        <View>
          <SectionHeader title="⚠️ 库存预警" subtitle={`${lowStock.length}种需补货`} />
          {lowStock.map(p => (
            <ProductCard key={p.id} product={p} compact onClick={() => handleProductClick(p.id)} />
          ))}
        </View>
      )}

      <SectionHeader
        title={activeCategory === '全部' ? '全部商品' : `${activeCategory}类`}
        subtitle={`${filteredProducts.length}种`}
      />

      <View className={styles.productList}>
        {filteredProducts.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🛒</Text>
            <Text className={styles.emptyText}>暂无商品，点击右下角添加</Text>
          </View>
        ) : (
          filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p.id)} />
          ))
        )}
      </View>

      <View style={{ height: 80 }} />

      <View className={styles.addBtn} onClick={handleAddProduct}>
        <Text className={styles.addBtnIcon}>＋</Text>
      </View>
    </ScrollView>
  );
};

export default ProductsPage;
