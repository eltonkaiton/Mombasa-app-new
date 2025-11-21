import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CHAT_MESSAGES_URL = 'http://192.168.100.13:5000/api/chat/staff-messages';

const OperatingStaffMessagesScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [searchQuery, messages, filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('staffToken');
      
      const response = await axios.get(CHAT_MESSAGES_URL, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('API Response:', response.data);
      
      const customerMessages = response.data.messages || [];
      
      // The API already provides the 'responded' status, so we can use it directly
      const processedMessages = customerMessages.map(msg => ({
        ...msg,
        read: msg.responded // Mark as read if already responded
      }));
      
      setMessages(processedMessages);
      
    } catch (error) {
      console.error('Error fetching chat messages:', error.message);
      
      // Fallback: Show sample customer inquiries
      const sampleMessages = [
        {
          _id: '68ee1e973e6f5753e12d074b',
          userName: 'David Kamau',
          userEmail: 'kaje@gmail.com',
          message: 'Hello, I need help with my booking for next week. Can you assist me with changing the date?',
          timestamp: '2025-10-14T09:57:43.060+00:00',
          responded: false,
          read: false
        },
        {
          _id: '68ee1e973e6f5753e12d074c',
          userName: 'Sarah Johnson',
          userEmail: 'sarah@example.com',
          message: 'I need to change my booking date for next week',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          responded: true,
          read: true
        },
        {
          _id: '68ee1e973e6f5753e12d074d',
          userName: 'Mike Chen',
          userEmail: 'mike.chen@email.com',
          message: 'What are the ferry schedules for the weekend?',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          responded: false,
          read: false
        },
        {
          _id: '68ee1e973e6f5753e12d074e',
          userName: 'Emily Wangari',
          userEmail: 'emily.w@company.com',
          message: 'Thank you for your help with my previous booking!',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          responded: true,
          read: true
        }
      ];
      
      setMessages(sampleMessages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];

    // Apply status filter
    if (filter === 'unread') {
      filtered = filtered.filter(msg => !msg.responded);
    } else if (filter === 'read') {
      filtered = filtered.filter(msg => msg.responded);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(msg =>
        msg.userName?.toLowerCase().includes(query) ||
        msg.userEmail?.toLowerCase().includes(query) ||
        msg.message?.toLowerCase().includes(query)
      );
    }

    setFilteredMessages(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const navigateToChat = (customer) => {
    navigation.navigate('OperatingStaffChat', { 
      customer: {
        userName: customer.userName,
        userEmail: customer.userEmail,
        initialMessage: customer.message,
        timestamp: customer.timestamp
      }
    });
  };

  const markAsRead = async (messageId) => {
    // Update local state to mark as read
    setMessages(prev => 
      prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderMessageItem = ({ item, index }) => {
    const isUnread = !item.responded;
    
    return (
      <TouchableOpacity
        style={[
          styles.messageCard,
          isUnread && styles.unreadMessageCard
        ]}
        onPress={() => {
          markAsRead(item._id);
          navigateToChat(item);
        }}
      >
        <View style={styles.messageHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.userName?.charAt(0)?.toUpperCase() || 'C'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.userName || 'Customer'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {item.userEmail || 'No email provided'}
              </Text>
            </View>
          </View>
          <View style={styles.messageMeta}>
            <Text style={styles.timestamp}>
              {formatTime(item.timestamp)}
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>New</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.messagePreview} numberOfLines={2}>
          {item.message || 'No message content'}
        </Text>

        <View style={styles.messageFooter}>
          <View style={[
            styles.statusBadge,
            item.responded ? styles.respondedBadge : styles.pendingBadge
          ]}>
            <Ionicons 
              name={item.responded ? "checkmark-done" : "time"} 
              size={14} 
              color={item.responded ? "#28a745" : "#dc3545"} 
            />
            <Text style={[
              styles.statusText,
              item.responded ? styles.respondedText : styles.pendingText
            ]}>
              {item.responded ? 'Responded' : 'Awaiting Response'}
            </Text>
          </View>
          
          <View style={styles.actionIndicator}>
            <Ionicons name="chevron-forward" size={16} color="#6c757d" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'all' && styles.filterButtonActive
        ]}
        onPress={() => setFilter('all')}
      >
        <Text style={[
          styles.filterButtonText,
          filter === 'all' && styles.filterButtonTextActive
        ]}>
          All Messages
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'unread' && styles.filterButtonActive
        ]}
        onPress={() => setFilter('unread')}
      >
        <View style={styles.filterBadge}>
          <Text style={[
            styles.filterButtonText,
            filter === 'unread' && styles.filterButtonTextActive
          ]}>
            Unread
          </Text>
          {messages.filter(msg => !msg.responded).length > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>
                {messages.filter(msg => !msg.responded).length}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'read' && styles.filterButtonActive
        ]}
        onPress={() => setFilter('read')}
      >
        <Text style={[
          styles.filterButtonText,
          filter === 'read' && styles.filterButtonTextActive
        ]}>
          Responded
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search messages by name, email, or content..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1F2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Messages</Text>
        <TouchableOpacity 
          onPress={onRefresh} 
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={24} color="#1A1F2E" />
        </TouchableOpacity>
      </View>

      {renderSearchBar()}
      {renderFilterButtons()}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{messages.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.unreadStat]}>
            {messages.filter(msg => !msg.responded).length}
          </Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.respondedStat]}>
            {messages.filter(msg => msg.responded).length}
          </Text>
          <Text style={styles.statLabel}>Responded</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : filteredMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={searchQuery || filter !== 'all' ? "search-outline" : "chatbubble-outline"} 
            size={64} 
            color="#ccc" 
          />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No messages found' : 
             filter === 'unread' ? 'No unread messages' :
             filter === 'read' ? 'No responded messages' : 'No messages yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search terms' :
             filter === 'unread' ? 'All messages have been responded to' :
             'Customer messages will appear here when they contact operation staff'}
          </Text>
          {(searchQuery || filter !== 'all') && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setFilter('all');
              }}
            >
              <Text style={styles.clearFiltersText}>Show All Messages</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item._id || item.timestamp}
          renderItem={renderMessageItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007bff']}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F2E',
  },
  refreshButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCountBadge: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  unreadCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  unreadStat: {
    color: '#dc3545',
  },
  respondedStat: {
    color: '#28a745',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  messageCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unreadMessageCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    backgroundColor: '#f8fbff',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1F2E',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#6c757d',
  },
  messageMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messagePreview: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingBadge: {
    backgroundColor: '#fff5f5',
  },
  respondedBadge: {
    backgroundColor: '#f0fff4',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingText: {
    color: '#dc3545',
  },
  respondedText: {
    color: '#28a745',
  },
  actionIndicator: {
    padding: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default OperatingStaffMessagesScreen;