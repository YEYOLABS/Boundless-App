import { create } from 'zustand';
import * as ImagePicker from 'expo-image-picker';

interface InspectionItem {
  id: string;
  label: string;
  value?: string;
  checked?: boolean;
  itemType?: 'YesNo' | 'Integer' | 'String';
  requiresPhoto?: boolean;
  photoBase64?: string | null;
}

interface TyreData {
  position: string;
  depth: string;
}

interface InspectionState {
  // Common state
  odometerReading: string;
  odometerPhoto: string | null;
  additionalExceptions: string;

  // Checklist items
  checklist: InspectionItem[];

  // Tyre data
  tyres: TyreData[];

  // Trailer state
  trailerUsed: boolean;
  trailerChecklist: InspectionItem[];
  trailerTyres: TyreData[];

  // Post tour specific
  fuelPhoto: string | null;

  // Actions
  setOdometerReading: (value: string) => void;
  setOdometerPhoto: (photo: string | null) => void;
  setAdditionalExceptions: (value: string) => void;
  setChecklist: (checklist: InspectionItem[]) => void;
  setTyres: (tyres: TyreData[]) => void;
  setTrailerUsed: (used: boolean) => void;
  setTrailerChecklist: (checklist: InspectionItem[]) => void;
  setTrailerTyres: (tyres: TyreData[]) => void;
  setFuelPhoto: (photo: string | null) => void;

  toggleChecklistItem: (id: string) => void;
  toggleTrailerChecklistItem: (id: string) => void;
  setItemValue: (id: string, value: string) => void;
  updateTyreData: (index: number, value: string) => void;
  updateTrailerTyreData: (index: number, value: string) => void;

  pickImage: (type: 'odometer' | 'oil' | 'fuel') => Promise<void>;
  takePhoto: (type: 'odometer' | 'oil' | 'fuel') => Promise<void>;
  removePhoto: (type: 'odometer' | 'oil' | 'fuel') => void;

  reset: () => void;
}

const initialState = {
  odometerReading: '',
  odometerPhoto: null,
  additionalExceptions: '',
  checklist: [],
  tyres: [],
  trailerUsed: false,
  trailerChecklist: [],
  trailerTyres: [],
  fuelPhoto: null,
};

export const useInspectionStore = create<InspectionState>((set, get) => ({
  ...initialState,

  setOdometerReading: (value) => set({ odometerReading: value }),
  setOdometerPhoto: (photo) => set({ odometerPhoto: photo }),
  setAdditionalExceptions: (value) => set({ additionalExceptions: value }),
  setChecklist: (checklist) => set({ checklist }),
  setTyres: (tyres) => set({ tyres }),
  setTrailerUsed: (used) => set({ trailerUsed: used }),
  setTrailerChecklist: (checklist) => set({ trailerChecklist: checklist }),
  setTrailerTyres: (tyres) => set({ trailerTyres: tyres }),
  setFuelPhoto: (photo) => set({ fuelPhoto: photo }),

  toggleChecklistItem: (id) =>
    set((state) => ({
      checklist: state.checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    })),

  toggleTrailerChecklistItem: (id) =>
    set((state) => ({
      trailerChecklist: state.trailerChecklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    })),

  setItemValue: (id, value) =>
    set((state) => ({
      checklist: state.checklist.map((item) =>
        item.id === id ? { ...item, value } : item
      ),
    })),

  updateTyreData: (index, value) =>
    set((state) => {
      const newTyres = [...state.tyres];
      newTyres[index].depth = value;
      return { tyres: newTyres };
    }),

  updateTrailerTyreData: (index, value) =>
    set((state) => {
      const newTyres = [...state.trailerTyres];
      newTyres[index].depth = value;
      return { trailerTyres: newTyres };
    }),

  pickImage: async (type) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        throw new Error('Permission Required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'odometer') {
          set({ odometerPhoto: result.assets[0].base64 || null });
        } else if (type === 'fuel') {
          set({ fuelPhoto: result.assets[0].base64 || null });
        } else if (type === 'oil') {
          set((state) => ({
            checklist: state.checklist.map((item) =>
              item.id === '75' ? { ...item, photoBase64: result.assets[0].base64 } : item
            ),
          }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  },

  takePhoto: async (type) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        throw new Error('Permission Required');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'odometer') {
          set({ odometerPhoto: result.assets[0].base64 || null });
        } else if (type === 'fuel') {
          set({ fuelPhoto: result.assets[0].base64 || null });
        } else if (type === 'oil') {
          set((state) => ({
            checklist: state.checklist.map((item) =>
              item.id === '75' ? { ...item, photoBase64: result.assets[0].base64 } : item
            ),
          }));
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  },

  removePhoto: (type) => {
    if (type === 'odometer') {
      set({ odometerPhoto: null });
    } else if (type === 'fuel') {
      set({ fuelPhoto: null });
    } else if (type === 'oil') {
      set((state) => ({
        checklist: state.checklist.map((item) =>
          item.id === '75' ? { ...item, photoBase64: null } : item
        ),
      }));
    }
  },

  reset: () => set(initialState),
}));