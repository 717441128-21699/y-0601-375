import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useStore } from '../../store/useStore';
import { getTodayStr, formatDate, getDaysInMonth, getFirstDayOfMonth } from '../../utils';
import dayjs from 'dayjs';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const WEATHERS = ['sunny', 'cloudy', 'rainy', 'snowy'];
const WEATHER_ICONS: Record<string, string> = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', snowy: '❄️' };
const FLOWS = ['low', 'medium', 'high'];
const FLOW_ICONS: Record<string, string> = { low: '🐢', medium: '👥', high: '🔥' };

const CalendarPage: React.FC = () => {
  const { calendarEvents, addCalendarEvent } = useStore();
  const today = getTodayStr();

  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMarketDay, setIsMarketDay] = useState(false);
  const [weather, setWeather] = useState<string>('sunny');
  const [flowLevel, setFlowLevel] = useState<string>('medium');
  const [note, setNote] = useState('');

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays = useMemo(() => {
    const result: (string | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push(dateStr);
    }
    return result;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfMonth]);

  const eventsMap = useMemo(() => {
    const map: Record<string, any> = {};
    calendarEvents.forEach(e => { map[e.date] = e; });
    return map;
  }, [calendarEvents]);

  useEffect(() => {
    const ev = eventsMap[selectedDate];
    if (ev) {
      setIsMarketDay(ev.isMarketDay);
      setWeather(ev.weather || 'sunny');
      setFlowLevel(ev.flowLevel || 'medium');
      setNote(ev.note || '');
    } else {
      setIsMarketDay(false);
      setWeather('sunny');
      setFlowLevel('medium');
      setNote('');
    }
  }, [selectedDate]);

  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthEvents = calendarEvents.filter(e => e.date.startsWith(prefix));
    const marketDays = monthEvents.filter(e => e.isMarketDay).length;
    const highFlowDays = monthEvents.filter(e => e.flowLevel === 'high').length;
    const rainyDays = monthEvents.filter(e => e.weather === 'rainy').length;
    return { marketDays, highFlowDays, rainyDays };
  }, [calendarEvents, currentYear, currentMonth]);

  const handleSave = () => {
    addCalendarEvent({
      date: selectedDate,
      isMarketDay,
      weather: weather as any,
      flowLevel: flowLevel as any,
      note,
    });
    console.log('[Calendar] save:', selectedDate, { isMarketDay, weather, flowLevel, note });
    Taro.showToast({ title: '已保存', icon: 'success' });
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <ScrollView scrollY className={styles.pageContainer} style={{ height: '100vh' }}>
      <View className={styles.monthHeader}>
        <View className={styles.monthNavBtn} onClick={prevMonth}>‹</View>
        <Text className={styles.monthTitle}>{currentYear}年{currentMonth + 1}月</Text>
        <View className={styles.monthNavBtn} onClick={nextMonth}>›</View>
      </View>

      <View className={styles.marketDaysSummary}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>🏪 赶集日</Text>
          <Text className={styles.summaryValue}>{monthStats.marketDays}天</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>🔥 客流多</Text>
          <Text className={styles.summaryValue}>{monthStats.highFlowDays}天</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>🌧️ 雨天</Text>
          <Text className={styles.summaryValue}>{monthStats.rainyDays}天</Text>
        </View>
      </View>

      <View className={styles.calendarGrid}>
        <View className={styles.weekRow}>
          {WEEK_DAYS.map(w => (
            <Text key={w} className={styles.weekDay}>{w}</Text>
          ))}
        </View>
        <View className={styles.dayGrid}>
          {calendarDays.map((dateStr, i) => {
            if (!dateStr) return <View key={i} className={classnames(styles.dayCell, styles.empty)} />;
            const day = parseInt(dateStr.split('-')[2]);
            const ev = eventsMap[dateStr];
            const isToday = dateStr === today;
            return (
              <View
                key={i}
                className={classnames(
                  styles.dayCell,
                  isToday && styles.today,
                  ev?.isMarketDay && !isToday && styles.marketDay,
                  selectedDate === dateStr && styles.selected,
                  ev?.note && styles.hasNote
                )}
                onClick={() => setSelectedDate(dateStr)}
              >
                <Text className={styles.dayNum}>{day}</Text>
                {ev && (
                  <>
                    <Text className={styles.dayWeather}>{WEATHER_ICONS[ev.weather || 'sunny']}</Text>
                    {ev.isMarketDay && <Text className={styles.dayFlow}>{FLOW_ICONS[ev.flowLevel || 'medium']}</Text>}
                  </>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.legendSection}>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: 'linear-gradient(135deg, #FF7A45, #FFA37A)' }} />
          <Text className={styles.legendText}>今天</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: 'rgba(255,122,69,0.15)', border: '2rpx solid #FF7A45' }} />
          <Text className={styles.legendText}>赶集日</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#FFF', border: '1rpx solid #EDEDED' }} />
          <Text className={styles.legendText}>普通日</Text>
        </View>
      </View>

      <View className={styles.selectedSection}>
        <Text className={styles.selectedDateTitle}>
          📅 {formatDate(selectedDate, 'YYYY年MM月DD日 dddd')}
          {selectedDate === today && <View className={styles.selectedDateBadge}>今天</View>}
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>🏪 赶集日</Text>
          <View className={styles.formValue}>
            <View
              className={classnames(styles.optionTag, !isMarketDay && styles.active)}
              onClick={() => setIsMarketDay(false)}
            >否</View>
            <View
              className={classnames(styles.optionTag, isMarketDay && styles.active)}
              onClick={() => setIsMarketDay(true)}
            >是</View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>🌤️ 天气</Text>
          <View className={styles.formValue}>
            {WEATHERS.map(w => (
              <View
                key={w}
                className={classnames(styles.optionTag, weather === w && styles.active)}
                onClick={() => setWeather(w)}
              >
                {WEATHER_ICONS[w]}
              </View>
            ))}
          </View>
        </View>

        {isMarketDay && (
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>👥 客流量</Text>
            <View className={styles.formValue}>
              {FLOWS.map(f => (
                <View
                  key={f}
                  className={classnames(styles.optionTag, flowLevel === f && styles.active)}
                  onClick={() => setFlowLevel(f)}
                >
                  {FLOW_ICONS[f]} {f === 'low' ? '少' : f === 'medium' ? '中' : '多'}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ display: 'flex', marginBottom: 8, marginTop: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: 500, color: '#4E5969' }}>📝 备注</Text>
        </View>
        <Input
          className={styles.noteInput}
          placeholder="记录当天经营心得..."
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />

        <View className={styles.saveBtn} onClick={handleSave}>保存记录</View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default CalendarPage;
