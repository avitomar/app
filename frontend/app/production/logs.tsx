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
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ProductionLog {
  log_id: string;
  job_id: string;
  shift: string;
  produced_quantity: number;
  wastage_quantity: number;
  downtime_minutes: number;
  created_at: string;
}

export default function ProductionLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/production-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getShiftColor = (shift: string) => {
    switch (shift.toLowerCase()) {
      case 'morning': return '#f59e0b';
      case 'afternoon': return '#2563eb';
      case 'night': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const totalProduced = logs.reduce((sum, log) => sum + log.produced_quantity, 0);
  const totalWastage = logs.reduce((sum, log) => sum + log.wastage_quantity, 0);
  const avgDowntime = logs.length > 0 
    ? Math.round(logs.reduce((sum, log) => sum + log.downtime_minutes, 0) / logs.length)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Production Logs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/production/logs/add')}
        >
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {logs.length > 0 && (
        <View style={styles.statsRow}>
          <StatCard icon="cube" label="Produced" value={totalProduced.toString()} color="#10b981" />
          <StatCard icon="trash" label="Wastage" value={totalWastage.toString()} color="#ef4444" />
          <StatCard icon="time" label="Avg Downtime" value={`${avgDowntime}m`} color="#f59e0b" />
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No production logs yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/production/logs/add')}
            >
              <Text style={styles.emptyButtonText}>Log First Production</Text>
            </TouchableOpacity>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.log_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.shiftBadge, { backgroundColor: getShiftColor(log.shift) + '20' }]}>
                  <Ionicons name="sunny" size={16} color={getShiftColor(log.shift)} />
                  <Text style={[styles.shiftText, { color: getShiftColor(log.shift) }]}>
                    {log.shift.toUpperCase()} SHIFT
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {format(new Date(log.created_at), 'MMM dd, hh:mm a')}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{log.produced_quantity}</Text>
                  <Text style={styles.statLabel}>Produced</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#ef4444' }]}>{log.wastage_quantity}</Text>
                  <Text style={styles.statLabel}>Wastage</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#f59e0b' }]}>{log.downtime_minutes}m</Text>
                  <Text style={styles.statLabel}>Downtime</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={styles.topStatCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.topStatValue, { color }]}>{value}</Text>
      <Text style={styles.topStatLabel}>{label}</Text>
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
  topStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  topStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  topStatLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
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