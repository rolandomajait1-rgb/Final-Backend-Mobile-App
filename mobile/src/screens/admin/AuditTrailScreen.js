import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import BottomNavigation from "../../components/common/BottomNavigation";
import { AuditTrailList } from "../../components/audit";
import { AuditTrailSkeleton } from "../../components/common";
import HomeHeader from "../homepage/HomeHeader";
import { fetchAuditLogs } from "../../api/services/auditService";
import { showAuditEventToast } from "../../utils/toastNotification";

export default function AuditTrailScreen({ navigation }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const skipInitialSearchEffectRef = useRef(true);

  const fetchLogs = useCallback(async (pageNum = 1, query = "") => {
    const normalizedQuery = query.trim();
    const requestId = ++requestIdRef.current;

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setError(null);
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetchAuditLogs(pageNum, 50, normalizedQuery, {
        signal: abortControllerRef.current.signal
      });

      // Validate that this is still the current request
      if (requestId !== requestIdRef.current) {
        return;
      }

      const logs = res.data?.data || [];
      const currentPage = res.data?.current_page ?? pageNum;
      const lastPage = res.data?.last_page ?? currentPage;

      setAuditLogs((prev) => (pageNum === 1 ? logs : [...prev, ...logs]));
      setPage(currentPage);
      setHasMore(currentPage < lastPage);
      
      // Show toast notification for audit logs loaded
      if (pageNum === 1 && logs.length > 0) {
        showAuditEventToast({
          action: 'audit_logs_loaded',
          status: 'success',
          message: `Loaded ${logs.length} audit logs`
        });
      }
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }

      // Validate that this is still the current request
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Error fetching audit logs:", err);
      setError("Failed to load audit logs. Please try again.");
      showAuditEventToast({
        action: 'audit_logs_load',
        status: 'error',
        message: 'Failed to load audit logs'
      });

      if (pageNum === 1) {
        setAuditLogs([]);
        setHasMore(true);
      }
    } finally {
      // Only update loading state if this is still the current request
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchLogs(1, "");

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLogs]);

  useEffect(() => {
    if (skipInitialSearchEffectRef.current) {
      skipInitialSearchEffectRef.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchLogs(1, searchQuery);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [fetchLogs, searchQuery]);

  const handleRetry = () => {
    fetchLogs(1, searchQuery);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar hidden={true} />
      <View className="flex-shrink-0 bg-white">
        <HomeHeader 
          navigation={navigation} 
          enableSearch={true}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          onGridPress={() => navigation.navigate('AdminScreen')}
        />
      </View>

      <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
        <TouchableOpacity 
          onPress={handleBackPress} 
          className="w-10 h-10 rounded-full justify-center items-center mr-4 bg-[#075985]"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-gray-900 tracking-tight">Audit Trail</Text>
      </View>

      <View className="flex-1 bg-gray-50">
        {loading && auditLogs.length === 0 ? (
          <AuditTrailSkeleton />
        ) : error && auditLogs.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text className="text-red-500 mt-4 text-center text-[15px]">{error}</Text>
            <TouchableOpacity onPress={handleRetry} className="mt-5 bg-[#0ea5e9] px-8 py-3 rounded-xl">
              <Text className="text-white font-semibold text-[15px]">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : auditLogs.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="clipboard-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-center text-[15px]">
              {searchQuery.trim()
                ? `No audit logs found for ${searchQuery.trim()}`
                : "No audit logs found"}
            </Text>
          </View>
        ) : (
          <AuditTrailList
            logs={auditLogs}
            onEndReached={() => {
              if (hasMore && !loadingMore) {
                fetchLogs(page + 1, searchQuery);
              }
            }}
            loadingMore={loadingMore}
            loading={loading}
            onRefresh={() => fetchLogs(1, searchQuery)}
          />
        )}
      </View>

      <View className="flex-shrink-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    </View>
  );
}
