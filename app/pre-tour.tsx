
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import useFetch from '@/hooks/useFetch';
import { submitCheck } from '@/services/api';

interface TyreData {
  position: string;
  depth: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  requiresPhoto?: boolean;
  photoBase64?: string | null;
}

export default function PreTourScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchData } = useFetch();
  
  // Odometer state
  const [odometerReading, setOdometerReading] = useState('');
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  
  // Trailer state
  const [trailerUsed, setTrailerUsed] = useState(false);
  
  // Main vehicle checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Tyre tread depth measurements
  const [tyres, setTyres] = useState<TyreData[]>([]);

  // Trailer checklist
  const [trailerChecklist, setTrailerChecklist] = useState<ChecklistItem[]>([]);

  // Trailer tyre tread depth
  const [trailerTyres, setTrailerTyres] = useState<TyreData[]>([]);

  // Other exceptions
  const [otherExceptions, setOtherExceptions] = useState('');

  // Full inspection data
  const [inspectionData, setInspectionData] = useState<any[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async (type: 'odometer' | 'oil') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'odometer') {
          setOdometerPhoto(result.assets[0].base64 || null);
        } else if (type === 'oil') {
           // Update the oil level check item with photo
           setChecklist(items =>
             items.map(item =>
               item.id === '75' ? { ...item, photoBase64: result.assets[0].base64 } : item
             )
           );
         }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (type: 'odometer' | 'oil') => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'odometer') {
          setOdometerPhoto(result.assets[0].base64 || null);
        } else if (type === 'oil') {
           setChecklist(items =>
             items.map(item =>
               item.id === '75' ? { ...item, photoBase64: result.assets[0].base64 } : item
             )
           );
         }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = (type: 'odometer' | 'oil') => {
    Alert.alert(
      'Upload Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => takePhoto(type) },
        { text: 'Choose from Library', onPress: () => pickImage(type) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removePhoto = (type: 'odometer' | 'oil') => {
    if (type === 'odometer') {
      setOdometerPhoto(null);
    } else if (type === 'oil') {
       setChecklist(items =>
         items.map(item =>
           item.id === '75' ? { ...item, photoBase64: null } : item
         )
       );
     }
  };

  const updateTyreData = (index: number, value: string) => {
    const newTyres = [...tyres];
    newTyres[index].depth = value;
    setTyres(newTyres);

    // Check for low tread depth
    if (value) {
      const depth = parseFloat(value);
      if (depth < 1.6) {
        Alert.alert(
          'Warning: Low Tyre Tread',
          `${newTyres[index].position} tyre tread depth is below the legal minimum (1.6mm). Please replace the tyre.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const updateTrailerTyreData = (index: number, value: string) => {
    const newTyres = [...trailerTyres];
    newTyres[index].depth = value;
    setTrailerTyres(newTyres);

    if (value) {
      const depth = parseFloat(value);
      if (depth < 1.6) {
        Alert.alert(
          'Warning: Low Tyre Tread',
          `Trailer ${newTyres[index].position} tyre tread depth is below the legal minimum (1.6mm). Please replace the tyre.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const toggleTrailerChecklistItem = (id: string) => {
    setTrailerChecklist(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleSubmit = () => {
    // Validate odometer reading and photo
    if (!odometerReading.trim()) {
      Alert.alert('Missing Information', 'Please enter the odometer reading.');
      return;
    }
    
    if (!odometerPhoto) {
      Alert.alert('Missing Photo', 'Please upload a photo of the dashboard odometer.');
      return;
    }

    // Validate main checklist
    const incompleteChecklist = checklist.filter(item => !item.checked);
    if (incompleteChecklist.length > 0) {
      Alert.alert(
        'Incomplete Checklist',
        `Please complete all checklist items. Missing: ${incompleteChecklist.length} item(s).`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate oil level photo (forced photo)
    const oilCheckItem = checklist.find(item => item.id === '75');
    if (!oilCheckItem?.photoBase64) {
      Alert.alert('Missing Photo', 'Please upload a photo of the oil level check.');
      return;
    }

    // Validate tyre tread depths
    const incompleteTyres = tyres.filter(tyre => !tyre.depth);
    if (incompleteTyres.length > 0) {
      Alert.alert(
        'Incomplete Tyre Measurements',
        'Please complete all tyre tread depth measurements.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate trailer section if trailer is used
    if (trailerUsed) {
      const incompleteTrailerChecklist = trailerChecklist.filter(item => !item.checked);
      if (incompleteTrailerChecklist.length > 0) {
        Alert.alert(
          'Incomplete Trailer Checklist',
          `Please complete all trailer checklist items. Missing: ${incompleteTrailerChecklist.length} item(s).`,
          [{ text: 'OK' }]
        );
        return;
      }

      const incompleteTrailerTyres = trailerTyres.filter(tyre => !tyre.depth);
      if (incompleteTrailerTyres.length > 0) {
        Alert.alert(
          'Incomplete Trailer Tyre Measurements',
          'Please complete all trailer tyre tread depth measurements.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Check for alignment issues
    const depths = tyres.map(t => parseFloat(t.depth));
    const maxDepth = Math.max(...depths);
    const minDepth = Math.min(...depths);
    const depthDifference = maxDepth - minDepth;

    if (depthDifference > 2) {
      Alert.alert(
        'Wheel Alignment Alert',
        `Significant tyre wear difference detected (${depthDifference.toFixed(1)}mm). This may indicate wheel alignment issues.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit Anyway',
            onPress: () => handleSaveInspection(),
          },
        ]
      );
    } else {
      handleSaveInspection();
    }
  };

  const handleSaveInspection = async () => {
    try {
      const tourId = user?.driver?.currentTour || user?.driver?.tour;
      if (!tourId) {
        Alert.alert('Error', 'Tour ID not found. Please log in again.');
        return;
      }

      const date = new Date().toISOString();

      // Process items
      const items: any[] = [];

      // Checklist items
      checklist
        .filter(item => item.checked)
        .forEach((item) => {
          const attachments: { remark: string; imageData: string }[] = [];
          if (item.photoBase64) {
            attachments.push({ remark: item.label, imageData: `data:image/jpeg;base64,${item.photoBase64}` });
          }
          items.push({
            inspectionItem: item.id,
            value: 'checked',
            attachments,
          });
        });

      // Tyre items
      tyres.forEach((tyre) => {
        if (tyre.depth) {
          const tyreItem = inspectionData.find((item: any) => item.item === `Tyre tread ${tyre.position}`);
          if (tyreItem) {
            items.push({
              inspectionItem: tyreItem.id,
              value: tyre.depth,
              attachments: [],
            });
          }
        }
      });

      // Trailer checklist
      if (trailerUsed) {
        trailerChecklist
          .filter(item => item.checked)
          .forEach((item) => {
            items.push({
              inspectionItem: item.id,
              value: 'checked',
              attachments: [],
            });
          });

        // Trailer tyres
        trailerTyres.forEach((tyre) => {
          if (tyre.depth) {
            const trailerTyreItem = inspectionData.find((item: any) => item.item === `Trailer Tyre tread ${tyre.position}`);
            if (trailerTyreItem) {
              items.push({
                inspectionItem: trailerTyreItem.id,
                value: tyre.depth,
                attachments: [],
              });
            }
          }
        });
      }

      // Other exceptions
      if (otherExceptions.trim()) {
        const otherItem = inspectionData.find((item: any) => item.item === 'Other');
        if (otherItem) {
          items.push({
            inspectionItem: otherItem.id,
            value: otherExceptions,
            attachments: [],
          });
        }
      }

      // Process attachments
      const attachments: { remark: string; imageData: string }[] = [];
      if (odometerPhoto) {
        attachments.push({ remark: 'Odometer Reading', imageData: `data:image/jpeg;base64,${odometerPhoto}` });
      }

      const body = {
        tourId: parseInt(tourId, 10),
        inspectionId: 3,
        date,
        items,
        attachments,
      };

      console.log('Submitting pre-tour check:', body);

      const response = await submitCheck(body);

      if (response) {
        console.log('Pre-tour check submitted successfully:', response);
        Alert.alert(
          'Success',
          'Pre-tour inspection completed successfully. Must be completed by 08h00 on day of tour start.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit pre-tour check. Please try again.');
      }
    } catch (error) {
      console.error('Error saving pre-tour inspection:', error);
      Alert.alert('Error', 'An error occurred while saving the inspection.');
    }
  };
  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        const response = await fetchData({ method: 'GET', endPoint: '/api/v1/inspection/3' });
        if (response && Array.isArray(response)) {
          // Categorize items
          const checklistItems: ChecklistItem[] = [];
          const tyreItems: TyreData[] = [];
          const trailerChecklistItems: ChecklistItem[] = [];
          const trailerTyreItems: TyreData[] = [];

          response.forEach((item: any) => {
            if (item.itemType === 'YesNo') {
              if (item.item.includes('Trailer') && !item.item.includes('Tyre')) {
                trailerChecklistItems.push({
                  id: String(item.id),
                  label: item.item,
                  checked: false,
                  requiresPhoto: item.id === '75', // Oil level
                });
              } else if (!item.item.includes('Tyre') && !item.item.includes('Trailer')) {
                checklistItems.push({
                  id: String(item.id),
                  label: item.item,
                  checked: false,
                  requiresPhoto: item.id === '75', // Oil level
                });
              }
            } else if (item.itemType === 'Integer') {
              if (item.item.includes('Trailer Tyre')) {
                trailerTyreItems.push({
                  position: item.item.replace('Trailer Tyre tread ', ''),
                  depth: '',
                });
              } else if (item.item.includes('Tyre tread')) {
                tyreItems.push({
                  position: item.item.replace('Tyre tread ', ''),
                  depth: '',
                });
              }
            } else if (item.itemType === 'String') {
              // Other exceptions
            }
          });

          setInspectionData(response);
          setChecklist(checklistItems);
          setTyres(tyreItems);
          setTrailerChecklist(trailerChecklistItems);
          setTrailerTyres(trailerTyreItems);
        }
      } catch (error) {
        console.error('Error fetching inspection data:', error);
      }
    };

    fetchInspectionData();
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Pre-Tour Inspection',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Deadline Notice */}
        <View style={styles.deadlineCard}>
          <IconSymbol name="clock.fill" size={20} color={colors.warning} />
          <Text style={styles.deadlineText}>
            Must be completed by 08h00 on day of tour start
          </Text>
        </View>

        {/* Odometer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Odometer Reading</Text>
          <View style={styles.odometerCard}>
            <TextInput
              style={styles.odometerInput}
              placeholder="Enter odometer reading (km)"
              placeholderTextColor={colors.textSecondary}
              value={odometerReading}
              onChangeText={setOdometerReading}
              keyboardType="numeric"
            />
            
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Dashboard Photo (Required)</Text>
              {odometerPhoto ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: `data:image/jpeg;base64,${odometerPhoto}` }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto('odometer')}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => showImageOptions('odometer')}
                >
                  <IconSymbol name="camera.fill" size={24} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>Upload Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Main Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Inspection Checklist</Text>
          {checklist.map(item => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.checkItem}
                onPress={() => toggleChecklistItem(item.id)}
              >
                <View style={[
                  styles.checkbox,
                  item.checked && styles.checkboxChecked,
                ]}>
                  {item.checked && (
                    <IconSymbol name="checkmark" size={18} color={colors.card} />
                  )}
                </View>
                <Text style={styles.checkItemLabel}>{item.label}</Text>
                {item.requiresPhoto && (
                  <IconSymbol name="camera.fill" size={16} color={colors.warning} />
                )}
              </TouchableOpacity>
              
              {/* Oil level photo upload (forced) */}
              {item.id === '75' && (
                <View style={styles.photoSectionInline}>
                  {item.photoBase64 ? (
                    <View style={styles.photoPreviewSmall}>
                      <Image source={{ uri: `data:image/jpeg;base64,${item.photoBase64}` }} style={styles.photoImageSmall} />
                      <TouchableOpacity
                        style={styles.removePhotoButtonSmall}
                        onPress={() => removePhoto('oil')}
                      >
                        <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButtonSmall}
                      onPress={() => showImageOptions('oil')}
                    >
                      <IconSymbol name="camera.fill" size={20} color={colors.primary} />
                      <Text style={styles.uploadButtonTextSmall}>Upload Oil Level Photo (Required)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Tyre Tread Depth */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tyre Tread Depth Measurements</Text>
          <Text style={styles.sectionDescription}>
            Measure tread depth (mm) for each tyre. Legal minimum: 1.6mm
          </Text>

          {tyres.map((tyre, index) => (
            <View key={index} style={styles.tyreCard}>
              <View style={styles.tyreHeader}>
                <IconSymbol name="circle.fill" size={12} color={colors.primary} />
                <Text style={styles.tyrePosition}>{tyre.position}</Text>
              </View>
              <View style={styles.tyreInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tread Depth (mm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 5.2"
                    placeholderTextColor={colors.textSecondary}
                    value={tyre.depth}
                    onChangeText={(value) => updateTyreData(index, value)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Trailer Section */}
        <View style={styles.section}>
          <View style={styles.trailerToggleContainer}>
            <Text style={styles.sectionTitle}>Trailer Inspection</Text>
            <TouchableOpacity
              style={styles.trailerToggle}
              onPress={() => setTrailerUsed(!trailerUsed)}
            >
              <View style={[
                styles.toggleSwitch,
                trailerUsed && styles.toggleSwitchActive,
              ]}>
                <View style={[
                  styles.toggleKnob,
                  trailerUsed && styles.toggleKnobActive,
                ]} />
              </View>
              <Text style={styles.trailerToggleText}>
                {trailerUsed ? 'Trailer Used' : 'No Trailer'}
              </Text>
            </TouchableOpacity>
          </View>

          {trailerUsed && (
            <>
              <View style={styles.trailerContent}>
                <Text style={styles.sectionDescription}>
                  Complete trailer inspection checklist
                </Text>
                
                {trailerChecklist.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.checkItem}
                    onPress={() => toggleTrailerChecklistItem(item.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      item.checked && styles.checkboxChecked,
                    ]}>
                      {item.checked && (
                        <IconSymbol name="checkmark" size={18} color={colors.card} />
                      )}
                    </View>
                    <Text style={styles.checkItemLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}

                <Text style={[styles.sectionDescription, { marginTop: 16 }]}>
                  Trailer tyre tread depth measurements
                </Text>

                {trailerTyres.map((tyre, index) => (
                  <View key={index} style={styles.tyreCard}>
                    <View style={styles.tyreHeader}>
                      <IconSymbol name="circle.fill" size={12} color={colors.primary} />
                      <Text style={styles.tyrePosition}>Trailer - {tyre.position}</Text>
                    </View>
                    <View style={styles.tyreInputs}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tread Depth (mm)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., 5.2"
                          placeholderTextColor={colors.textSecondary}
                          value={tyre.depth}
                          onChangeText={(value) => updateTrailerTyreData(index, value)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
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
            value={otherExceptions}
            onChangeText={setOtherExceptions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            All items must be completed before submission. Photos are required for odometer and oil level checks.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={buttonStyles.text}>Submit Pre-Tour Inspection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  deadlineCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  deadlineText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  odometerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  odometerInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
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
  photoPreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  uploadButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  checkItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
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
  photoSectionInline: {
    marginLeft: 36,
    marginRight: 16,
    marginTop: -4,
    marginBottom: 8,
  },
  photoPreviewSmall: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImageSmall: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  removePhotoButtonSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.card,
    borderRadius: 10,
  },
  uploadButtonSmall: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.warning,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 8,
  },
  tyreCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  tyreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tyrePosition: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  tyreInputs: {
    flexDirection: 'row',
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
  },
  trailerToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trailerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: colors.secondary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.card,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 3,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  trailerToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  trailerContent: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
});
