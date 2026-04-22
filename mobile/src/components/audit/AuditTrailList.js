import { FlatList, ActivityIndicator } from "react-native";
import AuditEntryItem from "./AuditEntryItem";

export default function AuditTrailList({
  logs,
  showsVerticalScrollIndicator = false,
  onEndReached,
  loadingMore = false,
  loading = false,
  onRefresh,
}) {
  const renderItem = ({ item }) => <AuditEntryItem log={item} />;

  return (
    <FlatList
      data={logs}
      renderItem={renderItem}
      keyExtractor={(item) =>
        item.id ? item.id.toString() : Math.random().toString()
      }
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 0, paddingVertical: 12 }}
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={{ margin: 12 }} color="#0ea5e9" /> : null
      }
      refreshing={loading && logs.length === 0}
      onRefresh={onRefresh}
    />
  );
}
