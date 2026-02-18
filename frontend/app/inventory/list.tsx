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

interface InventoryItem {
  inventory_id: string;
  product_name: string;
  sku: string;
  batch_number: string;
  quantity: number;
  unit_weight_kg: number;
  unit_cost: number;
  is_finished: boolean;
}

export default function InventoryListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'finished' | 'semi'>('all');

  const fetchInventory = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      let url = `${API_URL}/api/inventory`;
      if (filter === 'finished') url += '?is_finished=true';
      if (filter === 'semi') url += '?is_finished=false';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  const finishedCount = items.filter(item => item.is_finished).length;
  const semiFinishedCount = items.filter(item => !item.is_finished).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/inventory/add')}
        >
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All ({items.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'finished' && styles.filterButtonActive]}
          onPress={() => setFilter('finished')}
        >
          <Text style={[styles.filterButtonText, filter === 'finished' && styles.filterButtonTextActive]}>
            Finished ({finishedCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'semi' && styles.filterButtonActive]}
          onPress={() => setFilter('semi')}
        >
          <Text style={[styles.filterButtonText, filter === 'semi' && styles.filterButtonTextActive]}>
            Semi-Finished ({semiFinishedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {items.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalQuantity}</Text>
            <Text style={styles.statLabel}>Total Units</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>₹{(totalValue / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="archive-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No inventory items found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/inventory/add')}
            >
              <Text style={styles.emptyButtonText}>Add First Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.inventory_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.productInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: item.is_finished ? '#10b98120' : '#f59e0b20' }]}>
                    <Ionicons 
                      name={item.is_finished ? "checkmark-circle" : "timer"} 
                      size={32} 
                      color={item.is_finished ? '#10b981' : '#f59e0b'} 
                    />
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{item.product_name}</Text>
                    <Text style={styles.sku}>SKU: {item.sku}</Text>
                    <Text style={styles.batch}>Batch: {item.batch_number}</Text>
                  </View>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: item.is_finished ? '#dcfce720' : '#fef3c720' }]}>
                  <Text style={[styles.typeText, { color: item.is_finished ? '#15803d' : '#92400e' }]}>
                    {item.is_finished ? 'FINISHED' : 'SEMI'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>{item.quantity} units</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Unit Weight</Text>
                  <Text style={styles.detailValue}>{item.unit_weight_kg.toFixed(2)} kg</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Unit Cost</Text>
                  <Text style={styles.detailValue}>₹{item.unit_cost.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Value</Text>
                  <Text style={[styles.detailValue, { color: '#10b981', fontWeight: '600' }]}>
                    ₹{(item.quantity * item.unit_cost).toLocaleString()}
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
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    marginLeft: 16,
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  sku: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  batch: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
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