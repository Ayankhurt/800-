import { useAuth } from "@/contexts/AuthContext";
import { Stack, useRouter } from "expo-router";
import { Video as VideoPlayer, ResizeMode } from 'expo-av';
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
  ChevronLeft,
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
  useColorScheme,
} from "react-native";
import { userAPI } from "@/services/api";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser, colors } = useAuth();
  const colorScheme = useColorScheme();

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
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const videoRef = React.useRef<any>(null);

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
          setAvatarUrl(data.avatar_url || data.avatar || user?.avatar || "");
          setIntroVideoUrl(data.intro_video_url || "");

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
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const type = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;

      if (Platform.OS === 'web') {
        const fetchResponse = await fetch(uri);
        const blob = await fetchResponse.blob();
        formData.append('file', blob, filename);
      } else {
        // @ts-ignore
        formData.append('file', { uri, name: filename, type });
      }

      console.log("[Client] Uploading avatar...", { uri, filename, type, platform: Platform.OS });
      const response = await userAPI.uploadAvatar(formData);

      if (response && response.success) {
        setAvatarUrl(response.data.url);
        if (updateUser) {
          await updateUser({ avatar: response.data.url });
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

  const uploadVideo = async (uri: string) => {
    try {
      setIsUploadingVideo(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'intro_video.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'mp4';
      let type = `video/${ext}`;
      if (ext === 'mov') type = 'video/quicktime';
      if (ext === 'mp4') type = 'video/mp4';

      if (Platform.OS === 'web') {
        const fetchResponse = await fetch(uri);
        const blob = await fetchResponse.blob();
        formData.append('file', blob, filename);
      } else {
        // @ts-ignore
        formData.append('file', { uri, name: filename, type });
      }

      console.log("[Client] Uploading video...", { uri, filename, type, platform: Platform.OS });
      const response = await userAPI.uploadVideo(formData);

      if (response && response.success) {
        setIntroVideoUrl(response.data.url);
        // Update local context
        if (updateUser) {
          updateUser({
            ...user,
            intro_video_url: response.data.url
          } as any);
        }
        Alert.alert("Success", "Intro video uploaded successfully!");
      } else {
        throw new Error(response?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Video upload error:", error);
      Alert.alert("Upload Error", error.message || "Failed to upload video");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async () => {
    Alert.alert(
      "Delete Video",
      "Are you sure you want to remove your introduction video?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Update on server (sending null/empty)
              await userAPI.updateProfile({ intro_video_url: "" } as any);
              setIntroVideoUrl("");
              if (updateUser) {
                updateUser({ ...user, intro_video_url: "" } as any);
              }
              Alert.alert("Deleted", "Introduction video removed.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete video.");
            }
          }
        }
      ]
    );
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
        // @ts-ignore
        mediaTypes: ['images'],
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

  const handleVideoUpload = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to update your introduction video!');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // @ts-ignore
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedVideo = result.assets[0];
        await uploadVideo(selectedVideo.uri);
      }
    } catch (error) {
      console.error("Video picker error:", error);
      Alert.alert("Error", "Failed to select video");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      console.log("[API] Updating profile", { name, email, phone, company });

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

      const basicProfileData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        company_name: company || undefined,
        bio: bio || undefined,
        location: location || undefined,
      };

      const cleanBasicData = Object.fromEntries(
        Object.entries(basicProfileData).filter(([_, v]) => v !== undefined)
      );

      console.log("[API] PUT /users/profile with data:", cleanBasicData);
      const basicResponse = await userAPI.updateProfile(cleanBasicData);

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

  const styles = createStyles(colors);

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
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0 }}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
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
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.cameraButton} onPress={handleImageUpload}>
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={20} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarLabel}>Profile Photo</Text>

          <View style={styles.videoPlaceholder}>
            {introVideoUrl ? (
              <View style={styles.videoPlayerContainer}>
                {showPlayer ? (
                  <VideoPlayer
                    ref={videoRef}
                    source={{ uri: introVideoUrl }}
                    style={styles.videoPlayer}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                    shouldPlay
                  />
                ) : (
                  <View style={styles.videoPreview}>
                    <Video size={48} color={colors.primary} />
                    <Text style={styles.videoPreviewText}>Video is Ready</Text>
                  </View>
                )}

                <View style={styles.videoActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowPlayer(!showPlayer)}
                  >
                    <Text style={styles.actionButtonText}>
                      {showPlayer ? "Close Player" : "Play Video"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={handleDeleteVideo}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.videoPlaceholderContent}>
                <Video size={48} color={isUploadingVideo ? colors.primary : colors.textTertiary} />
                <Text style={styles.videoPlaceholderTitle}>Introduction Video</Text>
                <Text style={styles.videoPlaceholderSubtitle}>
                  Showcase your work or introduce your team
                </Text>
                <TouchableOpacity
                  style={styles.uploadVideoButton}
                  onPress={handleVideoUpload}
                  disabled={isUploadingVideo}
                >
                  {isUploadingVideo ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.uploadVideoButtonText}>Upload Video</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
              style={[styles.input, { opacity: 0.7 }]}
              value={email}
              editable={false}
              placeholder="Enter your email"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.inputHint}>Email cannot be changed</Text>
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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginRight: 16,
  },
  saveButtonDisabled: {
    color: colors.textTertiary,
  },
  mediaSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.surface,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.border,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.primary,
  },
  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  videoPlaceholder: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    overflow: "hidden",
  },
  videoPlaceholderContent: {
    padding: 32,
    alignItems: "center",
  },
  videoPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  videoPlaceholderSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  uploadVideoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  uploadVideoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  videoPlayerContainer: {
    width: "100%",
    backgroundColor: "#000",
    minHeight: 250,
  },
  videoPlayer: {
    width: "100%",
    height: 200,
  },
  videoPreview: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
  },
  videoPreviewText: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '600',
  },
  videoActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
