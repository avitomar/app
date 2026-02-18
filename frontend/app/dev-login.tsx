import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function DevLogin() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      // Use the test session token created in MongoDB
      const testToken = 'test_session_1771415663796';
      
      // Store token
      await AsyncStorage.setItem('session_token', testToken);
      
      // Set test user
      const testUser = {
        user_id: 'user_testfactory1',
        email: 'factory.admin@test.com',
        name: 'Factory Admin',
        picture: null,
        role: 'owner',
        created_at: new Date().toISOString(),
      };
      
      setUser(testUser);
      
      Alert.alert('Success', 'Logged in as Factory Admin (Test User)', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Dev login error:', error);
      Alert.alert('Error', 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="warning" size={64} color="#f59e0b" />
        <Text style={styles.title}>Development Mode</Text>
        <Text style={styles.subtitle}>OAuth service is temporarily unavailable</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Test User Details:</Text>
          <Text style={styles.infoText}>• Email: factory.admin@test.com</Text>
          <Text style={styles.infoText}>• Role: Owner (Full Access)</Text>
          <Text style={styles.infoText}>• Session: Valid for 7 days</Text>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleDevLogin}
          disabled={loading}
        >
          <Ionicons name="log-in" size={24} color="#fff" />
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Login as Test User'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fffbeb',
    padding: 20,
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#78350f',
    marginBottom: 6,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 16,
  },
});
