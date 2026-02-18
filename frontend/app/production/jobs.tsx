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

interface JobCard {
  job_id: string;
  job_number: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  status: string;
  target_completion: string;
  created_at: string;
}

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchJobs = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const url = filter === 'all' 
        ? `${API_URL}/api/jobs`
        : `${API_URL}/api/jobs?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#2563eb';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Cards</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/production/jobs/add')}
        >
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filter === status && styles.filterChipActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No job cards found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/production/jobs/add')}
            >
              <Text style={styles.emptyButtonText}>Create First Job Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          jobs.map((job) => (
            <View key={job.job_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.jobNumber}>{job.job_number}</Text>
                  <Text style={styles.customerName}>{job.customer_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.jobDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="cube" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{job.product_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="layers" size={16} color="#64748b" />
                  <Text style={styles.detailText}>Quantity: {job.quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#64748b" />
                  <Text style={styles.detailText}>
                    Target: {format(new Date(job.target_completion), 'MMM dd, yyyy')}
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
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
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
  jobNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  customerName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  jobDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
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