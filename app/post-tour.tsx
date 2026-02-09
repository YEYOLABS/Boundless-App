
import React, { useState } from 'react';
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

interface TyreData {
  position: string;
  depth: string;
}

interface TrailerChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function PostTourScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, assignedTask } = useAuth();
  const { fetchData } = useFetch();

  // Odometer
  const [odometerReading, setOdometerReading] = useState('');
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);

  // Fuel level
  const [fuelPhoto, setFuelPhoto] = useState<string | null>(null);

  // Tyre tread depths
  const [tyreData, setTyreData] = useState<TyreData[]>([
    { position: 'Left front', depth: '' },
    { position: 'Right front', depth: '' },
    { position: 'Left rear inner', depth: '' },
    { position: 'Left rear outer', depth: '' },
    { position: 'Right rear inner', depth: '' },
    { position: 'Right rear outer', depth: '' },
  ]);

  // Trailer
  const [trailerUsed, setTrailerUsed] = useState(false);
  const [trailerChecklist, setTrailerChecklist] = useState<TrailerChecklistItem[]>([
    { id: '1', label: 'All lights and fittings working', checked: false },
    { id: '2', label: 'Tyre pressures correct', checked: false },
  ]);
  const [trailerTyreData, setTrailerTyreData] = useState<TyreData[]>([
    { position: 'Left', depth: '' },
    { position: 'Right', depth: '' },
  ]);

  const pickImage = async (type: 'odometer' | 'fuel') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'odometer') {
        setOdometerPhoto(result.assets[0].base64 || null);
      } else {
        setFuelPhoto(result.assets[0].base64 || null);
      }
    }
  };

  const takePhoto = async (type: 'odometer' | 'fuel') => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'odometer') {
        setOdometerPhoto(result.assets[0].base64 || null);
      } else {
        setFuelPhoto(result.assets[0].base64 || null);
      }
    }
  };

  const showImageOptions = (type: 'odometer' | 'fuel') => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(type),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(type),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const removePhoto = (type: 'odometer' | 'fuel') => {
    if (type === 'odometer') {
      setOdometerPhoto(null);
    } else {
      setFuelPhoto(null);
    }
  };

  const updateTyreData = (index: number, value: string) => {
    const newData = [...tyreData];
    newData[index].depth = value;
    setTyreData(newData);
  };

  const updateTrailerTyreData = (index: number, value: string) => {
    const newData = [...trailerTyreData];
    newData[index].depth = value;
    setTrailerTyreData(newData);
  };

  const toggleTrailerChecklistItem = (id: string) => {
    setTrailerChecklist(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleSubmit = () => {
    // Validate odometer reading
    if (!odometerReading.trim()) {
      Alert.alert('Missing Information', 'Please enter the odometer reading.');
      return;
    }

    // Validate odometer photo
    if (!odometerPhoto) {
      Alert.alert('Missing Photo', 'Please upload a photo of the dashboard odometer.');
      return;
    }

    // Validate fuel photo
    if (!fuelPhoto) {
      Alert.alert('Missing Photo', 'Please upload a photo of the fuel level.');
      return;
    }

    // Validate tyre tread depths
    const emptyTyreDepths = tyreData.filter(tyre => !tyre.depth.trim());
    if (emptyTyreDepths.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please enter tyre tread depth for: ${emptyTyreDepths.map(t => t.position).join(', ')}`
      );
      return;
    }

    // Validate trailer data if trailer is used
    if (trailerUsed) {
      const uncheckedItems = trailerChecklist.filter(item => !item.checked);
      if (uncheckedItems.length > 0) {
        Alert.alert(
          'Incomplete Trailer Inspection',
          'Please complete all trailer checklist items.'
        );
        return;
      }

      const emptyTrailerTyreDepths = trailerTyreData.filter(tyre => !tyre.depth.trim());
      if (emptyTrailerTyreDepths.length > 0) {
        Alert.alert(
          'Missing Information',
          `Please enter trailer tyre tread depth for: ${emptyTrailerTyreDepths.map(t => t.position).join(', ')}`
        );
        return;
      }
    }

    handleSaveInspection();
  };

  const handleSaveInspection = async () => {
    try {
      setIsSubmitting(true);
      const tourId = assignedTask?.tour?.id;
      if (!tourId) {
        Alert.alert('Error', 'No assigned tour found.');
        setIsSubmitting(false);
        return;
      }

      const date = new Date().toISOString();

      // Process attachments
      const attachments: { remark: string; imageData: string }[] = [];
      if (odometerPhoto) {
        attachments.push({ remark: 'Odometer Reading', imageData: `data:image/jpeg;base64,${odometerPhoto}` });
      }
      if (fuelPhoto) {
        attachments.push({ remark: 'Fuel Level', imageData: `data:image/jpeg;base64,${fuelPhoto}` });
      }

      const body = {
        tourId: parseInt(tourId, 10),
        date,
        items: [],
        attachments,
      };

      console.log('Submitting post-tour check:', body);

      const response = await fetchData({
        endPoint: '/submit-inspection',
        method: 'POST',
        data: body,
      });

      if (response) {
        console.log('Post-tour check submitted successfully:', response);
        Alert.alert(
          'Post-Tour Complete',
          'Post-tour inspection submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit post-tour check. Please try again.');
      }
    } catch (error) {
      console.error('Error saving post-tour inspection:', error);
      Alert.alert('Error', 'An error occurred while saving the inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Post-Tour Inspection',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Simplified post-tour inspection. Only odometer reading, fuel level, and tyre tread depths required.
          </Text>
        </View>

        {/* Odometer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Odometer Reading</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter Odometer Reading (km) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 45380"
              placeholderTextColor={colors.textSecondary}
              value={odometerReading}
              onChangeText={setOdometerReading}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.inputLabel}>Dashboard Photo *</Text>
            {odometerPhoto ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: `data:image/jpeg;base64,${odometerPhoto}` }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto('odometer')}
                >
                  <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => showImageOptions('odometer')}
              >
                <IconSymbol name="camera.fill" size={32} color={colors.primary} />
                <Text style={styles.photoButtonText}>Add Dashboard Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Fuel Level Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Level</Text>
          <View style={styles.photoSection}>
            <Text style={styles.inputLabel}>Fuel Level Photo *</Text>
            {fuelPhoto ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: `data:image/jpeg;base64,${fuelPhoto}` }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto('fuel')}
                >
                  <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => showImageOptions('fuel')}
              >
                <IconSymbol name="camera.fill" size={32} color={colors.primary} />
                <Text style={styles.photoButtonText}>Add Fuel Level Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tyre Tread Depths Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tyre Tread Depths</Text>
          <Text style={styles.sectionDescription}>
            Enter tread depth in mm for all tyres
          </Text>
          {tyreData.map((tyre, index) => (
            <View key={index} style={styles.tyreInputContainer}>
              <Text style={styles.tyreLabel}>{tyre.position}</Text>
              <TextInput
                style={styles.tyreInput}
                placeholder="mm"
                placeholderTextColor={colors.textSecondary}
                value={tyre.depth}
                onChangeText={(value) => updateTyreData(index, value)}
                keyboardType="decimal-pad"
              />
            </View>
          ))}
        </View>

        {/* Trailer Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.trailerToggle}
            onPress={() => setTrailerUsed(!trailerUsed)}
          >
            <View style={[
              styles.checkbox,
              trailerUsed && styles.checkboxChecked,
            ]}>
              {trailerUsed && (
                <IconSymbol name="checkmark" size={18} color={colors.card} />
              )}
            </View>
            <Text style={styles.trailerToggleText}>Trailer Used</Text>
          </TouchableOpacity>

          {trailerUsed && (
            <>
              <View style={styles.trailerSection}>
                <Text style={styles.sectionTitle}>Trailer Inspection</Text>
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
              </View>

              <View style={styles.trailerTyreSection}>
                <Text style={styles.sectionTitle}>Trailer Tyre Tread Depths</Text>
                {trailerTyreData.map((tyre, index) => (
                  <View key={index} style={styles.tyreInputContainer}>
                    <Text style={styles.tyreLabel}>{tyre.position}</Text>
                    <TextInput
                      style={styles.tyreInput}
                      placeholder="mm"
                      placeholderTextColor={colors.textSecondary}
                      value={tyre.depth}
                      onChangeText={(value) => updateTrailerTyreData(index, value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary, styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={buttonStyles.text}>Submit Post-Tour Inspection</Text>
          )}
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
  infoCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
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
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
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
  photoSection: {
    marginTop: 8,
  },
  photoButton: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.card,
    borderRadius: 20,
  },
  tyreInputContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  tyreLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  tyreInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    width: 80,
    textAlign: 'center',
  },
  trailerToggle: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  trailerToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  trailerSection: {
    marginTop: 8,
  },
  trailerTyreSection: {
    marginTop: 16,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkItemLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
