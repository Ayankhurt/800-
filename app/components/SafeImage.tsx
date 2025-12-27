import React from "react";
import { Image, ImageProps, View, StyleSheet } from "react-native";
import { User } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";

const staticColors = {
  background: "#F8FAFC",
  textSecondary: "#64748B",
  border: "#E2E8F0",
};

interface SafeImageProps extends Omit<ImageProps, "source"> {
  uri?: string | null;
  fallbackIcon?: React.ReactNode;
}

export default function SafeImage({
  uri,
  style,
  fallbackIcon,
  ...rest
}: SafeImageProps) {
  const { colors = staticColors } = useAuth();
  const hasValidUri = uri && uri.trim().length > 0;

  if (!hasValidUri) {
    return (
      <View
        style={[
          styles.fallbackContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
          style,
        ]}
      >
        {fallbackIcon || <User size={24} color={colors.textSecondary} />}
      </View>
    );
  }

  return (
    <Image
      {...rest}
      source={{ uri }}
      style={style}
      onError={(error) => {
        console.warn("Image failed to load:", uri, error);
      }}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  },
});
