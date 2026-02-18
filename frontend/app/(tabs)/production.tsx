import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Production() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = [
    {
      title: 'Raw Materials',
      description: 'Manage paper stock, GSM tracking',
      icon: 'cube',
      color: '#8b5cf6',
      route: '/production/materials',
    },
    {
      title: 'Machines',
      description: 'Track machines and status',
      icon: 'hardware-chip',
      color: '#f59e0b',
      route: '/production/machines',
    },
    {
      title: 'Job Cards',
      description: 'Production jobs and tracking',
      icon: 'document-text',
      color: '#2563eb',
      route: '/production/jobs',
    },
    {
      title: 'Production Logs',
      description: 'Shift-wise production records',
      icon: 'analytics',
      color: '#10b981',
      route: '/production/logs',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Production</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Production Management</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={32} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.quickMenu}>
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/production/materials/add');
              }}
            >
              <Ionicons name="cube" size={24} color="#8b5cf6" />
              <Text style={styles.quickMenuText}>Add Material</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/production/jobs/add');
              }}
            >
              <Ionicons name="document-text" size={24} color="#2563eb" />
              <Text style={styles.quickMenuText}>New Job Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/production/logs/add');
              }}
            >
              <Ionicons name="analytics" size={24} color="#10b981" />
              <Text style={styles.quickMenuText}>Log Production</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  quickMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  quickMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  quickMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 16,
  },
});