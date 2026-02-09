
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryItem {
  id: string;
  type: 'daily-check' | 'pre-tour' | 'post-tour' | 'float' | 'expense' | 'inspection';
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'warning';
}

export default function HistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'daily-check' | 'pre-tour' | 'post-tour' | 'float' | 'inspection'>('all');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchData } = useFetch();
  const { user } = useAuth();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetchData({
        endPoint: '/get-inspection-items',
        method: 'GET',
      });
      if (response && Array.isArray(response)) {
        const mappedData = response.map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          type: 'inspection' as const,
          title: item.item || 'Inspection Item',
          description: item.description || '',
          date: 'N/A',
          time: 'N/A',
          status: 'completed' as const,
        }));
        setHistoryData(mappedData);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = filter === 'all'
    ? historyData
    : historyData.filter(item => item.type === filter || (filter === 'float' && item.type === 'expense'));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily-check':
        return 'checkmark.circle.fill';
      case 'pre-tour':
        return 'gauge.with.dots.needle.bottom.50percent';
      case 'post-tour':
        return 'flag.checkered';
      case 'expense':
        return 'dollarsign.circle.fill';
      case 'inspection':
        return 'magnifyingglass.circle.fill';
      default:
        return 'clock.fill';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily-check':
        return colors.primary;
      case 'pre-tour':
        return colors.secondary;
      case 'post-tour':
        return colors.accent;
      case 'expense':
        return '#9c27b0';
      case 'inspection':
        return '#ff9800';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.secondary;
      case 'warning':
        return colors.warning;
      case 'pending':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'daily-check', label: 'Daily Check' },
    { id: 'pre-tour', label: 'Pre-Tour' },
    { id: 'post-tour', label: 'Post-Tour' },
    { id: 'float', label: 'Float' },
    { id: 'inspection', label: 'Inspection' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Activity History',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterButton,
                filter === f.id && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(f.id as any)}
            >
              <Text style={[
                styles.filterButtonText,
                filter === f.id && styles.filterButtonTextActive,
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No activity found</Text>
          </View>
        ) : (
          filteredHistory.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View style={[styles.historyIcon, { backgroundColor: getTypeColor(item.type) }]}>
                <IconSymbol
                  name={getTypeIcon(item.type) as any}
                  size={24}
                  color={colors.card}
                />
              </View>
              <View style={styles.historyContent}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusBadgeText}>
                      {item.status === 'completed' ? '✓' : item.status === 'warning' ? '!' : '•'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyDescription}>{item.description}</Text>
                <View style={styles.historyFooter}>
                  <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <IconSymbol name="clock" size={14} color={colors.textSecondary} style={styles.clockIcon} />
                  <Text style={styles.historyTime}>{item.time}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  historyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.card,
  },
  historyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  clockIcon: {
    marginLeft: 12,
  },
  historyTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
