import { CheckListType, itemlistTypes } from "@/constants/data";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Image } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, buttonStyles } from "@/styles/commonStyles";
import * as ImagePicker from 'expo-image-picker';
import { submitCheck } from '@/services/api';

export default function Inspections() {
  const [checklistItems, setChecklistItems] = useState<CheckListType[]>([]);
  const [itemValues, setItemValues] = useState<Record<number, string>>({});
  const [itemPhotos, setItemPhotos] = useState<Record<number, string | null>>({});

  useEffect(() => {
    setChecklistItems(itemlistTypes);
    // Initialize values
    const initialValues: Record<number, string> = {};
    const initialPhotos: Record<number, string | null> = {};
    itemlistTypes.forEach(item => {
      initialValues[item.id] = item.itemType === 'YesNo' ? 'unchecked' : '';
      if (item.id === 57 || item.id === 75) {
        initialPhotos[item.id] = null;
      }
    });
    setItemValues(initialValues);
    setItemPhotos(initialPhotos);
  }, []);

  const updateValue = (id: number, value: string) => {
    setItemValues(prev => ({ ...prev, [id]: value }));
  };

  const toggleYesNo = (id: number) => {
    const current = itemValues[id] || 'unchecked';
    updateValue(id, current === 'checked' ? 'unchecked' : 'checked');
  };

  const pickImage = async (id: number) => {
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
        setItemPhotos(prev => ({ ...prev, [id]: result.assets[0].base64 || null }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (id: number) => {
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
        setItemPhotos(prev => ({ ...prev, [id]: result.assets[0].base64 || null }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = (id: number) => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(id),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(id),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const groupedItems = checklistItems.reduce((acc, item) => {
    const type = String(item.itemType);
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, CheckListType[]>);

  const handleSubmit = async () => {
    // Basic validation
    const odometerValue = itemValues[57];
    if (!odometerValue || odometerValue.trim() === '') {
      Alert.alert('Missing Information', 'Please enter the odometer reading.');
      return;
    }
    if (!itemPhotos[57]) {
      Alert.alert('Missing Photo', 'Please upload a photo of the dashboard odometer.');
      return;
    }

    const date = new Date().toISOString();

    const items = checklistItems.map((item) => ({
      inspectionItemId: item.id,
      value: itemValues[item.id] || '',
      attachment: itemPhotos[item.id] ? `data:image/jpeg;base64,${itemPhotos[item.id]}` : null,
    }));

    const body = {
      inspectionId: 3,
      tourId: null,
      date,
      items,
      attachments: [],
    };

    try {
      const response = await submitCheck(body);
      if (response.success) {
        Alert.alert('Success', 'Inspection submitted successfully!');
      } else {
        Alert.alert('Error', 'Failed to submit inspection.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while submitting.');
    }
  };

  // Separate odometer
  const odometerItem = checklistItems.find(item => item.id === 57);
  const otherGroupedItems = { ...groupedItems };
  if (odometerItem) {
    delete otherGroupedItems[odometerItem.itemType];
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Stack.Screen options={{ headerTitle: 'Inspections' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Odometer Section */}
        {odometerItem && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <IconSymbol name="speedometer" size={18} color={colors.text} /> Odometer Reading
            </Text>
            <View style={styles.odometerSection}>
              <TextInput
                style={styles.odometerInput}
                placeholder="Enter odometer reading (km)"
                placeholderTextColor={colors.textSecondary}
                value={itemValues[odometerItem.id] || ''}
                onChangeText={(value) => updateValue(odometerItem.id, value)}
                keyboardType="numeric"
              />
              <View style={styles.photoSection}>
                <Text style={styles.photoLabel}>Dashboard Photo (Required)</Text>
                {itemPhotos[odometerItem.id] ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: `data:image/jpeg;base64,${itemPhotos[odometerItem.id]}` }} style={styles.photoPreview} />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => showImageOptions(odometerItem.id)}
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
        {Object.entries(otherGroupedItems).map(([itemType, items]) => (
          <View key={itemType} style={styles.section}>
            <Text style={styles.sectionTitle}>{itemType} Items</Text>
            {items.map(item => (
              <View key={item.id} style={styles.itemContainer}>
                <View style={styles.checkItem}>
                  <View style={styles.checkItemContent}>
                    <Text style={styles.checkItemLabel}>
                      {item.item}
                      {(item.id === 75 || item.id === 57) && <Text style={styles.photoIndicator}> (Photo Required)</Text>}
                    </Text>
                    {item.itemType === 'YesNo' ? (
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleYesNo(item.id)}
                      >
                        <View style={[styles.checkbox, itemValues[item.id] === 'checked' && styles.checkboxChecked]}>
                          {itemValues[item.id] === 'checked' && <IconSymbol name="checkmark" size={18} color={colors.card} />}
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <TextInput
                        style={styles.valueInput}
                        value={itemValues[item.id] || ''}
                        onChangeText={(value) => updateValue(item.id, value)}
                        placeholder={item.itemType === 'Integer' ? 'Enter measurement' : 'Enter value'}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType={item.itemType === 'Integer' ? 'numeric' : 'default'}
                        maxLength={item.itemType === 'Integer' ? 3 : undefined}
                      />
                    )}
                  </View>
                </View>

                {/* Photo for oil */}
                {item.id === 75 && (
                  <View style={styles.itemPhotoSection}>
                    {itemPhotos[item.id] ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: `data:image/jpeg;base64,${itemPhotos[item.id]}` }} style={styles.photoPreviewSmall} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addPhotoButtonSmall}
                        onPress={() => showImageOptions(item.id)}
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
        ))}
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