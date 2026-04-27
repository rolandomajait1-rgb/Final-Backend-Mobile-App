import { Text } from "react-native";

/**
 * StatusBadge Component
 * Displays a colored badge for audit log actions
 *
 * @param {string} action - The action type (Edited, Published, Draft, Deleted)
 * @param {string} label - Display label for the badge
 */
export default function StatusBadge({ action, label }) {
  const getStatusColor = (actionType) => {
    const lowerAction = actionType?.toLowerCase() || "";

    if (lowerAction.includes("published") || lowerAction.includes("created")) {
      return "#58ff9eff";
    }

    if (lowerAction.includes("edited") || lowerAction.includes("updated")) {
      return "#5395ffff";
    }

    if (lowerAction.includes("deleted")) {
      return "#e14432ff";
    }

    if (lowerAction.includes("draft") || lowerAction.includes("save")) {
      return "#f39c12";
    }

    return "#9ca3af";
  };

  const textColor = getStatusColor(action);

  return (
    <Text 
      className="text-xs font-bold tracking-tight min-w-[60px]" 
      style={{ color: textColor }}
    >
      {label}
    </Text>
  );
}
