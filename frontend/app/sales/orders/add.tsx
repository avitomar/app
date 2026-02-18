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

interface OrderItem {
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function AddOrder() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { product_name: '', quantity: 0, rate: 0, amount: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 0, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length > 0 ? newItems : [{ product_name: '', quantity: 0, rate: 0, amount: 0 }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const newItems = [...items];
    if (field === 'product_name') {
      newItems[index][field] = value;
    } else {
      const numValue = parseFloat(value) || 0;
      newItems[index][field] = numValue as any;
      if (field === 'quantity' || field === 'rate') {
        newItems[index].amount = newItems[index].quantity * newItems[index].rate;
      }
    }
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    const validItems = items.filter(item => item.product_name && item.quantity > 0 && item.rate > 0);
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one valid item');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      await axios.post(
        `${API_URL}/api/orders`,
        {
          customer_id: selectedCustomerId,
          items: validItems,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Order created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, gst, total } = calculateTotals();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Select Customer *</Text>
          {customers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyBoxText}>No customers available. Please add customers first.</Text>
              <TouchableOpacity
                style={styles.emptyBoxButton}
                onPress={() => router.push('/sales/customers/add')}
              >
                <Text style={styles.emptyBoxButtonText}>Add Customer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {customers.map((customer: any) => (
                <TouchableOpacity
                  key={customer.customer_id}
                  style={[
                    styles.chip,
                    selectedCustomerId === customer.customer_id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedCustomerId(customer.customer_id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCustomerId === customer.customer_id && styles.chipTextActive,
                    ]}
                  >
                    {customer.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNumber}>Item {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Ionicons name="trash" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={item.product_name}
                onChangeText={(text) => updateItem(index, 'product_name', text)}
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.itemRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={item.quantity > 0 ? item.quantity.toString() : ''}
                    onChangeText={(text) => updateItem(index, 'quantity', text)}
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Rate (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={item.rate > 0 ? item.rate.toString() : ''}
                    onChangeText={(text) => updateItem(index, 'rate', text)}
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount:</Text>
                <Text style={styles.amountValue}>₹{item.amount.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
            <Ionicons name="add-circle" size={24} color="#2563eb" />
            <Text style={styles.addItemText}>Add Another Item</Text>
          </TouchableOpacity>

          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (18%):</Text>
              <Text style={styles.totalValue}>₹{gst.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Order</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dbeafe',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  totalsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  emptyBox: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 20,
  },
  emptyBoxText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 12,
  },
  emptyBoxButton: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  emptyBoxButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});