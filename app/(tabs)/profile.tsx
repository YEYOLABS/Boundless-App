
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as api from '@/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Load driver info
      const driverResponse = await api.getDriver();
      if (driverResponse.success) {
        setDriverInfo(driverResponse.data);
      }

      // Load vehicle info
      const vehicleResponse = await api.getVehicle();
      if (vehicleResponse.success) {
        setVehicleInfo(vehicleResponse.data);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const profileSections = [
    {
      title: 'Account Information',
      items: [
        { icon: 'person.fill', label: 'Name', value: user?.name || 'Demo Driver' },
        { icon: 'envelope.fill', label: 'Email', value: user?.username || 'N/A' },
        { icon: 'person.2.fill', label: 'Role', value: 'Driver' },
      ],
    },
    {
      title: 'Statistics',
      items: [
        { icon: 'checkmark.circle.fill', label: 'Completed Checks', value: '24' },
        { icon: 'map.fill', label: 'Total Distance', value: '3,450 km' },
        { icon: 'calendar', label: 'Days Active', value: '12' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('@/assets/images/771ae94d-a623-49aa-96cb-cc81b395ba89.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.userName}>{user?.name || 'Demo Driver'}</Text>
          <Text style={styles.userEmail}>{user?.username}</Text>
        </View>

        {profileSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLeft}>
                      <View style={styles.iconContainer}>
                        <IconSymbol
                          name={item.icon as any}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Driver Information */}
        {driverInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            <View style={styles.sectionCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="person.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Name</Text>
                </View>
                <Text style={styles.infoValue}>{driverInfo.name || 'Not provided'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="phone.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Phone</Text>
                </View>
                <Text style={styles.infoValue}>{driverInfo.phone || 'Not provided'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="map.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Tour</Text>
                </View>
                <Text style={styles.infoValue}>{driverInfo.currentTour || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Vehicle Information */}
        {vehicleInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <View style={styles.sectionCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="directions-car" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Vehicle</Text>
                </View>
                <Text style={styles.infoValue}>{vehicleInfo.registration || vehicleInfo.id || 'Not provided'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="speed" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Odometer</Text>
                </View>
                <Text style={styles.infoValue}>{vehicleInfo.mileage ? `${vehicleInfo.mileage} km` : 'Not provided'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="build" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Service Due</Text>
                </View>
                <Text style={styles.infoValue}>{vehicleInfo.nextService || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.infoLeft}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="bell.fill" size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Notifications</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.infoLeft}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="lock.fill" size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Privacy</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.infoLeft}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Help & Support</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <IconSymbol name='lock' size={20} color={colors.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Boundless Driver App v1.0.0</Text>
          <Text style={styles.footerText}>© 2024 Boundless Transport</Text>
        </View>
      </ScrollView>
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
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
    padding: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
