import React from "react";
import { View, Text } from "react-native";

export default function AuditEntryItem({ log }) {
  const getStatusInfo = (action) => {
    const lowerAction = action?.toLowerCase() || "";

    // Green - Published / Created / Added / New (Only if NOT a draft)
    if (
      (lowerAction.includes("publish") || 
       lowerAction.includes("create") || 
       lowerAction.includes("add") || 
       lowerAction.includes("new")) &&
      !lowerAction.includes("draft")
    ) {
      return { label: "Published", color: "#10b981" }; // Emerald-500
    }

    // Amber - Draft / Saved / Store (Prioritize this)
    if (
      lowerAction.includes("draft") || 
      lowerAction.includes("save") || 
      lowerAction.includes("store")
    ) {
      return { label: "Draft", color: "#fbbf24" }; // Amber-400
    }

    // Blue - Edited / Updated / Modified
    if (
      lowerAction.includes("edit") || 
      lowerAction.includes("update") || 
      lowerAction.includes("modify")
    ) {
      return { label: "Edited", color: "#0ea5e9" }; // Sky-500
    }

    // Red - Deleted / Removed
    if (
      lowerAction.includes("delete") || 
      lowerAction.includes("remove")
    ) {
      return { label: "Deleted", color: "#ef4444" }; // Red-500
    }
    
    // Default to the action name formatted nicely if no match
    const capitalizedLabel = action ? action.charAt(0).toUpperCase() + action.slice(1) : "Action";
    return { label: capitalizedLabel, color: "#9ca3af" };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: "", time: "" };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: "", time: "" };
    const date = d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  const { label, color } = getStatusInfo(log.action);
  const { date, time } = formatDateTime(log.created_at);

  return (
    <View className="px-5 py-2">
      <View className="flex-row bg-white rounded-[14px] border border-gray-200 h-[92px] overflow-hidden" style={{ elevation: 1, shadowColor: '#9ca3af', shadowOpacity: 0.1, shadowRadius: 4 }}>
        {/* Dynamic Color left strip */}
        <View className="w-[12px] h-full" style={{ backgroundColor: color }} />

        <View className="flex-1 flex-row items-center pr-4">
          <View className="w-[90px] items-start justify-center pl-3">
            <Text className="text-[14px] font-bold" style={{ color }}>{label}</Text>
          </View>

          <View className="flex-1 justify-center pl-1">
            <Text className="text-[18px] font-semibold text-gray-900 mb-0.5" numberOfLines={1} ellipsizeMode="tail">
              {log.article_title || "Unknown Article"}
            </Text>
            <Text className="text-[13px] text-gray-500 italic" numberOfLines={1} ellipsizeMode="tail">
              {log.user_email || "Unknown User"}
            </Text>
          </View>

          <View className="items-end justify-center pl-2">
            <Text className="text-[12px] text-gray-600 font-medium mb-1">{date}</Text>
            <Text className="text-[12px] text-gray-600 font-medium">{time}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
