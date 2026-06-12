import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { getTodayStr } from '../../utils';
import Tag from '../../components/Tag';

const INCOME_TYPES = [
  { key: 'income', label: '销售', icon: '💰' },
];

const EXPENSE_TYPES = [
  { key: 'purchase', label: '进货', icon: '📦' },
  { key: 'rent', label: '摊位费', icon: '🏪' },
  { key: 'transport', label: '运输费', icon: '🚚' },
  { key: 'loss', label: '损耗', icon: '📉' },
  { key: 'expense', label: '其他', icon: '💸' },
];

const METHODS = [
  { key: 'cash', label: '现金', icon: '💵' },
  { key: 'scan', label: '扫码', icon: '📱' },
  { key: 'credit', label: '赊账', icon: '📒' },
  { key: 'transfer', label: '转账', icon: '💳' },
];

const EntryPage: React.FC = () => {
  const router = useRouter();
  const { addTransaction, products, customers, addCreditRecord } = useStore();

  const [mainType, setMainType] = useState<'income' | 'expense'>('income');
  const [subType, setSubType] = useState('income');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('scan');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    const type = router.params?.type;
    if (type) {
      if (type === 'income') {
        setMainType('income');
        setSubType('income');
      } else {
        setMainType('expense');
        setSubType(type);
      }
    }
    console.log('[Entry] init with type:', type);
  }, []);

  const subTypes = mainType === 'income' ? INCOME_TYPES : EXPENSE_TYPES;

  const showProduct = subType === 'income' || subType === 'purchase' || subType === 'loss';
  const showCustomer = mainType === 'income' && method === 'credit';
  const showQuantity = showProduct;

  const calcFromQuantity = () => {
    if (selectedProduct && showQuantity && quantity > 0) {
      const price = mainType === 'income' ? selectedProduct.salePrice : selectedProduct.costPrice;
      return (price * quantity).toFixed(2);
    }
    return '';
  };

  useEffect(() => {
    const calc = calcFromQuantity();
    if (calc && !amount) {
      setAmount(calc);
    }
  }, [selectedProduct, quantity]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    addTransaction({
      type: subType as any,
      amount: numAmount,
      method: method as any,
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      quantity: showQuantity ? quantity : undefined,
      unitPrice: selectedProduct ? (mainType === 'income' ? selectedProduct.salePrice : selectedProduct.costPrice) : undefined,
      customerId: showCustomer ? selectedCustomer?.id : undefined,
      customerName: showCustomer ? selectedCustomer?.name : undefined,
      note,
      date: getTodayStr(),
    });

    if (showCustomer && selectedCustomer && subType === 'income') {
      addCreditRecord({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        type: 'borrow',
        amount: numAmount,
        date: getTodayStr(),
        note: note || '销售赊账',
      });
    }

    console.log('[Entry] submit:', { subType, amount: numAmount, method });
    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 800);
  };

  const handlePickProduct = () => {
    Taro.showActionSheet({
      itemList: products.map(p => p.name),
      success: (res) => {
        setSelectedProduct(products[res.tapIndex]);
        const p = products[res.tapIndex];
        const price = mainType === 'income' ? p.salePrice : p.costPrice;
        setAmount((price * quantity).toFixed(2));
      }
    });
  };

  const handlePickCustomer = () => {
    Taro.showActionSheet({
      itemList: customers.map(c => `${c.name} (${c.phone || '无电话'})`),
      success: (res) => {
        setSelectedCustomer(customers[res.tapIndex]);
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.typeTabs}>
        <View
          className={classnames(styles.typeTab, mainType === 'income' && styles.active)}
          onClick={() => { setMainType('income'); setSubType('income'); }}
        >
          💰 收入
        </View>
        <View
          className={classnames(styles.typeTab, mainType === 'expense' && styles.active)}
          onClick={() => { setMainType('expense'); setSubType('purchase'); }}
        >
          💸 支出
        </View>
      </View>

      <View className={styles.subTypeGrid}>
        {subTypes.map(t => (
          <View
            key={t.key}
            className={classnames(styles.subTypeItem, subType === t.key && styles.active)}
            onClick={() => setSubType(t.key)}
          >
            <Text className={styles.subTypeIcon}>{t.icon}</Text>
            <Text className={styles.subTypeLabel}>{t.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.amountSection}>
        <Text className={styles.amountLabel}>金额</Text>
        <View className={styles.amountInputRow}>
          <Text className={styles.amountSymbol}>¥</Text>
          <Input
            className={styles.amountInput}
            type="digit"
            placeholder="0.00"
            value={amount}
            onInput={(e) => setAmount(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.formSection}>
        {showProduct && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>关联商品</Text>
            {selectedProduct ? (
              <View className={styles.productPickerRow} style={{ flex: 1 }} onClick={handlePickProduct}>
                <View className={styles.productPickerIcon}>📦</View>
                <View className={styles.productPickerInfo}>
                  <Text className={styles.productPickerName}>{selectedProduct.name}</Text>
                  <Text className={styles.productPickerPrice}>
                    {mainType === 'income' ? '售价' : '成本'} ¥{mainType === 'income' ? selectedProduct.salePrice : selectedProduct.costPrice}/{selectedProduct.unit}
                  </Text>
                </View>
                <Text className={styles.productPickerArrow}>›</Text>
              </View>
            ) : (
              <Text className={styles.formValue} style={{ color: '#86909C' }} onClick={handlePickProduct}>
                选择商品 ›
              </Text>
            )}
          </View>
        )}

        {showQuantity && selectedProduct && (
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>数量</Text>
            <View className={styles.quantityRow}>
              <View className={styles.quantityBtn} onClick={() => setQuantity(Math.max(0.1, quantity - 1))}>−</View>
              <Input
                className={styles.quantityValue}
                type="digit"
                value={String(quantity)}
                onInput={(e) => setQuantity(parseFloat(e.detail.value) || 0)}
              />
              <View className={styles.quantityBtn} onClick={() => setQuantity(quantity + 1)}>+</View>
              <Text style={{ fontSize: 24, color: '#86909C', marginLeft: 8 }}>{selectedProduct.unit}</Text>
            </View>
          </View>
        )}

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>日期</Text>
          <Text className={styles.formValue}>{getTodayStr()}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 28, fontWeight: 600, color: '#1D2129', marginBottom: 16, marginTop: 8 }}>收款方式</Text>
      <View className={styles.methodTabs}>
        {METHODS.map(m => (
          <View
            key={m.key}
            className={classnames(styles.methodTab, method === m.key && styles.active)}
            onClick={() => setMethod(m.key)}
          >
            <Text className={styles.methodIcon}>{m.icon}</Text>
            <Text className={styles.methodLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {showCustomer && (
        <View className={styles.formSection}>
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>赊账客户</Text>
            {selectedCustomer ? (
              <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={handlePickCustomer}>
                <Tag text={selectedCustomer.name} color="warning" />
                <Text style={{ fontSize: 24, color: '#86909C', marginLeft: 8 }}>›</Text>
              </View>
            ) : (
              <Text className={styles.formValue} style={{ color: '#FF7D00' }} onClick={handlePickCustomer}>
                选择客户 ›
              </Text>
            )}
          </View>
        </View>
      )}

      <View className={styles.formSection}>
        <View style={{ display: 'flex', marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: 500, color: '#4E5969' }}>📝 备注说明</Text>
        </View>
        <Input
          className={styles.noteInput}
          placeholder="添加备注，方便核对..."
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />
      </View>

      <View style={{ height: 80 }} />

      <View className={styles.submitBtn} onClick={handleSubmit}>
        <Text className={styles.submitBtnText}>确认记录</Text>
      </View>
    </ScrollView>
  );
};

export default EntryPage;
