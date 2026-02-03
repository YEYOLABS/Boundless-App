import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { validateInspection } from '@/utils/inspectionValidator';
import api from '@/services/api';

export type InspectionType = 'morning' | 'evening' | 'pre-tour' | 'post-tour';

interface CheckItem {
  id: string;
  label: string;
  value?: string;
  checked?: boolean;
  itemType?: 'Number' | 'Integer';
  requiresPhoto?: boolean;
  photoBase64?: string | null;
}

interface TyreData {
  position: string;
  depth: string;
}

export const useInspection = (type: InspectionType) => {
  // Common state
  const [odometerReading, setOdometerReading] = useState('');
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [additionalExceptions, setAdditionalExceptions] = useState('');

  // Daily/Evening state
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [fullInspectionData, setFullInspectionData] = useState<any[]>([]);

  // Pre/Post tour state
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [tyres, setTyres] = useState<TyreData[]>([]);
  const [trailerUsed, setTrailerUsed] = useState(false);
  const [trailerChecklist, setTrailerChecklist] = useState<CheckItem[]>([]);
  const [trailerTyres, setTrailerTyres] = useState<TyreData[]>([]);

  // Post tour specific
  const [fuelPhoto, setFuelPhoto] = useState<string | null>(null);
  const [tyreData, setTyreData] = useState<TyreData[]>([]);
  const [trailerTyreData, setTrailerTyreData] = useState<TyreData[]>([]);

  // Initialize based on type
  useEffect(() => {
    if (type === 'morning' || type === 'evening') {
      // Fetch inspection items from API
      const fetchInspectionItems = async () => {
        try {
          const response = await api.getInspectionByType(2);
          if (response.success && response.data) {
            setFullInspectionData(response.data);
            const items = response.data
              .sort((a: any, b: any) => a.index - b.index) // Sort by index
              .map((item: any) => ({
                id: String(item.id),
                label: item.item,
                value: '',
                itemType: item.itemType,
                requiresPhoto: false, // No photos required for daily check
                photoBase64: null,
              }));
            setCheckItems(items);
          }
        } catch (error) {
          // Fallback to empty array
          setCheckItems([]);
          setFullInspectionData([]);
        }
      };
      fetchInspectionItems();
    } else if (type === 'pre-tour') {
      setChecklist([
        { id: '1', label: 'Fire Extinguisher sealed and gauge in green', checked: false },
        { id: '2', label: 'PA system working', checked: false },
        { id: '3', label: 'Aircon Working', checked: false },
        { id: '4', label: 'Fridge Working', checked: false },
        { id: '5', label: 'WiFi working and loaded', checked: false },
        { id: '6', label: 'Seats not damaged and working, reclining, armrests working', checked: false },
        { id: '7', label: 'No damaged magazine nets', checked: false },
        { id: '8', label: 'Parcel shelves inspected and all lights and vents clean and working', checked: false },
        { id: '9', label: 'All safety belts working', checked: false },
        { id: '10', label: 'Water canisters are filled', checked: false },
        { id: '11', label: 'Internal lights working', checked: false },
        { id: '12', label: 'All outside lights front and rear working', checked: false },
        { id: '13', label: 'Oil level checked', checked: false, requiresPhoto: true },
        { id: '14', label: 'Anti-freeze level checked', checked: false },
        { id: '15', label: 'Brake fluid level checked', checked: false },
        { id: '16', label: 'Power steering oil level checked', checked: false },
        { id: '17', label: 'All doors closing and locking properly', checked: false },
        { id: '18', label: 'All sliding windows and front windows working and clean', checked: false },
        { id: '19', label: 'Reverse camera working', checked: false },
        { id: '20', label: 'Side mirrors all working', checked: false },
        { id: '21', label: 'Windscreen clean and has no running cracks', checked: false },
        { id: '22', label: 'All tyres in good condition', checked: false },
        { id: '23', label: 'All tyre pressures correct', checked: false },
      ]);
      setTyres([
        { position: 'Left front', depth: '' },
        { position: 'Right front', depth: '' },
        { position: 'Left rear inner', depth: '' },
        { position: 'Left rear outer', depth: '' },
        { position: 'Right rear inner', depth: '' },
        { position: 'Right rear outer', depth: '' },
      ]);
      setTrailerChecklist([
        { id: 't1', label: 'All lights and fittings working', checked: false },
        { id: 't2', label: 'Padlocks checked', checked: false },
        { id: 't3', label: 'Tyre pressures correct', checked: false },
      ]);
      setTrailerTyres([
        { position: 'Left', depth: '' },
        { position: 'Right', depth: '' },
      ]);
    } else if (type === 'post-tour') {
      setTyreData([
        { position: 'Left front', depth: '' },
        { position: 'Right front', depth: '' },
        { position: 'Left rear inner', depth: '' },
        { position: 'Left rear outer', depth: '' },
        { position: 'Right rear inner', depth: '' },
        { position: 'Right rear outer', depth: '' },
      ]);
      setTrailerChecklist([
        { id: '1', label: 'All lights and fittings working', checked: false },
        { id: '2', label: 'Tyre pressures correct', checked: false },
      ]);
      setTrailerTyreData([
        { position: 'Left', depth: '' },
        { position: 'Right', depth: '' },
      ]);
    }
  }, [type]);

  const pickImage = async (imageType: string, itemId?: string) => {
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
        if (imageType === 'odometer') {
          setOdometerPhoto(result.assets[0].base64 || null);
        } else if (imageType === 'fuel') {
          setFuelPhoto(result.assets[0].base64 || null);
        } else if (imageType === 'oil' && itemId) {
          if (type === 'morning' || type === 'evening') {
            setCheckItems(items =>
              items.map(item =>
                item.id === itemId ? { ...item, photoBase64: result.assets[0].base64 } : item
              )
            );
          } else if (type === 'pre-tour') {
            setChecklist(items =>
              items.map(item =>
                item.id === itemId ? { ...item, photoBase64: result.assets[0].base64 } : item
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (imageType: string, itemId?: string) => {
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
        if (imageType === 'odometer') {
          setOdometerPhoto(result.assets[0].base64 ?? null);
        } else if (imageType === 'fuel') {
          setFuelPhoto(result.assets[0].base64 ?? null);
        } else if (imageType === 'oil' && itemId) {
          if (type === 'morning' || type === 'evening') {
            setCheckItems(items =>
              items.map(item =>
                item.id === itemId ? { ...item, photoBase64: result.assets[0].base64 } : item
              )
            );
          } else if (type === 'pre-tour') {
            setChecklist(items =>
              items.map(item =>
                item.id === itemId ? { ...item, photoBase64: result.assets[0].base64 } : item
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = (imageType: string, itemId?: string) => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(imageType, itemId),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(imageType, itemId),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const removePhoto = (imageType: string, itemId?: string) => {
    if (imageType === 'odometer') {
      setOdometerPhoto(null);
    } else if (imageType === 'fuel') {
      setFuelPhoto(null);
    } else if (imageType === 'oil' && itemId) {
      if (type === 'morning' || type === 'evening') {
        setCheckItems(items =>
          items.map(item =>
            item.id === itemId ? { ...item, photoBase64: null } : item
          )
        );
      } else if (type === 'pre-tour') {
        setChecklist(items =>
          items.map(item =>
            item.id === itemId ? { ...item, photoBase64: null } : item
          )
        );
      }
    }
  };

  const toggleCheck = (id: string, listType?: 'main' | 'trailer') => {
    if (listType === 'trailer') {
      setTrailerChecklist(items =>
        items.map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    } else {
      if (type === 'morning' || type === 'evening') {
        setCheckItems(items =>
          items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
          )
        );
      } else if (type === 'pre-tour') {
        setChecklist(items =>
          items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
          )
        );
      }
    }
  };

  const setItemValue = (id: string, value: string) => {
    if (type === 'morning' || type === 'evening') {
      setCheckItems(items =>
        items.map(item =>
          item.id === id ? { ...item, value } : item
        )
      );
    }
  };

  const updateTyreData = (index: number, value: string, isTrailer?: boolean) => {
    if (isTrailer) {
      if (type === 'pre-tour') {
        const newTyres = [...trailerTyres];
        newTyres[index].depth = value;
        setTrailerTyres(newTyres);
      } else if (type === 'post-tour') {
        const newTyres = [...trailerTyreData];
        newTyres[index].depth = value;
        setTrailerTyreData(newTyres);
      }
    } else {
      if (type === 'pre-tour') {
        const newTyres = [...tyres];
        newTyres[index].depth = value;
        setTyres(newTyres);
      } else if (type === 'post-tour') {
        const newTyres = [...tyreData];
        newTyres[index].depth = value;
        setTyreData(newTyres);
      }
    }

    // Check for low tread depth
    if (value) {
      const depth = parseFloat(value);
      if (depth < 1.6) {
        Alert.alert(
          'Warning: Low Tyre Tread',
          `Tyre tread depth is below the legal minimum (1.6mm). Please replace the tyre.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSubmit = () => {
    const data = {
      odometerReading,
      odometerPhoto,
      checkItems,
      checklist,
      tyres,
      trailerUsed,
      trailerChecklist,
      trailerTyres,
      fuelPhoto,
      tyreData,
      trailerTyreData,
      additionalExceptions,
    };

    const validation = validateInspection(type, data);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return false;
    }

    // If valid, return true for component to handle submission
    return true;
  };

  return {
    // State
    odometerReading,
    setOdometerReading,
    odometerPhoto,
    additionalExceptions,
    setAdditionalExceptions,
    checkItems,
    fullInspectionData,
    checklist,
    tyres,
    trailerUsed,
    setTrailerUsed,
    trailerChecklist,
    trailerTyres,
    fuelPhoto,
    tyreData,
    trailerTyreData,
    // Functions
    pickImage,
    takePhoto,
    showImageOptions,
    removePhoto,
    toggleCheck,
    setItemValue,
    updateTyreData,
    handleSubmit,
  };
};