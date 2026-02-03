
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
  
  const { user } = useAuth();
  const { fetchData } = useFetch();

  const [activeTab, setActiveTab] = useState<TabType>('add');
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    receiptImage: null as string | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, isloading] = useState(false);
  const [viewReceiptImage, setViewReceiptImage] = useState<string | null>(null);
  const [expenses,setExpenses] = useState<ExpenseType[]>([])
  const {assignedTask} = useAuth();
  const originalBalance = assignedTask?.float?.originalAmount || 0;
  const [remainingAmount, setRemainingAmount] = useState(assignedTask?.float?.remainingAmount || 0);
  const floatId = assignedTask?.float?.id

  const categories = ['Fuel', 'Toll', 'Parking', 'Maintenance', 'Other'];

  const totalExpenses = originalBalance - remainingAmount;

  const fetchExpenses = async () => {
    isloading(true);
    try {
      const response = await fetchData({ endPoint: '/expenses', method: 'GET' });
      if (response && response.status === 1) {
        const mappedExpenses: ExpenseType[] = response.data.map((expense: any) => ({
          id: expense.id,
          category: expense.category,
          description: expense.description || expense.category,
          date: expense.createdAt,
          receiptImage: expense.receiptUrl,
          amount: expense.amount / 100, // Convert cents to rands
        }));
        setExpenses(mappedExpenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      isloading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchExpenses();
    }
  }, [activeTab]);


  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos of receipts.',
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
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                setNewExpense({ ...newExpense, receiptImage: result.assets[0].base64 || null });
              }
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                setNewExpense({ ...newExpense, receiptImage: result.assets[0].base64 || null });
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
    if (!newExpense.category || !newExpense.amount || !newExpense.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > (remainingAmount || 0)) {
      Alert.alert(
        'Insufficient Balance',
        `This expense (R${amount.toFixed(2)}) exceeds your remaining balance (R${remainingAmount.toFixed(2)}).`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            onPress: () => submitExpense(amount),
          },
        ]
      );
    } else {
      await submitExpense(amount);
    }
  };

  const submitExpense = async (amount: number) => {
    setSubmitting(true);

    try {
      //const tourId =  user?.driver?.currentTour || user?.driver?.tour;
      const currentTourId = assignedTask?.tour?.id || null;
      if (!currentTourId) {
        Alert.alert('Error', 'Tour ID not found. Please log in again.');
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
        amountCents: Math.round(amount * 100),
        date,
        receiptUrl: newExpense.receiptImage
          ? `data:image/jpeg;base64,${newExpense.receiptImage}`
          : null,
        tourId: currentTourId,
        floatId: floatId || null,
        description: newExpense.description,
      }
      console.log('Submitting expense:', body);
      const response = await fetchData({ endPoint: '/expenses', method: 'POST', data: body });
      console.log(response);
      if (!response) {
        Alert.alert('Error', 'Failed to add expense. Please try again.');
        return;
      }
      if (response.status === 1) {
        // Update remaining amount locally
        setRemainingAmount(prev => prev - Math.round(amount * 100));
        setNewExpense({ category: '', amount: '', description: '', receiptImage: null });
        Alert.alert('Success', 'Expense added successfully');
        setActiveTab('history');
      } else {
        Alert.alert('Error', 'Failed to add expense. Please try again.');
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

      {remainingAmount< 100 && remainingAmount > 0 && (
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
              <Text style={styles.expenseAmount}>-R{expense.amount.toFixed(2)}</Text>
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
        }}
      />

      {/* Balance Dashboard */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Float Balance</Text>
          <Text style={styles.balanceAmount}>R{originalBalance?.toFixed(2)}</Text>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Total Expenses</Text>
            <Text style={[styles.balanceItemValue, { color: colors.error }]}>
              -R{totalExpenses.toFixed(2)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Remaining</Text>
            <Text style={[
              styles.balanceItemValue,
              { color: (remainingAmount || 0) < 0 ? colors.error : colors.secondary }
            ]}>
              R{remainingAmount?.toFixed(2)}
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
                source={{ uri: `data:image/jpeg;base64,${viewReceiptImage}` }}
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
