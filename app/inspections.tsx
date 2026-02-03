import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, buttonStyles } from "@/styles/commonStyles";
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/contexts/AuthContext';
import {
  hasCompletedCheckToday,
  markCheckCompleted,
  CheckType
} from '@/services/notificationService';

type InspectionItem = {
  key: string;
  name: string;
  inputType: string;
  mandatory?: boolean;
  photoRequired?: boolean;
  safetyCritical?: boolean;
  conditional?: string;
  fields?: string[];
};

export default function Inspections() {
  const { inspectionType } = useLocalSearchParams<{ inspectionType: string }>();
  const { assignedTask } = useAuth();
  const [checklistItems, setChecklistItems] = useState<InspectionItem[]>([]);
  const [displayIds, setDisplayIds] = useState<string[]>([]);
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [itemPhotos, setItemPhotos] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [checkType, setCheckType] = useState<CheckType>('morning');
  const [backendType, setBackendType] = useState<string>('');
  const { fetchData } = useFetch();

  useEffect(() => {
    const initializeInspection = async () => {
      try {
        setIsLoading(true);

        // Map frontend inspectionType to backend type
        const typeMapping: Record<string, string> = {
          'Daily': 'daily',
          'PreTour': 'pre_tour',
          'post-tour': 'post_tour',
          'evening': 'evening'
        };
        const backendType = typeMapping[inspectionType] || inspectionType;

        // Fetch inspection items from server
        const response = await fetchData({ endPoint: `/get-inspection-items?type=${backendType}`, method: 'GET' });
        if (!response || !response.items) {
          Alert.alert('Error', 'Failed to load inspection items');
          return;
        }

        // Determine check type based on inspection type
        const currentType: CheckType = (backendType === 'daily' || backendType === 'pre_tour') ? 'morning' : 'evening';
        setCheckType(currentType);
        setBackendType(backendType);

        // Check if already completed today
        const completed = await hasCompletedCheckToday(currentType);
        setAlreadyCompleted(completed);

        // Set checklist items
        setChecklistItems(response.items);

        // Set display keys - all items for now, but can filter based on conditional later
        setDisplayIds(response.items.map((item: InspectionItem) => item.key));

        // Initialize values
        const initialValues: Record<string, string> = {};
        const initialPhotos: Record<string, string | null> = {};
        response.items.forEach((item: InspectionItem) => {
          initialValues[item.key] = item.inputType === 'switch' ? 'unchecked' : '';
          if (item.photoRequired) {
            initialPhotos[item.key] = null;
          }
        });
        setItemValues(initialValues);
        setItemPhotos(initialPhotos);
      } catch (error) {
        console.error('Error initializing inspection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeInspection();
  }, [inspectionType]);

  const updateValue = (key: string, value: string) => {
    setItemValues(prev => ({ ...prev, [key]: value }));
  };

  const toggleYesNo = (key: string) => {
    const current = itemValues[key] || 'unchecked';
    updateValue(key, current === 'checked' ? 'unchecked' : 'checked');
  };

  const pickImage = async (key: string) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        const trimmed = base64 ? base64.trim() : '';
        setItemPhotos(prev => ({ ...prev, [key]: (trimmed.length > 0) ? trimmed : null }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (key: string) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        const trimmed = base64 ? base64.trim() : '';
        setItemPhotos(prev => ({ ...prev, [key]: (trimmed.length > 0) ? trimmed : null }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = (key: string) => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(key),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(key),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };


  const groupedItems = checklistItems.reduce((acc, item) => {
    const type = String(item.inputType);
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, InspectionItem[]>);

  const handleSubmit = async () => {
    // Basic validation
    const odometerValue = itemValues['odometer_reading'];
    if (!odometerValue || odometerValue.trim() === '') {
      Alert.alert('Missing Information', 'Please enter the odometer reading.');
      return;
    }
    if (!itemPhotos['odometer_reading']) {
      Alert.alert('Missing Photo', 'Please upload a photo of the dashboard odometer.');
      return;
    }

    const date = new Date().toISOString();

    const results: { key: string; value: boolean | number | string; imageUrl?: string }[] = [];
    checklistItems.forEach((item) => {
      let value: boolean | number | string = false; // Default value
      if (item.inputType === 'switch') {
        value = itemValues[item.key] === 'checked';
      } else if (item.inputType === 'number') {
        value = parseFloat(itemValues[item.key] || '0');
      } else if (item.inputType === 'text') {
        value = (itemValues[item.key] || '').length > 0;
      } else if (item.inputType === 'number_group') {
        // For number_group, send comma separated values
        const fieldValues = item.fields?.map(field => itemValues[`${item.key}_${field}`] || '0') || [];
        value = fieldValues.join(',');
      } else if (item.inputType === 'photo') {
        value = !!itemPhotos[item.key]; // Has photo
      }
      const photo = itemPhotos[item.key];
      results.push({
        key: item.key,
        value,
        imageUrl: photo ? `data:image/jpeg;base64,${photo}` : undefined,
      });
    });

    const attachments: { remark: string; imageData: string }[] = [];

    const body = {
      tourId: assignedTask?.tour?.tourId || null,
      vehicleId: assignedTask?.vehicle?.id || null,
      type: backendType,
      results,
    };

    try {
      const response = await fetchData({ endPoint: '/submit-inspection', method: 'POST', data: body });
      if (response) {
        // Mark inspection as completed
        await markCheckCompleted(checkType);

        Alert.alert('Success', 'Inspection submitted successfully!');
      } else {
        Alert.alert('Error', 'Failed to submit inspection.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while submitting.');
    }
  };

  // Separate odometer
  const odometerItem = checklistItems.find(item => item.key === 'odometer_reading');
  const otherGroupedItems = { ...groupedItems };
  if (odometerItem) {
    delete otherGroupedItems[odometerItem.inputType];
  }

  if (isLoading) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <Stack.Screen options={{ headerTitle: 'Inspections' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading inspection items...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Stack.Screen options={{ headerTitle: 'Inspections' }} />

      {alreadyCompleted && (
        <View style={styles.completedBanner}>
          <IconSymbol name="checkmark.circle.fill" size={20} color={colors.secondary} />
          <Text style={styles.completedBannerText}>
            {inspectionType} inspection already completed today
          </Text>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Odometer Section */}
        {odometerItem && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <IconSymbol name="speed" size={18} color={colors.text} /> Odometer Reading
            </Text>
            <View style={styles.odometerSection}>
              <TextInput
                style={styles.odometerInput}
                placeholder="Enter odometer reading (km)"
                placeholderTextColor={colors.textSecondary}
                value={itemValues[odometerItem.key] || ''}
                onChangeText={(value) => updateValue(odometerItem.key, value)}
                keyboardType="numeric"
              />
              <View style={styles.photoSection}>
                <Text style={styles.photoLabel}>Dashboard Photo (Required)</Text>
                {itemPhotos[odometerItem.key] ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: `data:image/jpeg;base64,${itemPhotos[odometerItem.key]}` }} style={styles.photoPreview} />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => showImageOptions(odometerItem.key)}
                  >
                    <IconSymbol name="camera.fill" size={24} color={colors.primary} />
                    <Text style={styles.addPhotoText}>Add Dashboard Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}


        {/* Other Sections */}
        {Object.entries(otherGroupedItems).map(([inputType, items]) => {
          const displayItems = items.filter(item => displayIds.includes(item.key));
          return displayItems.length > 0 ? (
            <View key={inputType} style={styles.section}>
              <Text style={styles.sectionTitle}>{inputType} Items</Text>
              {displayItems.map(item => (
                <View key={item.key} style={styles.itemContainer}>
                  <View style={styles.checkItem}>
                    <View style={styles.checkItemContent}>
                      <Text style={styles.checkItemLabel}>
                        {item.name}
                        {item.photoRequired && <Text style={styles.photoIndicator}> (Photo Required)</Text>}
                      </Text>
                      {item.inputType === 'switch' ? (
                        <TouchableOpacity
                          style={styles.checkboxContainer}
                          onPress={() => toggleYesNo(item.key)}
                        >
                          <View style={[styles.checkbox, itemValues[item.key] === 'checked' && styles.checkboxChecked]}>
                            {itemValues[item.key] === 'checked' && <IconSymbol name="checkmark" size={18} color={colors.card} />}
                          </View>
                        </TouchableOpacity>
                      ) : item.inputType === 'number' ? (
                        <TextInput
                          style={styles.valueInput}
                          value={itemValues[item.key] || ''}
                          onChangeText={(value) => updateValue(item.key, value)}
                          placeholder="Enter value"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                        />
                      ) : item.inputType === 'text' ? (
                        <TextInput
                          style={styles.valueInput}
                          value={itemValues[item.key] || ''}
                          onChangeText={(value) => updateValue(item.key, value)}
                          placeholder="Enter text"
                          placeholderTextColor={colors.textSecondary}
                        />
                      ) : item.inputType === 'number_group' ? (
                        // For number_group, we can render multiple inputs based on fields
                        <View style={styles.numberGroupContainer}>
                          {item.fields?.map(field => (
                            <TextInput
                              key={field}
                              style={styles.numberGroupInput}
                              value={itemValues[`${item.key}_${field}`] || ''}
                              onChangeText={(value) => updateValue(`${item.key}_${field}`, value)}
                              placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                              placeholderTextColor={colors.textSecondary}
                              keyboardType="numeric"
                            />
                          ))}
                        </View>
                      ) : item.inputType === 'photo' ? (
                        // For photo inputType, show photo picker
                        <TouchableOpacity
                          style={styles.addPhotoButtonSmall}
                          onPress={() => showImageOptions(item.key)}
                        >
                          <IconSymbol name="camera.fill" size={20} color={colors.primary} />
                          <Text style={styles.addPhotoTextSmall}>Add Photo</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {/* Photo for items that require photo */}
                  {item.photoRequired && item.inputType !== 'photo' && (
                    <View style={styles.itemPhotoSection}>
                      {itemPhotos[item.key] ? (
                        <View style={styles.photoPreviewContainer}>
                          <Image source={{ uri: `data:image/jpeg;base64,${itemPhotos[item.key]}` }} style={styles.photoPreviewSmall} />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addPhotoButtonSmall}
                          onPress={() => showImageOptions(item.key)}
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
          ) : null;
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[buttonStyles.primary, styles.submitButton]} onPress={handleSubmit}>
          <Text style={buttonStyles.text}>Submit Inspection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
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
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.card,
    fontSize: 16,
  },
  photoPreviewSmall: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.card,
    fontSize: 14,
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
  itemContainer: {
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
  checkItemLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  photoIndicator: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  valueInput: {
    flex: 1,
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
  numberGroupContainer: {
    flex: 1,
  },
  numberGroupInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  itemPhotoSection: {
    marginTop: 12,
    paddingLeft: 36,
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