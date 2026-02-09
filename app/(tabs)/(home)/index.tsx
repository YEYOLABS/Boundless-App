
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getCurrentCheckType,
  hasCompletedCheckToday,
  CheckType
} from '@/services/notificationService';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/contexts/ExpenseContext';
import useFetch from '@/hooks/useFetch';

// Helper to get icon based on category
const getCategoryIcon = (category: string) => {
  switch (category?.toUpperCase()) {
    case 'FUEL': return 'fuelpump.fill';
    case 'TOLL': return 'road.lanes'; // mapped to specific icon if available or fallback
    case 'MAINTENANCE': return 'wrench.and.screwdriver';
    case 'FOOD': return 'fork.knife';
    case 'ACCOMMODATION': return 'bed.double.fill';
    default: return 'dollarsign.circle.fill';
  }
};

export default function DashboardScreen() {
  const router = useRouter();
  const { logout, user, assignedTask, setAssignedTask } = useAuth();
  const { fetchData } = useFetch();
  const { expenses, floatBalance, getRemainingBalance, refreshExpenses } = useExpenses();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tours, setTours] = useState<any[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [checkStatus, setCheckStatus] = useState<CheckType | null>(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);

  useEffect(() => {
    console.log('[Dashboard] Component mounted');
    loadAssignedTask();
    loadDailyCheckStatus();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const driverResponse = await api.getDriver();
      if (driverResponse.success) {
        //setDriverInfo(driverResponse.data);
      } else {
        setApiError(driverResponse.error || 'Failed to load driver info');
      }

      const vehicleResponse = await api.getVehicle();
      if (vehicleResponse.success) {
        // setVehicleInfo(vehicleResponse.data);
      } else {
        console.error('[Dashboard] Failed to load vehicle info:', vehicleResponse.error);
      }

      const toursResponse = await api.getTours();
      if (toursResponse.success) {
        setTours(toursResponse.data || []);
      } else {
        console.error('[Dashboard] Failed to load tours:', toursResponse.error);
      }
    } catch (error: any) {
      setApiError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyCheckStatus = async () => {
    try {
      const currentType = await getCurrentCheckType();
      const completed = await hasCompletedCheckToday(currentType);
      setCheckStatus(currentType);
      setHasCompletedToday(completed);
    } catch (error) {
      console.error('[Dashboard] Error loading check statsus:', error);
    }
  };

  const loadAssignedTask = async () => {
    try {
      const response = await fetchData({ endPoint: '/get-assigned-task', method: 'POST' });
      if (response) {
        setAssignedTask(response.data);
        console.log('[Dashboard] Assigned task:', response.data);
      } else {
        console.error('[Dashboard] Failed to fetch assigned task');
      }
    } catch (error) {
      console.error('[Dashboard] Error loading assigned task:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    //await loadDashboardData();
    await loadDailyCheckStatus();
    //await refreshExpenses();
    setRefreshing(false);
  };


  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          }
        },
      ]
    );
  };

  const toggleOfflineMode = () => {
    setOfflineMode(!offlineMode);
    Alert.alert(
      offlineMode ? 'Online Mode' : 'Offline Mode',
      offlineMode ? 'Connected to server' : 'Working offline with cached data'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'warning':
      case 'overdue':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getCategoryIcon = (category: string): any => {
    const iconMap: Record<string, any> = {
      fuel: 'local-gas-station',
      Fuel: 'local-gas-station',
      toll: 'toll',
      Toll: 'toll',
      parking: 'local-parking',
      Parking: 'local-parking',
      meals: 'restaurant',
      maintenance: 'build',
      Maintenance: 'build',
      other: 'receipt',
      Other: 'receipt',
    };
    return iconMap[category] || 'receipt';
  };

  useEffect(() => {

  }, [])
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading dashboard...
          </Text>
          {apiError && (
            <View style={styles.errorContainer}>
              <IconSymbol name="warning" size={24} color="#f44336" style={styles.errorIcon} />
              <Text style={styles.errorText}>{apiError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadDashboardData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={require('@/assets/images/final_quest_240x240.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={toggleOfflineMode}
                style={styles.iconButton}
              >
                <IconSymbol
                  name={offlineMode ? 'cloud-off' : 'cloud'}
                  size={24}
                  color={offlineMode ? '#f44336' : colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.iconButton}
              >
                <IconSymbol name="logout" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome back, {user?.name}!
          </Text>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>

        </View>

        {/* Assigned Task */}
        {/* Assigned Task */}
        {assignedTask && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Assigned Task</Text>
            <View style={styles.card}>
              {assignedTask.vehicle && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {assignedTask.vehicle.model} ({assignedTask.vehicle.licenceNumber})
                  </Text>
                </View>
              )}
              {assignedTask.tour && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tour:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {assignedTask.tour.tour_name || assignedTask.tour.tour_reference}
                  </Text>
                </View>
              )}
              {assignedTask.float && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Float Balance:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    R {(assignedTask.float.remainingAmount || 0).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Daily Check Status */}
        <View style={styles.section}>
          <View style={[styles.statusCard, !hasCompletedToday && styles.statusCardPending]}>
            <View style={styles.statusCardHeader}>
              <IconSymbol
                name={hasCompletedToday ? 'check-circle' : 'error'}
                size={32}
                color={hasCompletedToday ? '#4CAF50' : '#FF9800'}
              />
              <View style={styles.statusCardHeaderText}>
                <Text style={[styles.statusCardTitle, { color: colors.text }]}>
                  {checkStatus === 'morning' ? 'Morning Check' : 'Evening Check'}
                </Text>
                <Text style={[styles.statusCardSubtitle, { color: colors.textSecondary }]}>
                  {hasCompletedToday ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
            {!hasCompletedToday && (
              <TouchableOpacity
                style={[buttonStyles.primary, { marginTop: 12 }]}
                onPress={() => router.push(`/inspections?inspectionType=${checkStatus === 'morning' ? 'PreTour' : 'evening'}`)}
              >
                <Text style={buttonStyles.text}>Complete Check</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>


        {/* Float Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Float Management</Text>
            <TouchableOpacity onPress={() => router.push('/float-management')}>
              <IconSymbol name="arrow-forward" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/float-management')}
            activeOpacity={0.7}
          >
            <View style={styles.floatHeader}>
              <Text style={[styles.floatLabel, { color: colors.textSecondary }]}>Current Balance</Text>
              <Text style={[styles.floatAmount, { color: (assignedTask?.float?.originalAmount || 0) < 100 ? '#f44336' : colors.primary }]}>
                R{(assignedTask?.float?.originalAmount || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.floatSummary}>
              <View style={styles.floatSummaryItem}>
                <Text style={[styles.floatSummaryLabel, { color: colors.textSecondary }]}>
                  Remaining
                </Text>
                <Text style={[styles.floatSummaryValue, {
                  color: (assignedTask?.float?.remainingAmount || 0) < 0 ? '#f44336' : colors.secondary
                }]}>
                  R {(assignedTask?.float?.remainingAmount || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.floatSummaryItem}>
                <Text style={[styles.floatSummaryLabel, { color: colors.textSecondary }]}>
                  Expenses
                </Text>
                <Text style={[styles.floatSummaryValue, { color: colors.text }]}>
                  {expenses.length}
                </Text>
              </View>
            </View>

            {(assignedTask?.float?.remainingAmount || 0) < 100 && (assignedTask?.float?.remainingAmount || 0) > 0 && (
              <View style={styles.warningBanner}>
                <IconSymbol name="warning" size={20} color="#f44336" />
                <Text style={styles.warningText}>Low balance warning!</Text>
              </View>
            )}

            {expenses.length > 0 && (
              <View style={styles.expensesList}>
                <Text style={[styles.expensesTitle, { color: colors.text }]}>Recent Expenses</Text>
                {expenses.slice(0, 3).map((expense) => (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseItemLeft}>
                      <IconSymbol
                        name={getCategoryIcon(expense.category)}
                        size={24}
                        color={colors.primary}
                      />
                      <View style={styles.expenseItemInfo}>
                        <Text style={[styles.expenseCategory, { color: colors.text }]}>
                          {expense.date}
                        </Text>
                        <Text style={[styles.expenseDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                          {expense.description}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.expenseItemRight}>
                      <Text style={[styles.expenseAmount, { color: '#f44336' }]}>
                        -R {expense.amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
                {expenses.length > 3 && (
                  <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                    View all {expenses.length} expenses →
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/inspections?inspectionType=Daily')}
            >
              <IconSymbol name="checklist" size={32} color={colors.primary} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Daily Check</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/inspections?inspectionType=PreTour')}
            >
              <IconSymbol name="departure-board" size={32} color={colors.primary} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Pre-Tour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/inspections?inspectionType=post-tour')}
            >
              <IconSymbol name="assignment-turned-in" size={32} color={colors.primary} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Post-Tour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/inspections?inspectionType=evening')}
            >
              <IconSymbol name="brightness-2" size={32} color={colors.primary} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Evening Tour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/issues')}
            >
              <IconSymbol name="wrench.and.screwdriver" size={32} color={colors.primary} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Vehicle Issues</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
    maxWidth: '90%',
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  headerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  headerErrorText: {
    flex: 1,
    color: '#c62828',
    fontSize: 13,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    marginBottom: 16,
  },
  testApiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  testApiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mockModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  mockModeText: {
    flex: 1,
    color: '#e65100',
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    ...commonStyles.shadow,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    ...commonStyles.shadow,
  },
  statusCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCardHeaderText: {
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusCardSubtitle: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  floatHeader: {
    marginBottom: 16,
  },
  floatLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  floatAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  floatSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 12,
  },
  floatSummaryItem: {
    alignItems: 'center',
  },
  floatSummaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  floatSummaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500',
  },
  expensesList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expensesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  expenseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  expenseItemInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  expenseDescription: {
    fontSize: 12,
  },
  expenseItemRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    ...commonStyles.shadow,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
