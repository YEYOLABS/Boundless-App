
import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getCurrentCheckType,
  hasCompletedCheckToday,
  markCheckCompleted,
  CheckType,
} from '@/services/notificationService';
import { useInspection } from '@/hooks/useInspection';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import StatusMessage from '@/components/StatusMessage';


function DailyCheckScreen() {
  const router = useRouter();
  const [checkType, setCheckType] = useState<CheckType>('morning');
  const [isLoading, setIsLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [localStatus, setLocalStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { fetchData, status, clearStatus } = useFetch();
  const { user } = useAuth();
  const inspection = useInspection(checkType);

  useEffect(() => {
    initializeCheck();
  }, []);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        clearStatus();
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [status, clearStatus]);


  const initializeCheck = async () => {
    try {
      setIsLoading(true);
      
      // Determine current check type
      const currentType = getCurrentCheckType();
      setCheckType(currentType);

      // Check if already completed today
      const completed = await hasCompletedCheckToday(currentType);
      setAlreadyCompleted(completed);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInspection = async() => {
    try {
      const date = new Date().toISOString();

      // Process items - include all inspection items from full data in original order
      const items = inspection.fullInspectionData
        .map((item: any) => ({
          inspectionItemId: item.id,
          value: item.id === 48 ? inspection.odometerReading : (inspection.checkItems.find(c => c.id === String(item.id))?.value || ''),
          attachment: item.id === 48 ? (inspection.odometerPhoto ? `data:image/jpeg;base64,` : null) : (inspection.checkItems.find(c => c.id === String(item.id))?.photoBase64 ? `data:image/jpeg;base64` : null),
        }));

      const body = {
        inspectionId: 2,
        tourId: null,
        date,
        items,
        attachments: [],
      };
      const response = await api.submitCheck(body);
      console.log(body)
      if (response.success) {
        setLocalStatus({ type: 'success', message: 'Inspection submitted successfully!' });
        await markCheckCompleted(checkType);
        setTimeout(() => router.back(), 2000); // Delay to show message
      } else {
        setLocalStatus({ type: 'error', message: 'Failed to submit check. Please try again.' });
      }
    } catch (error) {
      setLocalStatus({ type: 'error', message: 'An error occurred while saving the inspection.' });
    }
  }

  const handleSubmit = async () => {
    const odometerValue = parseInt(inspection.odometerReading, 10);
    const totalItems = inspection.checkItems.length;
    const completedItems = inspection.checkItems.filter(item => item.value && item.value.trim() !== '').length;
    const percentage = Math.round((completedItems / totalItems) * 100);

    if (completedItems === totalItems) {
      const isValid = inspection.handleSubmit();
      if (!isValid) return; // Validation failed, alert shown in hook

      Alert.alert(
        `${checkType === 'morning' ? '🌅 Morning' : '🌆 Evening'} Daily Check Complete`,
        `All ${totalItems} items completed!\nOdometer: ${odometerValue} km\n\nYour vehicle is ready for operation.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async () => {
              handleSaveInspection();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Incomplete Check',
        `You have completed ${completedItems} out of ${totalItems} items (${percentage}%).\n\nPlease complete all items before submitting.`,
        [
          { text: 'Continue Checking', style: 'cancel' },
          {
            text: 'Submit Anyway',
            style: 'destructive',
            onPress: async () => {
              await markCheckCompleted(checkType);
              handleSaveInspection();
            },
          },
        ]
      );
    }
  };

  if (isLoading || inspection.checkItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Daily/Evening Check',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading inspection items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalCompleted = inspection.checkItems.filter(item => item.value && item.value.trim() !== '').length;
  const progress = (totalCompleted / inspection.checkItems.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Daily/Evening Inspection',
          headerBackTitle: 'Back',
        }}
      />

      {alreadyCompleted && (
        <View style={styles.completedBanner}>
          <IconSymbol name="checkmark.circle.fill" size={20} color={colors.secondary} />
          <Text style={styles.completedBannerText}>
            Daily check already completed today
          </Text>
        </View>
      )}

      <View style={styles.headerCard}>
        <View style={styles.checkTypeIndicator}>
          <IconSymbol 
            name="clock.fill" 
            size={32} 
            color={colors.primary} 
          />
          <View style={styles.checkTypeInfo}>
            <Text style={styles.checkTypeTitle}>
              Daily/Evening Inspection
            </Text>
            <Text style={styles.checkTypeTime}>
              To be completed by 08:00
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Inspection Progress</Text>
          <Text style={styles.progressText}>
            {totalCompleted} / {inspection.checkItems.length} items
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {status && (
        <StatusMessage status={status.type} message={status.message} />
      )}

      <StatusMessage
        status={localStatus?.type || 'info'}
        message={localStatus?.message || ''}
        modal
        visible={!!localStatus}
        onClose={() => setLocalStatus(null)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Odometer Reading Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <IconSymbol name="speedometer" size={18} color={colors.text} /> Odometer Reading
          </Text>
          <View style={styles.odometerSection}>
            <TextInput
              style={styles.odometerInput}
              placeholder="Enter odometer reading (km)"
              placeholderTextColor={colors.textSecondary}
              value={inspection.odometerReading}
              onChangeText={inspection.setOdometerReading}
              keyboardType="numeric"
              maxLength={8}
            />
            
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Dashboard Photo (Required)</Text>
              {inspection.odometerPhoto ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: `data:image/jpeg;base64,${inspection.odometerPhoto}` }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => inspection.removePhoto('odometer')}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => inspection.showImageOptions('odometer')}
                >
                  <IconSymbol name="camera.fill" size={24} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Add Dashboard Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Checklist Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <IconSymbol name="checklist" size={18} color={colors.text} /> Vehicle Inspection
          </Text>
          {inspection.checkItems.map(item => (
            <View key={item.id} style={styles.checkItemContainer}>
              <View style={styles.checkItem}>
                <View style={styles.checkItemContent}>
                  <Text style={styles.checkItemLabel}>
                    {item.label}
                    {item.itemType === 'Integer' && <Text style={styles.unitText}> (mm)</Text>}
                  </Text>
                  <TextInput
                    style={styles.valueInput}
                    placeholder={item.itemType === 'Integer' ? 'Enter measurement' : 'Enter value'}
                    placeholderTextColor={colors.textSecondary}
                    value={item.value}
                    onChangeText={(value) => inspection.setItemValue(item.id, value)}
                    keyboardType={item.itemType === 'Integer' ? 'numeric' : 'default'}
                    maxLength={item.itemType === 'Integer' ? 3 : undefined}
                  />
                </View>
              </View>

              {/* Photo upload if required */}
              {item.requiresPhoto && item.value && (
                <View style={styles.itemPhotoSection}>
                  {item.photoBase64 ? (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: `data:image/jpeg;base64,${item.photoBase64}` }} style={styles.photoPreviewSmall} />
                      <TouchableOpacity
                        style={styles.removePhotoButtonSmall}
                        onPress={() => inspection.removePhoto('oil', item.id)}
                      >
                        <IconSymbol name="xmark.circle.fill" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addPhotoButtonSmall}
                      onPress={() => inspection.showImageOptions('oil', item.id)}
                    >
                      <IconSymbol name="camera.fill" size={20} color={colors.primary} />
                      <Text style={styles.addPhotoTextSmall}>Add Photo (Required)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Additional Exceptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.text} /> Additional Exceptions
          </Text>
          <TextInput
            style={styles.exceptionsInput}
            placeholder="Report any other exceptions or issues..."
            placeholderTextColor={colors.textSecondary}
            value={inspection.additionalExceptions}
            onChangeText={inspection.setAdditionalExceptions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Complete all measurements in the daily/evening inspection by 08:00.
            Enter tyre tread depths in millimeters. Ensure all required photos are uploaded.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={buttonStyles.text}>
            Submit Daily Inspection
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default memo(DailyCheckScreen);

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
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  completedBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  completedBannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  headerCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkTypeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  checkTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  checkTypeTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  odometerSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  odometerInput: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 16,
  },
  photoSection: {
    marginTop: 8,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  photoPreviewSmall: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  removePhotoButtonSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.card,
    borderRadius: 10,
  },
  addPhotoButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  addPhotoButtonSmall: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addPhotoTextSmall: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  checkItemContainer: {
    marginBottom: 8,
  },
  checkItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  checkItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  checkItemLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  unitText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  valueInput: {
    width: 100,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  requiredPhotoIndicator: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  itemPhotoSection: {
    marginTop: 12,
    paddingLeft: 36,
  },
  exceptionsInput: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  infoCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    width: '100%',
  },
});
