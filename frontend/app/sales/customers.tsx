import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Customer {
  customer_id: string;
  name: string;
  phone: string;
  gstin?: string;
  credit_limit: number;
  outstanding: number;
}

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const totalCreditLimit = customers.reduce((sum, c) => sum + c.credit_limit, 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/sales/customers/add')}
        >
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {customers.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{customers.length}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#2563eb' }]}>₹{(totalCreditLimit / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Credit Limit</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>₹{(totalOutstanding / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {customers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No customers added yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/sales/customers/add')}
            >
              <Text style={styles.emptyButtonText}>Add First Customer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          customers.map((customer) => (
            <View key={customer.customer_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={24} color="#2563eb" />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                    {customer.gstin && (
                      <Text style={styles.customerGstin}>GSTIN: {customer.gstin}</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.financialRow}>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Credit Limit</Text>
                  <Text style={styles.financialValue}>₹{customer.credit_limit.toLocaleString()}</Text>
                </View>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Outstanding</Text>
                  <Text style={[styles.financialValue, { color: customer.outstanding > 0 ? '#ef4444' : '#10b981' }]}>
                    ₹{customer.outstanding.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerDetails: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  customerGstin: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  financialItem: {
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});