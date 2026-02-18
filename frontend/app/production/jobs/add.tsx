import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AddJob() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    product_name: '',
    quantity: '',
    material_id: '',
    machine_id: '',
    target_days: '7',
  });

  useEffect(() => {
    fetchMaterialsAndMachines();
  }, []);

  const fetchMaterialsAndMachines = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const [materialsRes, machinesRes] = await Promise.all([
        axios.get(`${API_URL}/api/materials`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/machines`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMaterials(materialsRes.data);
      setMachines(machinesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!formData.customer_name.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    if (!formData.product_name.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }
    if (!formData.material_id) {
      Alert.alert('Error', 'Please select a material');
      return;
    }
    if (!formData.machine_id) {
      Alert.alert('Error', 'Please select a machine');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + parseInt(formData.target_days || '7'));

      const payload = {
        customer_name: formData.customer_name.trim(),
        product_name: formData.product_name.trim(),
        quantity: parseInt(formData.quantity),
        material_id: formData.material_id,
        machine_id: formData.machine_id,
        target_completion: targetDate.toISOString(),
      };

      console.log('Creating job with payload:', payload);

      const response = await axios.post(
        `${API_URL}/api/jobs`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Job created successfully:', response.data);

      Alert.alert('Success', 'Job card created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating job:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to create job';
      Alert.alert('Error', errorMessage);
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
        <Text style={styles.headerTitle}>Create Job Card</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          
          <InputField
            label="Customer Name *"
            placeholder="Enter customer name"
            value={formData.customer_name}
            onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
          />
          
          <InputField
            label="Product Name *"
            placeholder="e.g., Notebook A4, Register"
            value={formData.product_name}
            onChangeText={(text) => setFormData({ ...formData, product_name: text })}
          />
          
          <InputField
            label="Quantity *"
            placeholder="Number of units"
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            keyboardType="numeric"
          />

          <Text style={styles.sectionTitle}>Production Setup</Text>
          
          <Text style={styles.inputLabel}>Select Material *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {materials.map((mat: any) => (
              <TouchableOpacity
                key={mat.material_id}
                style={[
                  styles.chip,
                  formData.material_id === mat.material_id && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, material_id: mat.material_id })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.material_id === mat.material_id && styles.chipTextActive,
                  ]}
                >
                  {mat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Select Machine *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {machines.map((mach: any) => (
              <TouchableOpacity
                key={mach.machine_id}
                style={[
                  styles.chip,
                  formData.machine_id === mach.machine_id && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, machine_id: mach.machine_id })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.machine_id === mach.machine_id && styles.chipTextActive,
                  ]}
                >
                  {mach.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <InputField
            label="Target Completion (Days)"
            placeholder="Number of days"
            value={formData.target_days}
            onChangeText={(text) => setFormData({ ...formData, target_days: text })}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Job Card</Text>
            )}
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
  chipScroll: {
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
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