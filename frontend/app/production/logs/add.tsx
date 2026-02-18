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

const SHIFTS = ['Morning', 'Afternoon', 'Night'];

export default function AddProductionLog() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_id: '',
    machine_id: '',
    shift: 'Morning',
    produced_quantity: '',
    wastage_quantity: '0',
    downtime_minutes: '0',
    notes: '',
  });

  useEffect(() => {
    fetchJobsAndMachines();
  }, []);

  const fetchJobsAndMachines = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const [jobsRes, machinesRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/machines`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setJobs(jobsRes.data.filter((j: any) => j.status === 'in_progress' || j.status === 'pending'));
      setMachines(machinesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.job_id || !formData.machine_id || !formData.produced_quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      await axios.post(
        `${API_URL}/api/production-logs`,
        {
          job_id: formData.job_id,
          machine_id: formData.machine_id,
          shift: formData.shift.toLowerCase(),
          produced_quantity: parseInt(formData.produced_quantity),
          wastage_quantity: parseInt(formData.wastage_quantity),
          downtime_minutes: parseInt(formData.downtime_minutes),
          notes: formData.notes || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Production logged successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error logging production:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log production');
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
        <Text style={styles.headerTitle}>Log Production</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Shift Selection</Text>
          <View style={styles.shiftRow}>
            {SHIFTS.map((shift) => (
              <TouchableOpacity
                key={shift}
                style={[
                  styles.shiftCard,
                  formData.shift === shift && styles.shiftCardActive,
                ]}
                onPress={() => setFormData({ ...formData, shift })}
              >
                <Ionicons
                  name="sunny"
                  size={24}
                  color={formData.shift === shift ? '#2563eb' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.shiftText,
                    formData.shift === shift && styles.shiftTextActive,
                  ]}
                >
                  {shift}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Job & Machine</Text>
          
          <Text style={styles.inputLabel}>Select Job *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {jobs.map((job: any) => (
              <TouchableOpacity
                key={job.job_id}
                style={[
                  styles.chip,
                  formData.job_id === job.job_id && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, job_id: job.job_id })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.job_id === job.job_id && styles.chipTextActive,
                  ]}
                >
                  {job.job_number}
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

          <Text style={styles.sectionTitle}>Production Details</Text>
          
          <InputField
            label="Produced Quantity *"
            placeholder="Number of units produced"
            value={formData.produced_quantity}
            onChangeText={(text) => setFormData({ ...formData, produced_quantity: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Wastage Quantity"
            placeholder="Number of rejected units"
            value={formData.wastage_quantity}
            onChangeText={(text) => setFormData({ ...formData, wastage_quantity: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Downtime (Minutes)"
            placeholder="Machine downtime in minutes"
            value={formData.downtime_minutes}
            onChangeText={(text) => setFormData({ ...formData, downtime_minutes: text })}
            keyboardType="numeric"
          />
          <InputField
            label="Notes"
            placeholder="Any additional notes (optional)"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Log Production</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputField({ label, placeholder, value, onChangeText, keyboardType = 'default', multiline = false }: any) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
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
  shiftRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shiftCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  shiftCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
  },
  shiftTextActive: {
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
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
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