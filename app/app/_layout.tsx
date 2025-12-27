import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { JobsProvider } from "@/contexts/JobsContext";
import { AppointmentsProvider } from "@/contexts/AppointmentsContext";
import { BidsProvider } from "@/contexts/BidsContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SavedContractorsProvider } from "@/contexts/SavedContractorsContext";
import { VideoConsultationsProvider } from "@/contexts/VideoConsultationsContext";
import { MessageTemplatesProvider } from "@/contexts/MessageTemplatesContext";
import { QuotesProvider } from "@/contexts/QuotesContext";
import { AnalyticsContext } from "@/contexts/AnalyticsContext";
import { DisputesContext } from "@/contexts/DisputesContext";
import { EscrowContext } from "@/contexts/EscrowContext";
import { ReferralsContext } from "@/contexts/ReferralsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useSegments, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import AuthTest from "./(test)/AuthTest";

const staticColors = {
  primary: "#2563EB",
  secondary: "#F97316",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
  info: "#3B82F6",
  primaryLight: "#EFF6FF",
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, loading, user, hydrationComplete, setNavigationReady, colors } = useAuth();
  const router = useRouter();

  // Mark navigation as ready when component mounts
  useEffect(() => {
    setNavigationReady(true);
  }, [setNavigationReady]);

  // Show splash screen until hydration completes
  if (loading || !hydrationComplete || (user && !user.role)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors?.background || staticColors.background }]}>
        <ActivityIndicator size="large" color={colors?.primary || staticColors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
      }}
    >
      {/* Login route must be registered first */}
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job-details" options={{ headerShown: false }} />
      <Stack.Screen name="bid-details" options={{ headerShown: false }} />
      <Stack.Screen name="appointment-details" options={{ headerShown: false }} />
      <Stack.Screen name="contractor-profile" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="messages" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="mfa-setup" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen name="project-setup" options={{ headerShown: false }} />
      <Stack.Screen name="project-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="milestone-details" options={{ headerShown: false }} />
      <Stack.Screen name="project-closeout" options={{ headerShown: false }} />
      <Stack.Screen name="contractor-comparison" options={{ headerShown: false }} />
      <Stack.Screen name="disputes" options={{ headerShown: false }} />
      <Stack.Screen name="dispute-details" options={{ headerShown: false }} />
      <Stack.Screen name="referrals" options={{ headerShown: false }} />
      <Stack.Screen name="insurance-verification" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <JobsProvider>
            <AppointmentsProvider>
              <BidsProvider>
                <ProjectsProvider>
                  <SavedContractorsProvider>
                    <VideoConsultationsProvider>
                      <MessageTemplatesProvider>
                        <QuotesProvider>
                          <AnalyticsContext>
                            <DisputesContext>
                              <EscrowContext>
                                <ReferralsContext>
                                  <GestureHandlerRootView style={{ flex: 1 }}>
                                    <AuthTest />
                                    <RootLayoutNav />
                                  </GestureHandlerRootView>
                                </ReferralsContext>
                              </EscrowContext>
                            </DisputesContext>
                          </AnalyticsContext>
                        </QuotesProvider>
                      </MessageTemplatesProvider>
                    </VideoConsultationsProvider>
                  </SavedContractorsProvider>
                </ProjectsProvider>
              </BidsProvider>
            </AppointmentsProvider>
          </JobsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticColors.background,
  },
});
