import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DashboardStats {
  total_production_today: number;
  pending_orders: number;
  machine_utilization_percent: number;
  paper_stock_tons: number;
  daily_revenue: number;
  active_jobs: number;
  low_stock_materials: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.role}>{user?.role?.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#1e293b" />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Production Today"
          value={stats?.total_production_today.toString() || '0'}
          unit="units"
          icon="construct"
          color="#2563eb"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pending_orders.toString() || '0'}
          icon="cart"
          color="#f59e0b"
        />
        <StatCard
          title="Machine Utilization"
          value={stats?.machine_utilization_percent.toString() || '0'}
          unit="%"
          icon="speedometer"
          color="#10b981"
        />
        <StatCard
          title="Paper Stock"
          value={stats?.paper_stock_tons.toFixed(2) || '0'}
          unit="tons"
          icon="cube"
          color="#8b5cf6"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        
        <InfoRow
          icon="cash"
          label="Daily Revenue"
          value={`₹${stats?.daily_revenue.toLocaleString() || '0'}`}
          color="#10b981"
        />
        <InfoRow
          icon="play-circle"
          label="Active Jobs"
          value={stats?.active_jobs.toString() || '0'}
          color="#2563eb"
        />
        <InfoRow
          icon="alert-circle"
          label="Low Stock Materials"
          value={stats?.low_stock_materials.toString() || '0'}
          color="#ef4444"
        />
      </View>

      {stats && stats.low_stock_materials > 0 && (
        <View style={styles.alertBox}>
          <Ionicons name="warning" size={24} color="#f59e0b" />
          <View style={styles.alertText}>
            <Text style={styles.alertTitle}>Low Stock Alert</Text>
            <Text style={styles.alertMessage}>
              {stats.low_stock_materials} material(s) below reorder level
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ title, value, unit, icon, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={32} color={color} />
      <Text style={styles.statValue}>
        {value}
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, color }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
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
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  role: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statUnit: {
    fontSize: 16,
    color: '#64748b',
  },
  statTitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: '#475569',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  alertMessage: {
    fontSize: 14,
    color: '#78350f',
    marginTop: 4,
  },
});