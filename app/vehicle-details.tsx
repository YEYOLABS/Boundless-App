import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function VehicleDetailsScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Vehicle Details', headerShown: true }} />
            <Text style={styles.text}>Vehicle Details coming soon...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    text: {
        fontSize: 16,
        color: colors.text,
    },
});
