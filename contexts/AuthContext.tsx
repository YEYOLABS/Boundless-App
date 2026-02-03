
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  name: string;
  organisationId: string;
  passportNumber: string;
  pdpExpiry: string;
  pdpNumber: string;
  role: string;
  token: string;
  uid: string;
  username: string;
}

interface Vehicle {
  id: string;
  status: string;
  licenceNumber: string;
  createdAt: string;
  odometer: number;
  currentDriverName: string;
  trailerLicence: string | null;
  trailerId: string | null;
  assignedByName: string;
  organisationId: string;
  assignedById: string;
  modelYear: number;
  nextService: string;
  updatedAt: string;
  createdBy: string;
  currentDriverId: string;
  trailerModel: string | null;
  model: string;
  lastServiced: string;
}

interface Tour {
  id: string;
  endDate: string;
  createdAt: string;
  startDate: string;
  driverId: string | null;
  itinerary: string;
  trailer_required: boolean;
  tour_reference: string;
  organisationId: string;
  tour_name: string;
  supplier: string;
  updatedAt: string;
  vehicleId: string;
  status: string;
  notes: string;
  pax: number | null;
  tourId: string;
  instructions: string;
  estimated_km: number;
  createdBy: string;
}

interface Float {
  id: string;
  message: string | null;
  tourId: string;
  issuedBy: string;
  remainingAmount: number;
  createdAt: string;
  organisationId: string;
  originalAmount: number;
  updatedAt: string;
  active: boolean;
  driverId: string;
}

interface AssignedTask {
  vehicle: Vehicle | null;
  tour: Tour | null;
  float: Float | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  assignedTask: AssignedTask | null;
  setAssignedTask: (task: AssignedTask | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedTask, setAssignedTask] = useState<AssignedTask | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        console.log(userData)
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('[AuthContext] User loaded from storage:', parsedUser.username || parsedUser.name);
      } else {
        console.log('[AuthContext] No user found in storage');
      }
    } catch (error) {
      console.error('[AuthContext] Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out user');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    }
  };

  useEffect(() => {
    console.log(user)
  },[])
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        setUser,
        logout,
        isAuthenticated: !!user,
        assignedTask,
        setAssignedTask,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
