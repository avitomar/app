import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const redirectUrl = Constants.expoConfig?.hostUri 
        ? `https://${Constants.expoConfig.hostUri.split(':')[0]}/(tabs)`
        : 'exp://localhost:8081/(tabs)';
      
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="document-text" size={80} color="#2563eb" />
        <Text style={styles.title}>Paper Factory Manager</Text>
        <Text style={styles.subtitle}>Manage Production, Inventory & Sales</Text>
        
        <View style={styles.features}>
          <FeatureItem icon="cube" text="Raw Material Tracking" />
          <FeatureItem icon="construct" text="Production Management" />
          <FeatureItem icon="archive" text="Inventory Control" />
          <FeatureItem icon="cart" text="Sales & Orders" />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleGoogleLogin}>
          <Ionicons name="logo-google" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.loginButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
        
        <Text style={styles.note}>For Paper & Stationery Manufacturing Factories</Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color="#2563eb" />
      <Text style={styles.featureText}>{text}</Text>
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
  features: {
    marginTop: 40,
    marginBottom: 40,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#475569',
    marginLeft: 12,
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
  buttonIcon: {
    marginRight: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    marginTop: 24,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});