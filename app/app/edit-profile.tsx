import { useAuth } from "@/contexts/AuthContext";

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
import { Stack, useRouter } from "expo-router";
import {
  Building2,
  Camera,
  Mail,
  Phone,
  User,
  Video,
  MapPin,
  Briefcase,
  Clock,
  Shield,
  FileText,
  Sparkles,
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { userAPI } from "@/services/api";

import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser, colors } = useAuth();

  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [company, setCompany] = useState(user?.company || "");
  const [bio, setBio] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [insuranceAmount, setInsuranceAmount] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getProfile();
        if (response.success && response.data) {
          const data = response.data;
          setName(data.fullName || data.full_name || user?.fullName || "");
          setEmail(data.email || user?.email || "");
          setPhone(data.phone || data.phone_number || data.phoneNumber || user?.phone || "");
          setCompany(data.company || data.company_name || data.companyName || user?.company || "");
          setBio(data.bio || "");
          setTrade(data.trade_specialization || data.trade || "");
          setLocation(data.location || "");

          if (data.contractor_profile) {
            setExperienceYears(data.contractor_profile.experience_years?.toString() || "");
            setLicenseNumber(data.contractor_profile.license_number || "");
            setInsuranceAmount(data.contractor_profile.insurance_amount?.toString() || "");
            setSpecialties(Array.isArray(data.contractor_profile.specialties) ? data.contractor_profile.specialties.join(", ") : "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch full profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullProfile();
  }, [user]);


  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);

      // Create form data
      const formData = new FormData();

      // Determine file type
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // Append file
      // @ts-ignore - React Native FormData expects an object with uri, name, type
      formData.append('file', {
        uri,
        name: filename,
        type,
      });

      console.log("[Client] Uploading avatar...", { filename, type });

      const response = await userAPI.uploadAvatar(formData);

      if (response && response.success) {
        setAvatarUrl(response.data.url);

        // Update local context
        if (updateUser) {
          await updateUser({
            avatar: response.data.url
          });
        }

        Alert.alert("Success", "Profile photo updated!");
      } else {
        throw new Error(response?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to update your profile photo!');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadImage(selectedImage.uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleVideoUpload = () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Upload Introduction Video",
        "Video upload integration coming soon!\n\nWill support:\n- Video recording\n- Video library selection\n- Video trimming (max 60s)\n- Auto-compression\n\nPerfect for showcasing your work or introducing your team!"
      );
    } else {
      Alert.alert(
        "Upload Introduction Video",
        "Choose an option",
        [
          {
            text: "Record Video",
            onPress: () => {
              Alert.alert("Camera", "Video recording integration coming soon!");
            },
          },
          {
            text: "Choose from Library",
            onPress: () => {
              Alert.alert("Library", "Video library integration coming soon!");
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      console.log("[API] Updating profile", { name, email, phone, company });

      // Split fullName into first and last name
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

      // Map frontend fields to backend expected format for basic profile
      const basicProfileData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        company_name: company || undefined,
        bio: bio || undefined,
        location: location || undefined,
      };

      // Remove undefined fields
      const cleanBasicData = Object.fromEntries(
        Object.entries(basicProfileData).filter(([_, v]) => v !== undefined)
      );

      console.log("[API] PUT /users/profile with data:", cleanBasicData);

      // Call API to update basic profile
      const basicResponse = await userAPI.updateProfile(cleanBasicData);

      // If user is a contractor, also update contractor profile
      if (user?.role === "SUB" || user?.role === "TS" || user?.role === "GC") {
        const contractorData = {
          experience_years: experienceYears ? parseInt(experienceYears) : undefined,
          license_number: licenseNumber || undefined,
          insurance_amount: insuranceAmount ? parseFloat(insuranceAmount) : undefined,
          specialties: specialties ? specialties.split(",").map(s => s.trim()) : undefined,
          trade_specialization: trade || undefined,
        };

        const cleanContractorData = Object.fromEntries(
          Object.entries(contractorData).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(cleanContractorData).length > 0) {
          console.log("[API] PUT /users/contractor-profile with data:", cleanContractorData);
          await userAPI.updateContractorProfile(cleanContractorData);
        }
      }

      if (basicResponse.success) {
        // Also update local context
        if (updateUser) {
          await updateUser({
            fullName: name,
            email: email,
            phone: phone,
            company: company,
          });
        }

        Alert.alert("Success", "Profile updated successfully!");
        router.back();
      } else {
        Alert.alert("Error", basicResponse.message || "Failed to save profile. Please try again.");
      }
    } catch (error: any) {
      console.error("[API] Failed to save profile:", error);
      Alert.alert("Error", error.response?.data?.message || error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Edit Profile",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mediaSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
            <TouchableOpacity style={styles.cameraButton} onPress={handleImageUpload}>
              <Camera size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarLabel}>Profile Photo</Text>

          <View style={styles.videoPlaceholder}>
            <View style={styles.videoPlaceholderContent}>
              <Video size={48} color={colors.textTertiary} />
              <Text style={styles.videoPlaceholderTitle}>Introduction Video</Text>
              <Text style={styles.videoPlaceholderSubtitle}>
                Showcase your work or introduce your team
              </Text>
              <TouchableOpacity
                style={styles.uploadVideoButton}
                onPress={handleVideoUpload}
              >
                <Text style={styles.uploadVideoButtonText}>Upload Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User size={18} color={colors.textSecondary} />
              <Text style={styles.inputLabelText}>Full Name</Text>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Mail size={18} color={colors.textSecondary} />
              <Text style={styles.inputLabelText}>Email</Text>
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Phone size={18} color={colors.textSecondary} />
              <Text style={styles.inputLabelText}>Phone</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Building2 size={18} color={colors.textSecondary} />
              <Text style={styles.inputLabelText}>Company</Text>
            </View>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Enter your company name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MapPin size={18} color={colors.textSecondary} />
              <Text style={styles.inputLabelText}>Location</Text>
            </View>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City, State"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User size={18} color={colors.textSecondary} />
              <Text style={styles.inputLabelText}>Bio</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself and your experience..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {(user?.role === "SUB" || user?.role === "TS" || user?.role === "GC") && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Professional Information</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Briefcase size={18} color={colors.textSecondary} />
                <Text style={styles.inputLabelText}>Primary Trade</Text>
              </View>
              <TextInput
                style={styles.input}
                value={trade}
                onChangeText={setTrade}
                placeholder="e.g., Electrical, Plumbing, HVAC"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Clock size={18} color={colors.textSecondary} />
                <Text style={styles.inputLabelText}>Years of Experience</Text>
              </View>
              <TextInput
                style={styles.input}
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="e.g., 10"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Shield size={18} color={colors.textSecondary} />
                <Text style={styles.inputLabelText}>License Number</Text>
              </View>
              <TextInput
                style={styles.input}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="State License #"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <FileText size={18} color={colors.textSecondary} />
                <Text style={styles.inputLabelText}>General Liability Amount ($)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={insuranceAmount}
                onChangeText={setInsuranceAmount}
                placeholder="e.g., 1000000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Sparkles size={18} color={colors.textSecondary} />
                <Text style={styles.inputLabelText}>Specialties</Text>
              </View>
              <TextInput
                style={styles.input}
                value={specialties}
                onChangeText={setSpecialties}
                placeholder="e.g., Kitchens, Bathrooms, Smart Home (comma separated)"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  scrollView: {
    flex: 1,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.primary,
    marginRight: 16,
  },
  saveButtonDisabled: {
    color: staticColors.textTertiary,
  },
  mediaSection: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  avatarContainer: {
    position: "relative" as const,
    marginBottom: 8,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: staticColors.primary + "20",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 4,
    borderColor: staticColors.surface,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  cameraButton: {
    position: "absolute" as const,
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 3,
    borderColor: staticColors.surface,
  },
  avatarLabel: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginBottom: 24,
  },
  videoPlaceholder: {
    width: "100%" as const,
    backgroundColor: staticColors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed" as const,
    borderColor: staticColors.border,
    overflow: "hidden" as const,
  },
  videoPlaceholderContent: {
    padding: 32,
    alignItems: "center" as const,
  },
  videoPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  videoPlaceholderSubtitle: {
    fontSize: 14,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 16,
  },
  uploadVideoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: staticColors.primary,
    borderRadius: 8,
  },
  uploadVideoButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.surface,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  input: {
    backgroundColor: staticColors.surface,
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: staticColors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputHint: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticColors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: staticColors.textSecondary,
  },
});
