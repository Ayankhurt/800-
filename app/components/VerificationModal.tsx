import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Shield, X, CheckCircle } from "lucide-react-native";
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
};

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  message?: string;
}

export default function VerificationModal({
  visible,
  onClose,
  onVerified,
  title = "Verify You're Human",
  message = "Please complete the verification to continue",
}: VerificationModalProps) {
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState({ num1: 0, num2: 0, answer: 0 });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const { colors } = useAuth();

  useEffect(() => {
    if (visible) {
      generateChallenge();
      setCode("");
      setError("");
      setIsVerified(false);
    }
  }, [visible]);

  const generateChallenge = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setChallenge({ num1, num2, answer: num1 + num2 });
  };

  const handleVerify = async () => {
    setError("");
    setIsVerifying(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (parseInt(code) === challenge.answer) {
      setIsVerified(true);
      setIsVerifying(false);

      setTimeout(() => {
        onVerified();
        onClose();
      }, 1000);
    } else {
      setError("Incorrect answer. Please try again.");
      setIsVerifying(false);
      generateChallenge();
      setCode("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Shield size={32} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          {!isVerified ? (
            <>
              <View style={styles.challengeContainer}>
                <View style={[styles.challengeBox, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                  <Text style={[styles.challengeQuestion, { color: colors.text }]}>
                    What is {challenge.num1} + {challenge.num2}?
                  </Text>
                </View>

                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }, error && { borderColor: colors.error }]}
                  placeholder="Enter answer"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="numeric"
                  maxLength={3}
                  autoFocus
                  placeholderTextColor={colors.textTertiary}
                  editable={!isVerifying}
                />

                {error ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { backgroundColor: colors.primary },
                  (isVerifying || !code) && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerify}
                disabled={isVerifying || !code}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={[styles.verifyButtonText, { color: colors.white }]}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={generateChallenge}
                disabled={isVerifying}
              >
                <Text style={[styles.refreshButtonText, { color: colors.primary }]}>New Challenge</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <CheckCircle size={64} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>Verification Successful!</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 16,
  },
  modal: {
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  header: {
    alignItems: "center" as const,
    marginBottom: 16,
    position: "relative" as const,
  },
  closeButton: {
    position: "absolute" as const,
    right: 0,
    top: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginTop: 12,
  },
  message: {
    fontSize: 14,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 24,
  },
  challengeContainer: {
    marginBottom: 24,
  },
  challengeBox: {
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: staticColors.primary,
  },
  challengeQuestion: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    textAlign: "center" as const,
  },
  input: {
    backgroundColor: staticColors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: staticColors.text,
    borderWidth: 1,
    borderColor: staticColors.border,
    textAlign: "center" as const,
    fontWeight: "600" as const,
  },
  inputError: {
    borderColor: staticColors.error,
  },
  errorText: {
    fontSize: 13,
    color: staticColors.error,
    marginTop: 8,
    textAlign: "center" as const,
  },
  verifyButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  refreshButton: {
    paddingVertical: 12,
    alignItems: "center" as const,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  successContainer: {
    alignItems: "center" as const,
    paddingVertical: 32,
  },
  successText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: staticColors.success,
    marginTop: 16,
  },
});
