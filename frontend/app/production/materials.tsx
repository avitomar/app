import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface RawMaterial {
  material_id: string;
  name: string;
  material_type: string;
  gsm: number;
  quantity: number;
  weight_kg: number;
  rate_per_kg: number;
  reorder_level: number;
}

export default function MaterialsScreen() {
  const router = useRouter();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMaterials = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (materialId: string, materialName: string) => {
    Alert.alert(
      'Delete Material',
      `Are you sure you want to delete "${materialName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('session_token');
              await axios.delete(`${API_URL}/api/materials/${materialId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Material deleted successfully');
              fetchMaterials(); // Refresh the list
            } catch (error: any) {
              console.error('Error deleting material:', error);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete material');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterials();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Raw Materials</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/production/materials/add')}
        >
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {materials.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No materials added yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/production/materials/add')}
            >
              <Text style={styles.emptyButtonText}>Add First Material</Text>
            </TouchableOpacity>
          </View>
        ) : (
          materials.map((material) => (
            <View key={material.material_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialType}>
                    {material.material_type.toUpperCase()} | GSM: {material.gsm}
                  </Text>
                </View>
                <View
                  style={[
                    styles.stockBadge,
                    material.quantity < material.reorder_level && styles.lowStockBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.stockText,
                      material.quantity < material.reorder_level && styles.lowStockText,
                    ]}
                  >
                    {material.quantity.toFixed(0)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsRow}>
                <DetailItem label="Weight" value={`${material.weight_kg.toFixed(2)} kg`} />
                <DetailItem
                  label="Rate"
                  value={`₹${material.rate_per_kg.toFixed(2)}/kg`}
                />
              </View>

              <View style={styles.detailsRow}>
                <DetailItem
                  label="Total Value"
                  value={`₹${(material.weight_kg * material.rate_per_kg).toFixed(2)}`}
                />
                <DetailItem
                  label="Reorder At"
                  value={material.reorder_level.toString()}
                />
              </View>

              {material.quantity < material.reorder_level && (
                <View style={styles.alertBanner}>
                  <Ionicons name="warning" size={16} color="#f59e0b" />
                  <Text style={styles.alertText}>Below reorder level</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(material.material_id, material.name)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  materialName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  materialType: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  stockBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lowStockBadge: {
    backgroundColor: '#fef3c7',
  },
  stockText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  lowStockText: {
    color: '#92400e',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  alertText: {
    fontSize: 13,
    color: '#92400e',
    marginLeft: 8,
    fontWeight: '500',
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