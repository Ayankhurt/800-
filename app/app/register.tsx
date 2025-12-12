import Colors from "@/constants/colors";
import { APP_ROLES } from "@/constants/roles";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { UserPlus, ChevronDown, ShieldCheck, CheckCircle, ArrowLeft, ArrowRight, Upload } from "lucide-react-native";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
} from "react-native";

type SignupStep = 1 | 2 | 3 | 4 | 5;

interface SignupData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Role
  role: AppRole | null;
  
  // Step 3: Role-specific profile info
  // GC fields
  companyName?: string;
  tradeSpecialization?: string;
  yearsExperience?: string;
  licenseNumber?: string;
  licenseType?: string;
  insuranceDetails?: string;
  companyLogo?: string;
  location?: string;
  portfolio?: string;
  
  // Sub fields
  certifications?: string;
  
  // PM fields
  projectType?: string;
  
  // TS fields
  // (uses tradeSpecialization, certifications, yearsExperience, portfolio, location)
}

export default function RegisterScreen() {
  const { signup, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [formData, setFormData] = useState<SignupData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [verificationChallenge, setVerificationChallenge] = useState({ num1: 0, num2: 0, answer: 0 });

  const startTimeRef = useRef<number>(Date.now());
  const interactionCountRef = useRef<number>(0);

  useEffect(() => {
    generateChallenge();
  }, []);

  const generateChallenge = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setVerificationChallenge({ num1, num2, answer: num1 + num2 });
  };

  const trackInteraction = () => {
    interactionCountRef.current += 1;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep1 = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields");
      return false;
    }

    // Email is optional but if provided, must be valid
    if (formData.email && !validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.role) {
      setError("Please select a role");
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.role) return false;

    // GC validation
    if (formData.role === "GC") {
      if (!formData.companyName || !formData.tradeSpecialization || !formData.yearsExperience || !formData.licenseNumber || !formData.location) {
        setError("Please fill in all required fields");
        return false;
      }
    }

    // Sub validation
    if (formData.role === "SUB") {
      if (!formData.tradeSpecialization || !formData.yearsExperience) {
        setError("Please fill in all required fields");
        return false;
      }
    }

    // PM validation
    if (formData.role === "PM") {
      if (!formData.companyName || !formData.yearsExperience || !formData.projectType || !formData.location) {
        setError("Please fill in all required fields");
        return false;
      }
    }

    // TS validation
    if (formData.role === "TS") {
      if (!formData.tradeSpecialization || !formData.certifications || !formData.yearsExperience) {
        setError("Please fill in all required fields");
        return false;
      }
    }

    // Viewer has no required fields
    return true;
  };

  const handleNext = () => {
    setError("");
    
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Verification documents step - can proceed
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SignupStep);
      setError("");
    }
  };

  const handleCompleteSignup = async () => {
    setError("");

    // Final validation
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    // Show verification modal
    setShowVerification(true);
  };

  const handleVerificationSubmit = async () => {
    if (honeypot) {
      console.warn("Bot detected: honeypot filled");
      setError("Verification failed. Please try again.");
      setShowVerification(false);
      return;
    }

    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    if (timeTaken < 3) {
      console.warn("Bot detected: too fast submission");
      setError("Please take your time to fill out the form.");
      setShowVerification(false);
      return;
    }

    if (interactionCountRef.current < 5) {
      console.warn("Bot detected: insufficient interactions");
      setError("Please interact with the form naturally.");
      setShowVerification(false);
      return;
    }

    if (parseInt(verificationAnswer) !== verificationChallenge.answer) {
      setError("Incorrect answer. Please try again.");
      generateChallenge();
      setVerificationAnswer("");
      return;
    }

    setShowVerification(false);
    setIsSubmitting(true);
    setError("");

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      
      // Build signup data based on role
      const signupPayload: any = {
        fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role!,
      };

      // Add role-specific fields
      if (formData.role === "GC") {
        signupPayload.companyName = formData.companyName;
        signupPayload.tradeSpecialization = formData.tradeSpecialization;
        signupPayload.yearsExperience = formData.yearsExperience;
        signupPayload.licenseNumber = formData.licenseNumber;
        signupPayload.licenseType = formData.licenseType;
        signupPayload.insuranceDetails = formData.insuranceDetails;
        signupPayload.location = formData.location;
        signupPayload.portfolio = formData.portfolio;
      } else if (formData.role === "SUB") {
        signupPayload.tradeSpecialization = formData.tradeSpecialization;
        signupPayload.yearsExperience = formData.yearsExperience;
        signupPayload.licenseNumber = formData.licenseNumber;
        signupPayload.companyName = formData.companyName;
        signupPayload.location = formData.location;
        signupPayload.portfolio = formData.portfolio;
        signupPayload.certifications = formData.certifications;
      } else if (formData.role === "PM") {
        signupPayload.companyName = formData.companyName;
        signupPayload.yearsExperience = formData.yearsExperience;
        signupPayload.projectType = formData.projectType;
        signupPayload.portfolio = formData.portfolio;
        signupPayload.location = formData.location;
      } else if (formData.role === "TS") {
        signupPayload.tradeSpecialization = formData.tradeSpecialization;
        signupPayload.certifications = formData.certifications;
        signupPayload.yearsExperience = formData.yearsExperience;
        signupPayload.portfolio = formData.portfolio;
        signupPayload.location = formData.location;
      } else if (formData.role === "VIEWER") {
        signupPayload.location = formData.location;
      }

      const result = await signup(signupPayload);

      if (result.success) {
        // Navigation is handled by AuthContext after successful signup
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof SignupData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    trackInteraction();
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>Enter your basic information to get started</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John"
          placeholderTextColor={Colors.textTertiary}
          value={formData.firstName}
          onChangeText={(text) => updateFormData("firstName", text)}
          autoComplete="given-name"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Doe"
          placeholderTextColor={Colors.textTertiary}
          value={formData.lastName}
          onChangeText={(text) => updateFormData("lastName", text)}
          autoComplete="family-name"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.honeypotContainer}>
        <TextInput
          style={styles.honeypotInput}
          value={honeypot}
          onChangeText={setHoneypot}
          autoComplete="off"
          accessibilityLabel="Do not fill this field"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textTertiary}
          value={formData.email}
          onChangeText={(text) => updateFormData("email", text)}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimum 6 characters"
          placeholderTextColor={Colors.textTertiary}
          value={formData.password}
          onChangeText={(text) => updateFormData("password", text)}
          secureTextEntry
          autoComplete="password-new"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter password"
          placeholderTextColor={Colors.textTertiary}
          value={formData.confirmPassword}
          onChangeText={(text) => updateFormData("confirmPassword", text)}
          secureTextEntry
          autoComplete="password-new"
          editable={!isSubmitting}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Your Role</Text>
      <Text style={styles.stepSubtitle}>Choose the role that best describes you</Text>

      <View style={styles.roleList}>
        {APP_ROLES.map((roleOption) => (
          <TouchableOpacity
            key={roleOption.value}
            style={[
              styles.roleOption,
              formData.role === roleOption.value && styles.roleOptionSelected,
            ]}
            onPress={() => updateFormData("role", roleOption.value)}
            disabled={isSubmitting}
          >
            <View style={styles.roleOptionContent}>
              <View style={styles.roleOptionTextContainer}>
                <Text
                  style={[
                    styles.roleOptionLabel,
                    formData.role === roleOption.value && styles.roleOptionLabelSelected,
                  ]}
                >
                  {roleOption.label}
                </Text>
                <Text
                  style={[
                    styles.roleOptionDesc,
                    formData.role === roleOption.value && styles.roleOptionDescSelected,
                  ]}
                >
                  {roleOption.description}
                </Text>
              </View>
              {formData.role === roleOption.value && (
                <CheckCircle size={24} color={Colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => {
    if (!formData.role) return null;

    // GC Profile Information
    if (formData.role === "GC") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Profile Information</Text>
          <Text style={styles.stepSubtitle}>Tell us about your company</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Doe Construction"
              placeholderTextColor={Colors.textTertiary}
              value={formData.companyName}
              onChangeText={(text) => updateFormData("companyName", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trade Specialization *</Text>
            <TextInput
              style={styles.input}
              placeholder="General"
              placeholderTextColor={Colors.textTertiary}
              value={formData.tradeSpecialization}
              onChangeText={(text) => updateFormData("tradeSpecialization", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience *</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={Colors.textTertiary}
              value={formData.yearsExperience}
              onChangeText={(text) => updateFormData("yearsExperience", text)}
              keyboardType="number-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="12345"
              placeholderTextColor={Colors.textTertiary}
              value={formData.licenseNumber}
              onChangeText={(text) => updateFormData("licenseNumber", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Type</Text>
            <TextInput
              style={styles.input}
              placeholder="General Contractor License"
              placeholderTextColor={Colors.textTertiary}
              value={formData.licenseType}
              onChangeText={(text) => updateFormData("licenseType", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Insurance Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Insurance details"
              placeholderTextColor={Colors.textTertiary}
              value={formData.insuranceDetails}
              onChangeText={(text) => updateFormData("insuranceDetails", text)}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="New York"
              placeholderTextColor={Colors.textTertiary}
              value={formData.location}
              onChangeText={(text) => updateFormData("location", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Portfolio (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Portfolio link or description"
              placeholderTextColor={Colors.textTertiary}
              value={formData.portfolio}
              onChangeText={(text) => updateFormData("portfolio", text)}
              multiline
              numberOfLines={2}
              editable={!isSubmitting}
            />
          </View>
        </View>
      );
    }

    // Sub Profile Information
    if (formData.role === "SUB") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Profile Information</Text>
          <Text style={styles.stepSubtitle}>Tell us about your trade</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trade Specialization *</Text>
            <TextInput
              style={styles.input}
              placeholder="Plumbing"
              placeholderTextColor={Colors.textTertiary}
              value={formData.tradeSpecialization}
              onChangeText={(text) => updateFormData("tradeSpecialization", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience *</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor={Colors.textTertiary}
              value={formData.yearsExperience}
              onChangeText={(text) => updateFormData("yearsExperience", text)}
              keyboardType="number-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License/Certifications</Text>
            <TextInput
              style={styles.input}
              placeholder="67890"
              placeholderTextColor={Colors.textTertiary}
              value={formData.licenseNumber}
              onChangeText={(text) => updateFormData("licenseNumber", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Doe Subcontracting"
              placeholderTextColor={Colors.textTertiary}
              value={formData.companyName}
              onChangeText={(text) => updateFormData("companyName", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Los Angeles"
              placeholderTextColor={Colors.textTertiary}
              value={formData.location}
              onChangeText={(text) => updateFormData("location", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Portfolio (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Portfolio link or description"
              placeholderTextColor={Colors.textTertiary}
              value={formData.portfolio}
              onChangeText={(text) => updateFormData("portfolio", text)}
              multiline
              numberOfLines={2}
              editable={!isSubmitting}
            />
          </View>
        </View>
      );
    }

    // PM Profile Information
    if (formData.role === "PM") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Profile Information</Text>
          <Text style={styles.stepSubtitle}>Tell us about your project management experience</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Smith Projects"
              placeholderTextColor={Colors.textTertiary}
              value={formData.companyName}
              onChangeText={(text) => updateFormData("companyName", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Project Management Experience *</Text>
            <TextInput
              style={styles.input}
              placeholder="8"
              placeholderTextColor={Colors.textTertiary}
              value={formData.yearsExperience}
              onChangeText={(text) => updateFormData("yearsExperience", text)}
              keyboardType="number-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Project Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="Commercial, Residential, etc."
              placeholderTextColor={Colors.textTertiary}
              value={formData.projectType}
              onChangeText={(text) => updateFormData("projectType", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Chicago"
              placeholderTextColor={Colors.textTertiary}
              value={formData.location}
              onChangeText={(text) => updateFormData("location", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Portfolio (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Portfolio link or description"
              placeholderTextColor={Colors.textTertiary}
              value={formData.portfolio}
              onChangeText={(text) => updateFormData("portfolio", text)}
              multiline
              numberOfLines={2}
              editable={!isSubmitting}
            />
          </View>
        </View>
      );
    }

    // TS Profile Information
    if (formData.role === "TS") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Profile Information</Text>
          <Text style={styles.stepSubtitle}>Tell us about your trade specialization</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trade Specialization *</Text>
            <TextInput
              style={styles.input}
              placeholder="Electrical"
              placeholderTextColor={Colors.textTertiary}
              value={formData.tradeSpecialization}
              onChangeText={(text) => updateFormData("tradeSpecialization", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certifications *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Electrical Certification"
              placeholderTextColor={Colors.textTertiary}
              value={formData.certifications}
              onChangeText={(text) => updateFormData("certifications", text)}
              multiline
              numberOfLines={2}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience *</Text>
            <TextInput
              style={styles.input}
              placeholder="6"
              placeholderTextColor={Colors.textTertiary}
              value={formData.yearsExperience}
              onChangeText={(text) => updateFormData("yearsExperience", text)}
              keyboardType="number-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Dallas"
              placeholderTextColor={Colors.textTertiary}
              value={formData.location}
              onChangeText={(text) => updateFormData("location", text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Portfolio (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Portfolio link or description"
              placeholderTextColor={Colors.textTertiary}
              value={formData.portfolio}
              onChangeText={(text) => updateFormData("portfolio", text)}
              multiline
              numberOfLines={2}
              editable={!isSubmitting}
            />
          </View>
        </View>
      );
    }

    // Viewer Profile Information
    if (formData.role === "VIEWER") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Profile Information</Text>
          <Text style={styles.stepSubtitle}>You have read-only access to the platform</Text>
          <View style={styles.viewerInfo}>
            <Text style={styles.viewerInfoText}>
              As a Viewer, you can browse projects and view information but cannot create bids or manage projects.
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderStep4 = () => {
    if (!formData.role) return null;

    // GC Verification Documents
    if (formData.role === "GC") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Verification Documents</Text>
          <Text style={styles.stepSubtitle}>Upload your verification documents</Text>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Insurance Verification</Text>
            <TouchableOpacity style={styles.uploadButton} disabled={isSubmitting}>
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload Insurance Document</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>License Verification</Text>
            <TouchableOpacity style={styles.uploadButton} disabled={isSubmitting}>
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload License Document</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Background Check (Optional)</Text>
            <TouchableOpacity style={styles.uploadButton} disabled={isSubmitting}>
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload Background Check</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Sub Verification Documents
    if (formData.role === "SUB") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Verification Documents</Text>
          <Text style={styles.stepSubtitle}>Upload your certifications (optional)</Text>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Certifications (Optional)</Text>
            <TouchableOpacity style={styles.uploadButton} disabled={isSubmitting}>
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload Certifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // PM Verification Documents
    if (formData.role === "PM") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Verification Documents</Text>
          <Text style={styles.stepSubtitle}>Upload your verification documents</Text>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Licensing and Certifications (if applicable)</Text>
            <TouchableOpacity style={styles.uploadButton} disabled={isSubmitting}>
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload Documents</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Insurance Details</Text>
            <TouchableOpacity style={styles.uploadButton} disabled={isSubmitting}>
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload Insurance Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // TS Verification Documents
    if (formData.role === "TS") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Verification Documents</Text>
          <Text style={styles.stepSubtitle}>Upload your certifications</Text>

          <View style={styles.documentSection}>
            <Text style={styles.documentLabel}>Certifications (Required)</Text>
            <TouchableOpacity style={styles.uploadButton} disabled={isSubmitting}>
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Upload Certifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Viewer doesn't require verification
    if (formData.role === "VIEWER") {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Verification Documents</Text>
          <Text style={styles.stepSubtitle}>Viewer accounts don't require verification documents</Text>
        </View>
      );
    }

    return null;
  };

  const renderStep5 = () => {
    const roleLabel = APP_ROLES.find((r) => r.value === formData.role)?.label || "User";
    
    return (
      <View style={styles.stepContainer}>
        <View style={styles.confirmationIconContainer}>
          <CheckCircle size={64} color={Colors.primary} />
        </View>
        <Text style={styles.confirmationTitle}>Thank You for Signing Up!</Text>
        <Text style={styles.confirmationSubtitle}>
          {formData.role === "VIEWER" 
            ? "You have read-only access to the platform."
            : `Your ${roleLabel} profile is being reviewed. We'll notify you once it's approved.`}
        </Text>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return renderStep1();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <UserPlus size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Step {currentStep} of 5</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressStep,
                  step <= currentStep && styles.progressStepActive,
                  step === currentStep && styles.progressStepCurrent,
                ]}
              />
            ))}
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {renderCurrentStep()}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <View style={styles.buttonContainer}>
                {currentStep > 1 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.backButton]}
                    onPress={handleBack}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={20} color={Colors.primary} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
                  onPress={currentStep === 4 ? handleCompleteSignup : handleNext}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.surface} />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>
                        {currentStep === 4 ? "Complete Signup" : "Next"}
                      </Text>
                      {currentStep < 4 && <ArrowRight size={20} color={Colors.surface} />}
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {currentStep === 5 && (
              <TouchableOpacity
                style={styles.finishButton}
                onPress={() => {
                  // Navigation is handled by AuthContext after successful signup
                  // If we're here, signup was successful
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.finishButtonText}>Finish</Text>
              </TouchableOpacity>
            )}

            {currentStep === 1 && (
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.back()}
                disabled={isSubmitting}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verification Modal */}
      <Modal
        visible={showVerification}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVerification(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVerification(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.verificationModal}>
              <View style={styles.verificationIconContainer}>
                <ShieldCheck size={48} color={Colors.primary} />
              </View>
              <Text style={styles.verificationTitle}>Human Verification</Text>
              <Text style={styles.verificationSubtitle}>
                Please solve this simple math problem to continue
              </Text>

              <View style={styles.challengeContainer}>
                <Text style={styles.challengeText}>
                  {verificationChallenge.num1} + {verificationChallenge.num2} = ?
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Answer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the answer"
                  placeholderTextColor={Colors.textTertiary}
                  value={verificationAnswer}
                  onChangeText={setVerificationAnswer}
                  keyboardType="number-pad"
                  autoFocus
                />
              </View>

              <TouchableOpacity style={styles.verifyButton} onPress={handleVerificationSubmit}>
                <Text style={styles.verifyButtonText}>Verify & Register</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowVerification(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  progressStepCurrent: {
    backgroundColor: Colors.primary,
    height: 6,
  },
  form: {
    gap: 20,
    marginBottom: 40,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorBanner: {
    backgroundColor: Colors.error + "10",
    borderWidth: 1,
    borderColor: Colors.error + "30",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  roleList: {
    gap: 12,
  },
  roleOption: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  roleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleOptionTextContainer: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  roleOptionLabelSelected: {
    color: Colors.primary,
  },
  roleOptionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  roleOptionDescSelected: {
    color: Colors.primary,
  },
  viewerInfo: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  viewerInfoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  documentSection: {
    marginBottom: 20,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  confirmationIconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  finishButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  finishButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 16,
  },
  loginLinkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLinkTextBold: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  honeypotContainer: {
    position: "absolute",
    left: -9999,
    width: 1,
    height: 1,
    overflow: "hidden",
  },
  honeypotInput: {
    width: 1,
    height: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  verificationModal: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    margin: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  verificationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  verificationSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  challengeContainer: {
    backgroundColor: Colors.primaryLight,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    width: "100%",
    alignItems: "center",
  },
  challengeText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  cancelButton: {
    marginTop: 12,
    padding: 12,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
