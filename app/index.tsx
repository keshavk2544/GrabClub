import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { firestore } from './firebase';

export default function LoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'Please enter both User ID and Password.');
      return;
    }

    try {
      const vendorsRef = firestore.collection('vendors');
      const snapshot = await vendorsRef
        .where('userId', '==', userId)
        .where('password', '==', password)
        .get();

      if (snapshot.empty) {
        Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
        return;
      }

      const vendorDoc = snapshot.docs[0];
      const vendor = vendorDoc.data();

      console.log(`Successfully logged in as ${vendor.name}`);

      // Navigate to the dashboard, passing vendor details as params
      router.push({
        pathname: '/dashboard',
        params: { vendorId: vendorDoc.id, vendorName: vendor.name },
      });

    } catch (error) {
      console.error("Login Error: ", error);
      Alert.alert('Error', 'An error occurred during login.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrabClub for Vendors</Text>
      <TextInput
        style={styles.input}
        placeholder="User ID"
        value={userId}
        onChangeText={setUserId}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
