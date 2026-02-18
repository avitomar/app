import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AddMaterial() {
  const router = useRouter();
  const [materialType, setMaterialType] = useState<'sheet' | 'reel'>('sheet');
  const [formData, setFormData] = useState({
    name: '',
    gsm: '',
    length_inch: '',
    width_inch: '',
    diameter_inch: '',
    width_reel_inch: '',
    quantity: '',
    rate_per_kg: '',
    reorder_level: '',
    supplier: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.gsm || !formData.quantity || !formData.rate_per_kg) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (materialType === 'sheet' && (!formData.length_inch || !formData.width_inch)) {
      Alert.alert('Error', 'Please enter sheet dimensions');
      return;
    }

    if (materialType === 'reel' && (!formData.diameter_inch || !formData.width_reel_inch)) {
      Alert.alert('Error', 'Please enter reel dimensions');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const payload = {
        name: formData.name,
        material_type: materialType,
        gsm: parseFloat(formData.gsm),
        quantity: parseFloat(formData.quantity),
        rate_per_kg: parseFloat(formData.rate_per_kg),
        reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : 100,
        supplier: formData.supplier || null,
        ...(materialType === 'sheet' && {
          length_inch: parseFloat(formData.length_inch),
          width_inch: parseFloat(formData.width_inch),
        }),
        ...(materialType === 'reel' && {
          diameter_inch: parseFloat(formData.diameter_inch),
          width_reel_inch: parseFloat(formData.width_reel_inch),
        }),
      };

      await axios.post(`${API_URL}/api/materials`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Material added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error adding material:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Raw Material</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Material Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                materialType === 'sheet' && styles.typeButtonActive,
              ]}
              onPress={() => setMaterialType('sheet')}
            >
              <Ionicons
                name="document"
                size={24}
                color={materialType === 'sheet' ? '#2563eb' : '#64748b'}
              />
              <Text
                style={[
                  styles.typeText,
                  materialType === 'sheet' && styles.typeTextActive,
                ]}
              >
                Sheet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                materialType === 'reel' && styles.typeButtonActive,
              ]}
              onPress={() => setMaterialType('reel')}
            >
              <Ionicons
                name="disc"
                size={24}
                color={materialType === 'reel' ? '#2563eb' : '#64748b'}
              />
              <Text
                style={[
                  styles.typeText,
                  materialType === 'reel' && styles.typeTextActive,
                ]}
              >
                Reel
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Basic Information</Text>
          <InputField
            label="Material Name *"
            placeholder="e.g., Maplitho Paper"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <InputField
            label="GSM (Grams per Square Meter) *"
            placeholder="e.g., 80"
            value={formData.gsm}
            onChangeText={(text) => setFormData({ ...formData, gsm: text })}
            keyboardType="numeric"
          />

          <Text style={styles.sectionTitle}>Dimensions</Text>
          {materialType === 'sheet' ? (
            <>
              <InputField
                label="Length (inches) *"
                placeholder="e.g., 25"
                value={formData.length_inch}
                onChangeText={(text) => setFormData({ ...formData, length_inch: text })}
                keyboardType="numeric"
              />
              <InputField
                label="Width (inches) *"
                placeholder="e.g., 35"
                value={formData.width_inch}
                onChangeText={(text) => setFormData({ ...formData, width_inch: text })}
                keyboardType="numeric"
              />
            </>
          ) : (
            <>
              <InputField
                label="Diameter (inches) *"
                placeholder="e.g., 36"
                value={formData.diameter_inch}
                onChangeText={(text) => setFormData({ ...formData, diameter_inch: text })}
                keyboardType="numeric"
              />
              <InputField
                label="Width (inches) *"
                placeholder="e.g., 24"
                value={formData.width_reel_inch}
                onChangeText={(text) => setFormData({ ...formData, width_reel_inch: text })}
                keyboardType="numeric"
              />
            </>
          )}

          <Text style={styles.sectionTitle}>Stock & Pricing</Text>
          <InputField
            label="Quantity *"
            placeholder={materialType === 'sheet' ? 'Number of sheets' : 'Number of reels'}
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Rate per Kg (₹) *"
            placeholder="e.g., 45.50"
            value={formData.rate_per_kg}
            onChangeText={(text) => setFormData({ ...formData, rate_per_kg: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Reorder Level"
            placeholder="Minimum quantity (default: 100)"
            value={formData.reorder_level}
            onChangeText={(text) => setFormData({ ...formData, reorder_level: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Supplier Name"
            placeholder="Optional"
            value={formData.supplier}
            onChangeText={(text) => setFormData({ ...formData, supplier: text })}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Material'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputField({ label, placeholder, value, onChangeText, keyboardType = 'default' }: any) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#2563eb',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});