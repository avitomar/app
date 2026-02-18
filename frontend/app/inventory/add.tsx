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

export default function AddInventoryItem() {
  const router = useRouter();
  const [itemType, setItemType] = useState<'finished' | 'semi'>('finished');
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    batch_number: '',
    quantity: '',
    unit_weight_kg: '',
    unit_cost: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.product_name || !formData.sku || !formData.batch_number || 
        !formData.quantity || !formData.unit_weight_kg || !formData.unit_cost) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      await axios.post(
        `${API_URL}/api/inventory`,
        {
          product_name: formData.product_name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          batch_number: formData.batch_number.trim(),
          quantity: parseInt(formData.quantity),
          unit_weight_kg: parseFloat(formData.unit_weight_kg),
          unit_cost: parseFloat(formData.unit_cost),
          is_finished: itemType === 'finished',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Inventory item added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add inventory item');
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
        <Text style={styles.headerTitle}>Add Inventory Item</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Item Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                itemType === 'finished' && styles.typeCardActive,
              ]}
              onPress={() => setItemType('finished')}
            >
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={itemType === 'finished' ? '#10b981' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.typeText,
                  itemType === 'finished' && styles.typeTextActive,
                ]}
              >
                Finished Goods
              </Text>
              <Text style={styles.typeDescription}>Ready for sale</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeCard,
                itemType === 'semi' && styles.typeCardActive,
              ]}
              onPress={() => setItemType('semi')}
            >
              <Ionicons
                name="timer"
                size={32}
                color={itemType === 'semi' ? '#f59e0b' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.typeText,
                  itemType === 'semi' && styles.typeTextActive,
                ]}
              >
                Semi-Finished
              </Text>
              <Text style={styles.typeDescription}>Work in progress</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Product Details</Text>

          <InputField
            label="Product Name *"
            placeholder="e.g., A4 Notebook 200 Pages"
            value={formData.product_name}
            onChangeText={(text) => setFormData({ ...formData, product_name: text })}
          />
          <InputField
            label="SKU Code *"
            placeholder="e.g., NB-A4-200"
            value={formData.sku}
            onChangeText={(text) => setFormData({ ...formData, sku: text.toUpperCase() })}
          />
          <InputField
            label="Batch Number *"
            placeholder="e.g., BATCH-2026-001"
            value={formData.batch_number}
            onChangeText={(text) => setFormData({ ...formData, batch_number: text })}
          />

          <Text style={styles.sectionTitle}>Quantity & Pricing</Text>

          <InputField
            label="Quantity *"
            placeholder="Number of units"
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Unit Weight (kg) *"
            placeholder="Weight per unit"
            value={formData.unit_weight_kg}
            onChangeText={(text) => setFormData({ ...formData, unit_weight_kg: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Unit Cost (₹) *"
            placeholder="Cost per unit"
            value={formData.unit_cost}
            onChangeText={(text) => setFormData({ ...formData, unit_cost: text })}
            keyboardType="numeric"
          />

          {formData.quantity && formData.unit_cost && (
            <View style={styles.calculatedCard}>
              <Text style={styles.calculatedLabel}>Total Inventory Value</Text>
              <Text style={styles.calculatedValue}>
                ₹{(parseInt(formData.quantity || '0') * parseFloat(formData.unit_cost || '0')).toLocaleString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add to Inventory'}
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
    marginBottom: 16,
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  typeCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  typeTextActive: {
    color: '#15803d',
  },
  typeDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
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
  calculatedCard: {
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  calculatedLabel: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },
  calculatedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
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