
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useAuth } from '@/contexts/AuthContext';
import useFetch from '@/hooks/useFetch';
import api from '@/services/api';

type TabType = 'add' | 'history';

type ExpenseType = {
  id: string;
  category: string;
  description: string;
  date: string;
  receiptImage?: string;
  amount: number;
};

export default function FloatManagementScreen() {
  const router = useRouter();
  
  const { user, assignedTask, setAssignedTask } = useAuth();
  const { fetchData } = useFetch();

  const [activeTab, setActiveTab] = useState<TabType>('add');
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    receiptImage: null as string | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshingTask, setRefreshingTask] = useState(false);
  const [loading, isloading] = useState(false);
  const [viewReceiptImage, setViewReceiptImage] = useState<string | null>(null);
  const [expenses,setExpenses] = useState<ExpenseType[]>([])
  
  // Store values in cents (as stored in database)
  const originalBalance = assignedTask?.float?.originalAmount || 0;
  const [remainingAmount, setRemainingAmount] = useState(assignedTask?.float?.remainingAmount || 0);
  const floatId = assignedTask?.float?.id

  // Debug logging to verify values
  useEffect(() => {
    console.log('[FloatManagement] Database values (in cents):');
    console.log('  - originalAmount:', assignedTask?.float?.originalAmount);
    console.log('  - remainingAmount:', assignedTask?.float?.remainingAmount);
    console.log('[FloatManagement] Display values (in cents):');
    console.log('  - originalBalance:', originalBalance);
    console.log('  - remainingAmount:', remainingAmount);
  }, [assignedTask?.float, originalBalance, remainingAmount]);

  const categories = ['Fuel', 'Toll', 'Parking', 'Maintenance', 'Other'];

  // Calculate total expenses in cents (display in cents)
  const totalExpensesCents = originalBalance - remainingAmount;

  // Debug totalExpenses calculation
  useEffect(() => {
    console.log('[FloatManagement] Calculation check:');
    console.log('  - originalBalance (cents):', originalBalance);
    console.log('  - remainingAmount (cents):', remainingAmount);
    console.log('  - Difference (cents):', totalExpensesCents);
    console.log('  - Display values (in cents):');
    console.log('    - Float Balance:', originalBalance);
    console.log('    - Total Expenses:', totalExpensesCents);
    console.log('    - Remaining:', remainingAmount || 0);
  }, [originalBalance, remainingAmount, totalExpensesCents]);

  const fetchExpenses = async () => {
    isloading(true);
    try {
      console.log('[FloatManagement] Fetching expenses for floatId:', floatId);
      
      if (!floatId) {
        console.warn('[FloatManagement] No floatId available, cannot fetch expenses');
        setExpenses([]);
        isloading(false);
        return;
      }

      const response = await fetchData({ 
        endPoint: `/expenses?floatId=${floatId}`, 
        method: 'GET' 
      });
      
      console.log('[FloatManagement] Expenses response:', response);

      if (response && response.status === 1) {
        const expenseData = Array.isArray(response.data) ? response.data : [];
        const mappedExpenses: ExpenseType[] = expenseData.map((expense: any) => ({
          id: expense.id,
          category: expense.category,
          description: expense.description || expense.category,
          date: expense.createdAt,
          receiptImage: expense.receiptUrl,
          amount: expense.amount, // Keep in cents, convert to rands in display
        }));
        
        console.log('[FloatManagement] Mapped expenses:', mappedExpenses.length);
        setExpenses(mappedExpenses);
      } else {
        console.warn('[FloatManagement] Failed to fetch expenses:', response);
        setExpenses([]);
      }
    } catch (error) {
      console.error('[FloatManagement] Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      isloading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchExpenses();
    }
  }, [activeTab]);

  // Initial load of expenses on mount
  useEffect(() => {
    if (floatId) {
      fetchExpenses();
    }
  }, [floatId]);

  // Update remainingAmount when assignedTask changes (no conversion)
  useEffect(() => {
    if (assignedTask?.float?.remainingAmount !== undefined) {
      setRemainingAmount(assignedTask.float.remainingAmount);
    }
  }, [assignedTask?.float?.remainingAmount]);

  const refreshAssignedTask = async () => {
    setRefreshingTask(true);
    try {
      console.log('[FloatManagement] Refreshing assigned task...');
      const response = await fetchData({ endPoint: '/get-assigned-task', method: 'POST' });
      if (response && response.data) {
        setAssignedTask(response.data);
        console.log('[FloatManagement] Assigned task refreshed:', response.data);
      } else {
        console.warn('[FloatManagement] Failed to refresh assigned task');
      }
    } catch (error) {
      console.error('[FloatManagement] Error refreshing assigned task:', error);
    } finally {
      setRefreshingTask(false);
    }
  };


  const pickImage = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' && mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera or photo library permission is required to add receipt photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Add Receipt Photo',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              if (cameraPermission.status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                console.log('[FloatManagement] Camera image selected, base64 length:', result.assets[0].base64?.length || 0);
                setNewExpense({ ...newExpense, receiptImage: result.assets[0].base64 || null });
              } else {
                console.log('[FloatManagement] Camera selection canceled');
              }
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              if (mediaLibraryPermission.status !== 'granted') {
                Alert.alert('Permission Denied', 'Photo library permission is required to select photos.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                console.log('[FloatManagement] Library image selected, base64 length:', result.assets[0].base64?.length || 0);
                setNewExpense({ ...newExpense, receiptImage: result.assets[0].base64 || null });
              } else {
                console.log('[FloatManagement] Library selection canceled');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to access camera or photo library');
    }
  };

  const removeReceiptImage = () => {
    setNewExpense({ ...newExpense, receiptImage: null });
  };

  const handleAddExpense = async () => {
    console.log('[FloatManagement] handleAddExpense called');
    console.log('[FloatManagement] newExpense:', {
      category: newExpense.category,
      amount: newExpense.amount,
      description: newExpense.description,
      hasReceiptImage: !!newExpense.receiptImage
    });
    console.log('[FloatManagement] assignedTask:', {
      hasTour: !!assignedTask?.tour,
      tourId: assignedTask?.tour?.id,
      hasFloat: !!assignedTask?.float,
      floatId: assignedTask?.float?.id
    });

    if (!newExpense.category || !newExpense.amount || !newExpense.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!newExpense.receiptImage) {
      Alert.alert('Error', 'Please add a receipt photo');
      return;
    }

    const amountValue = parseFloat(newExpense.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Use the value as-is (no conversion needed)
    const amountToSubmit = amountValue;
    
    if (amountToSubmit > (remainingAmount || 0)) {
      Alert.alert(
        'Insufficient Balance',
        `This expense (R${amountValue.toFixed(2)}) exceeds your remaining balance (R${((remainingAmount || 0) / 100).toFixed(2)}).`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            onPress: () => submitExpense(amountToSubmit),
          },
        ]
      );
    } else {
      await submitExpense(amountToSubmit);
    }
  };

  const submitExpense = async (amount: number) => {
    setSubmitting(true);

    try {
      const currentTourId = assignedTask?.tour?.id || null;
      const currentFloatId = assignedTask?.float?.id || floatId;
      
      // Convert amount to cents (amount is already in rands from user input)
      const amountCents = Math.round(amount * 100);
      
      console.log('[FloatManagement] Validation checks:');
      console.log('  - Tour ID:', currentTourId);
      console.log('  - Float ID:', currentFloatId);
      console.log('  - Amount (rands):', amount);
      console.log('  - Amount (cents):', amountCents);
      console.log('  - Has receipt:', !!newExpense.receiptImage);
      
      if (!currentTourId) {
        Alert.alert('Error', 'Tour ID not found. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      if (!currentFloatId) {
        Alert.alert('Error', 'Float ID not found. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      if (!newExpense.receiptImage) {
        Alert.alert('Error', 'Receipt photo is required.');
        setSubmitting(false);
        return;
      }

      const date = new Date().toISOString();

      const body = {
        category: newExpense.category,
        amountCents: amountCents, // Already in cents
        date,
        receiptUrl: `data:image/jpeg;base64,${newExpense.receiptImage}`,
        tourId: currentTourId,
        floatId: currentFloatId,
        description: newExpense.description,
      };

      console.log('[FloatManagement] Submitting expense:', {
        category: body.category,
        amountCents: body.amountCents,
        tourId: body.tourId,
        floatId: body.floatId,
        description: body.description,
        receiptUrl: body.receiptUrl ? `[base64 data: ${body.receiptUrl.substring(0, 50)}...]` : null
      });

      const response = await fetchData({ endPoint: '/expenses', method: 'POST', data: body });
      
      console.log('[FloatManagement] Response received:');
      console.log('  - Response exists:', !!response);
      console.log('  - Response status:', response?.status);
      console.log('  - Response message:', response?.message);
      console.log('  - Full response:', JSON.stringify(response, null, 2));

      if (!response) {
        console.error('[FloatManagement] No response received from server');
        Alert.alert('Error', 'Failed to add expense. No response from server.');
        setSubmitting(false);
        return;
      }

      if (response.status === 1) {
        console.log('[FloatManagement] Expense submitted successfully');
        
        // Update remaining amount locally (subtract in cents)
        setRemainingAmount(prev => {
          const newAmount = prev - amountCents;
          console.log('[FloatManagement] Updating remaining amount (cents):', prev, '-', amountCents, '=', newAmount);
          return newAmount;
        });
        
        // Reset form
        setNewExpense({ category: '', amount: '', description: '', receiptImage: null });
        
        // Refresh expenses list to show the new expense
        console.log('[FloatManagement] Fetching updated expenses...');
        await fetchExpenses();
        
        // Refresh assigned task to get updated float balance from server
        console.log('[FloatManagement] Refreshing assigned task...');
        await refreshAssignedTask();
        
        Alert.alert('Success', 'Expense added successfully', [
          {
            text: 'OK',
            onPress: () => setActiveTab('history')
          }
        ]);
      } else {
        const errorMsg = response.message || response.error || 'Failed to add expense. Please try again.';
        Alert.alert('Error', errorMsg);
      }
    } catch (error: any) {
      console.error('[FloatManagement] Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('[FloatManagement] Deleting expense:', id);
            try {
              //await deleteExpense(id);
              Alert.alert('Success', 'Expense deleted successfully');
              console.log('[FloatManagement] Expense deleted successfully');
            } catch (error: any) {
              console.error('[FloatManagement] Error deleting expense:', error);
              Alert.alert('Error', error.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fuel':
        return 'local-gas-station';
      case 'Toll':
        return 'toll';
      case 'Parking':
        return 'local-parking';
      case 'Maintenance':
        return 'build';
      default:
        return 'receipt';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Float Management',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderAddExpenseTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.inputLabel}>Category *</Text>
      <View style={styles.categoryGrid}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              newExpense.category === cat && styles.categoryButtonSelected,
            ]}
            onPress={() => setNewExpense({ ...newExpense, category: cat })}
          >
            <IconSymbol
              name={getCategoryIcon(cat)}
              size={20}
              color={newExpense.category === cat ? colors.card : colors.primary}
            />
            <Text style={[
              styles.categoryButtonText,
              newExpense.category === cat && styles.categoryButtonTextSelected,
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>Amount (R) *</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={colors.textSecondary}
        value={newExpense.amount}
        onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
        keyboardType="decimal-pad"
      />

      <Text style={styles.inputLabel}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter expense description..."
        placeholderTextColor={colors.textSecondary}
        value={newExpense.description}
        onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={styles.inputLabel}>Receipt Photo *</Text>
      {newExpense.receiptImage ? (
        <View style={styles.receiptImageContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${newExpense.receiptImage}` }}
            style={styles.receiptImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={removeReceiptImage}
          >
            <IconSymbol name="xmark" size={24} color={colors.card} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={pickImage}
        >
          <IconSymbol name="add-a-photo" size={32} color={colors.primary} />
          <Text style={styles.addPhotoText}>Take Photo of Receipt</Text>
        </TouchableOpacity>
      )}

      {remainingAmount < 10000 && remainingAmount > 0 && (
        <View style={styles.warningCard}>
          <IconSymbol name="warning" size={20} color={colors.warning} />
          <Text style={styles.warningText}>
            Low balance warning: Only R{remainingAmount.toFixed(2)} remaining
          </Text>
        </View>
      )}

      {remainingAmount < 0 && (
        <View style={[styles.warningCard, { backgroundColor: '#ffebee' }]}>
          <IconSymbol name="error" size={20} color={colors.error} />
          <Text style={[styles.warningText, { color: colors.error }]}>
            Balance exceeded by R{Math.abs(remainingAmount).toFixed(2)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[buttonStyles.primary, styles.submitButton]}
        onPress={handleAddExpense}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <IconSymbol name="add-circle" size={20} color={colors.card} />
            <Text style={[buttonStyles.text, { marginLeft: 8 }]}>Add Expense</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Expense History</Text>
        <Text style={styles.historyCount}>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</Text>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="receipt" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No expenses recorded yet</Text>
          <Text style={styles.emptyStateSubtext}>Switch to the Add Expenses tab to get started</Text>
        </View>
      ) : (
        expenses.map(expense => (
          <View key={expense.id} style={styles.expenseCard}>
            <View style={styles.expenseIcon}>
              <IconSymbol
                name={getCategoryIcon(expense.category) as any}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.expenseContent}>
              <Text style={styles.expenseDescription}>{expense.description}</Text>
              <Text style={styles.expenseDate}>
                {new Date(expense.date).toLocaleDateString()} {new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {expense.receiptImage && (
                <TouchableOpacity
                  style={styles.receiptBadge}
                  onPress={() => setViewReceiptImage(expense.receiptImage!)}
                >
                  <IconSymbol name="image" size={14} color={colors.primary} />
                  <Text style={styles.receiptBadgeText}>View Receipt</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expenseAmount}>-R{(expense.amount / 100).toFixed(2)}</Text>
              <TouchableOpacity
                onPress={() => handleDeleteExpense(expense.id)}
                style={styles.deleteButton}
              >
                <IconSymbol name="delete" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Float Management',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity 
              onPress={refreshAssignedTask}
              disabled={refreshingTask}
              style={{ marginRight: 10 }}
            >
              {refreshingTask ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <IconSymbol name="refresh" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {/* Balance Dashboard */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Float Balance</Text>
          <Text style={styles.balanceAmount}>R{(originalBalance / 100).toFixed(2)}</Text>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Total Expenses</Text>
            <Text style={[styles.balanceItemValue, { color: colors.error }]}>
              -R{(totalExpensesCents / 100).toFixed(2)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Remaining</Text>
            <Text style={[
              styles.balanceItemValue,
              { color: (remainingAmount || 0) < 0 ? colors.error : colors.secondary }
            ]}>
              {(remainingAmount || 0) < 0 ? '-' : ''}R{(Math.abs(remainingAmount || 0) / 100).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.tabActive]}
          onPress={() => setActiveTab('add')}
        >
          <IconSymbol
            name="add-circle"
            size={20}
            color={activeTab === 'add' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'add' && styles.tabTextActive
          ]}>
            Add Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <IconSymbol
            name="history"
            size={20}
            color={activeTab === 'history' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'history' && styles.tabTextActive
          ]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'add' ? renderAddExpenseTab() : renderHistoryTab()}

      {/* Receipt Viewer Modal */}
      {viewReceiptImage && (
        <View style={styles.receiptModalOverlay}>
          <TouchableOpacity
            style={styles.receiptModalBackground}
            activeOpacity={1}
            onPress={() => setViewReceiptImage(null)}
          >
            <View style={styles.receiptModalContent}>
              <View style={styles.receiptModalHeader}>
                <Text style={styles.receiptModalTitle}>Receipt</Text>
                <TouchableOpacity onPress={() => setViewReceiptImage(null)}>
                  <IconSymbol name="xmark" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Image
                source={{ 
                  uri: viewReceiptImage.startsWith('http') 
                    ? viewReceiptImage 
                    : `data:image/jpeg;base64,${viewReceiptImage}` 
                }}
                style={styles.fullReceiptImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 4px 12px rgba(41, 98, 255, 0.2)',
    elevation: 4,
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.highlight,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.card,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: 12,
    color: colors.highlight,
    marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.highlight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryButtonTextSelected: {
    color: colors.card,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
  },
  addPhotoButton: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  receiptImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  historyCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  expenseCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseContent: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.highlight,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  receiptBadgeText: {
    fontSize: 11,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  receiptModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptModalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  receiptModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  fullReceiptImage: {
    width: '100%',
    height: 400,
  },
});
