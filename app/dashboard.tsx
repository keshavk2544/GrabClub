import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import VendorOrderRinger from './components/VendorOrderRinger';

export default function DashboardScreen() {
  const { vendorId, vendorName } = useLocalSearchParams();

  if (typeof vendorId !== 'string') {
    return (
        <View style={styles.container}>
            <Text style={styles.errorText}>Error: Vendor ID not found.</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {vendorName || 'Vendor'}</Text>
      <VendorOrderRinger vendorId={vendorId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});
