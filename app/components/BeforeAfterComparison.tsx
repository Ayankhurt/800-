import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
} from "react-native";
import { ArrowRightLeft, X } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { BeforeAfter } from "@/types";
import SafeImage from "./SafeImage";

const staticColors = {
  primary: "#2563EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  white: "#FFFFFF",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
};

interface BeforeAfterComparisonProps {
  projects: BeforeAfter[];
}

export default function BeforeAfterComparison({
  projects,
}: BeforeAfterComparisonProps) {
  const { colors } = useAuth();
  const [selectedProject, setSelectedProject] = useState<BeforeAfter | null>(
    null
  );

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <ArrowRightLeft size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Before & After
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {projects.map((project) => (
            <Pressable
              key={project.id}
              style={[
                styles.projectCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedProject(project)}
            >
              <View style={styles.imagesContainer}>
                <View style={styles.imageWrapper}>
                  <SafeImage uri={project.beforeImage} style={styles.image} />
                  <View style={styles.labelBadge}>
                    <Text style={[styles.labelText, { color: colors.white }]}>
                      Before
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.arrowDivider,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.arrowCircle,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <ArrowRightLeft size={16} color={colors.white} />
                  </View>
                </View>

                <View style={styles.imageWrapper}>
                  <SafeImage uri={project.afterImage} style={styles.image} />
                  <View
                    style={[
                      styles.labelBadge,
                      styles.afterBadge,
                      { backgroundColor: colors.success + "DD" },
                    ]}
                  >
                    <Text style={[styles.labelText, { color: colors.white }]}>
                      After
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.projectInfo}>
                <Text
                  style={[styles.projectName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {project.projectName}
                </Text>
                <Text
                  style={[styles.category, { color: colors.textSecondary }]}
                >
                  {project.category}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={selectedProject !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedProject(null)}
      >
        {selectedProject && (
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <Pressable
                style={[styles.closeButton, { backgroundColor: colors.surface }]}
                onPress={() => setSelectedProject(null)}
              >
                <X size={24} color={colors.text} />
              </Pressable>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedProject.projectName}
                </Text>

                <View style={styles.modalImagesContainer}>
                  <View style={styles.modalImageSection}>
                    <Text
                      style={[
                        styles.modalImageLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Before
                    </Text>
                    <SafeImage
                      uri={selectedProject.beforeImage}
                      style={styles.modalImage}
                    />
                  </View>

                  <View style={styles.modalImageSection}>
                    <Text
                      style={[
                        styles.modalImageLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      After
                    </Text>
                    <SafeImage
                      uri={selectedProject.afterImage}
                      style={styles.modalImage}
                    />
                  </View>
                </View>

                <View style={styles.modalDetails}>
                  <Text
                    style={[
                      styles.modalDescription,
                      { color: colors.text },
                    ]}
                  >
                    {selectedProject.description}
                  </Text>

                  <View style={styles.modalMeta}>
                    <View style={styles.metaItem}>
                      <Text
                        style={[
                          styles.metaLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Category
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: colors.text }]}
                      >
                        {selectedProject.category}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text
                        style={[
                          styles.metaLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Completed
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: colors.text }]}
                      >
                        {new Date(
                          selectedProject.completionDate
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  scrollContent: {
    gap: 16,
    paddingRight: 20,
  },
  projectCard: {
    width: screenWidth - 80,
    maxWidth: 400,
    borderRadius: 12,
    overflow: "hidden" as const,
    borderWidth: 1,
  },
  imagesContainer: {
    flexDirection: "row" as const,
    height: 180,
  },
  imageWrapper: {
    flex: 1,
    position: "relative" as const,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  labelBadge: {
    position: "absolute" as const,
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  afterBadge: {},
  labelText: {
    fontSize: 11,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  arrowDivider: {
    width: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  projectInfo: {
    padding: 12,
  },
  projectName: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center" as const,
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: "90%",
    overflow: "hidden" as const,
  },
  closeButton: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    padding: 20,
    paddingRight: 60,
  },
  modalImagesContainer: {
    gap: 16,
    paddingHorizontal: 20,
  },
  modalImageSection: {
    gap: 8,
  },
  modalImageLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  modalDetails: {
    padding: 20,
    gap: 16,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalMeta: {
    flexDirection: "row" as const,
    gap: 24,
  },
  metaItem: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
  },
  metaValue: {
    fontSize: 14,
  },
});
