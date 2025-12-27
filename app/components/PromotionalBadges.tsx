import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Sparkles, Zap, Award, Star, Shield } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";

export type BadgeType =
  | "new_member"
  | "quick_responder"
  | "top_rated"
  | "verified"
  | "featured"
  | "pro";

interface Badge {
  type: BadgeType;
  label: string;
  icon: React.ComponentType<any>;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

const getBadgeConfig = (colors: any): Record<BadgeType, Badge> => ({
  new_member: {
    type: "new_member",
    label: "New Member",
    icon: Sparkles,
    backgroundColor: colors.primary + "15",
    textColor: colors.primary,
    borderColor: colors.primary + "30",
  },
  quick_responder: {
    type: "quick_responder",
    label: "Quick Responder",
    icon: Zap,
    backgroundColor: colors.warning + "15",
    textColor: colors.warning,
    borderColor: colors.warning + "30",
  },
  top_rated: {
    type: "top_rated",
    label: "Top Rated",
    icon: Star,
    backgroundColor: colors.warning + "15",
    textColor: colors.warning,
    borderColor: colors.warning + "40",
  },
  verified: {
    type: "verified",
    label: "Verified",
    icon: Shield,
    backgroundColor: colors.success + "15",
    textColor: colors.success,
    borderColor: colors.success + "30",
  },
  featured: {
    type: "featured",
    label: "Featured",
    icon: Award,
    backgroundColor: colors.error + "15",
    textColor: colors.error,
    borderColor: colors.error + "30",
  },
  pro: {
    type: "pro",
    label: "Pro",
    icon: Award,
    backgroundColor: colors.primary + "15",
    textColor: colors.primary,
    borderColor: colors.primary + "30",
  },
});

interface PromotionalBadgesProps {
  badges: BadgeType[];
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
}

export const PromotionalBadges: React.FC<PromotionalBadgesProps> = ({
  badges,
  size = "medium",
  showIcon = true,
}) => {
  const { colors } = useAuth();
  const badgeConfig = getBadgeConfig(colors);

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 12;
      case "large":
        return 18;
      default:
        return 14;
    }
  };

  const getBadgeStyle = () => {
    switch (size) {
      case "small":
        return styles.badgeSmall;
      case "large":
        return styles.badgeLarge;
      default:
        return styles.badgeMedium;
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case "small":
        return styles.badgeTextSmall;
      case "large":
        return styles.badgeTextLarge;
      default:
        return styles.badgeTextMedium;
    }
  };

  return (
    <View style={styles.container}>
      {badges.map((badgeType) => {
        const badge = badgeConfig[badgeType];
        if (!badge) return null;
        const Icon = badge.icon;

        return (
          <View
            key={badgeType}
            style={[
              styles.badge,
              getBadgeStyle(),
              {
                backgroundColor: badge.backgroundColor,
                borderColor: badge.borderColor,
              },
            ]}
          >
            {showIcon && (
              <Icon size={getIconSize()} color={badge.textColor} />
            )}
            <Text style={[getTextStyle(), { color: badge.textColor }]}>
              {badge.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export const getBadgesForContractor = (contractor: {
  createdAt?: string;
  trustIndicators?: {
    responseTime: number;
    responseRate: number;
  };
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
}): BadgeType[] => {
  const badges: BadgeType[] = [];

  if (contractor.createdAt) {
    const joinedDate = new Date(contractor.createdAt);
    const daysSinceJoined = Math.floor(
      (Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceJoined <= 30) {
      badges.push("new_member");
    }
  }

  if (contractor.trustIndicators) {
    const { responseTime, responseRate } = contractor.trustIndicators;
    if (responseTime <= 60 && responseRate >= 90) {
      badges.push("quick_responder");
    }
  }

  if (
    contractor.rating &&
    contractor.rating >= 4.5 &&
    contractor.reviewCount &&
    contractor.reviewCount >= 10
  ) {
    badges.push("top_rated");
  }

  if (contractor.verified) {
    badges.push("verified");
  }

  if (contractor.featured) {
    badges.push("featured");
  }

  return badges;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  badgeTextMedium: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  badgeTextLarge: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
