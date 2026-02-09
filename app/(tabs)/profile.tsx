
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
  const { user, logout, assignedTask } = useAuth();

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
              source={require('@/assets/images/boundless.png')}
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
              <Text style={styles.infoValue}>{user?.name || 'Not provided'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="phone.fill" size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Username</Text>
              </View>
              <Text style={styles.infoValue}>{user?.username || 'Not provided'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="map.fill" size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Current Tour</Text>
              </View>
              <Text style={styles.infoValue}>
                {assignedTask?.tour?.tour_name || assignedTask?.tour?.tour_reference || 'No Active Tour'}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        {assignedTask?.vehicle && (
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
                <Text style={styles.infoValue}>
                  {assignedTask.vehicle.model} ({assignedTask.vehicle.licenceNumber})
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="speed" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Odometer</Text>
                </View>
                <Text style={styles.infoValue}>
                  {assignedTask.vehicle.odometer ? `${assignedTask.vehicle.odometer} km` : 'Not provided'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <IconSymbol name="build" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Service Due</Text>
                </View>
                <Text style={styles.infoValue}>{assignedTask.vehicle.nextService || 'Not provided'}</Text>
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
