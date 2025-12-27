import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  X,
  MapPin,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioItem } from "@/types";
import SafeImage from "@/components/SafeImage";

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

interface PortfolioGalleryProps {
  portfolio: PortfolioItem[];
}

type ViewMode = "grid" | "list";

const { width: screenWidth } = Dimensions.get("window");
const imageSize = (screenWidth - 48) / 2;

function ImageViewer({
  images,
  initialIndex,
  onClose,
  projectName,
  colors,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  projectName: string;
  colors: any;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.viewerContainer, { backgroundColor: "#000" }]}>
        <View style={styles.viewerHeader}>
          <View style={styles.viewerHeaderLeft}>
            <Text style={[styles.viewerTitle, { color: colors.white }]}>
              {projectName}
            </Text>
            <Text
              style={[
                styles.viewerCounter,
                { color: "rgba(255, 255, 255, 0.7)" },
              ]}
            >
              {currentIndex + 1} of {images.length}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.viewerCloseButton}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewerContent}>
          <SafeImage
            uri={images[currentIndex]}
            style={styles.viewerImage}
            resizeMode="contain"
          />

          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={goToPrevious}
              >
                <ChevronLeft size={32} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={goToNext}
              >
                <ChevronRight size={32} color={colors.white} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {images.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScroll}
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentIndex(index)}
                  style={[
                    styles.thumbnail,
                    currentIndex === index && {
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <SafeImage
                    uri={image}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

function PortfolioGridItem({
  item,
  onPress,
  colors,
}: {
  item: PortfolioItem;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress}>
      <View
        style={[
          styles.gridImageContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <SafeImage
          uri={item.images[0]}
          style={styles.gridImage}
          resizeMode="cover"
        />
        {item.images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Grid3x3 size={12} color={colors.white} />
            <Text style={[styles.imageCountText, { color: colors.white }]}>
              {item.images.length}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.gridItemInfo}>
        <Text
          style={[styles.gridItemTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.projectName}
        </Text>
        <Text style={[styles.gridItemCategory, { color: colors.textSecondary }]}>
          {item.category}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function PortfolioListItem({
  item,
  onPress,
  colors,
}: {
  item: PortfolioItem;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.listItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.listImageContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <SafeImage
          uri={item.images[0]}
          style={styles.listImage}
          resizeMode="cover"
        />
        {item.images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Grid3x3 size={12} color={colors.white} />
            <Text style={[styles.imageCountText, { color: colors.white }]}>
              {item.images.length}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.listItemInfo}>
        <Text
          style={[styles.listItemTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.projectName}
        </Text>
        <Text
          style={[styles.listItemDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <View style={styles.listItemMeta}>
          <View style={styles.listItemMetaItem}>
            <MapPin size={12} color={colors.textTertiary} />
            <Text
              style={[styles.listItemMetaText, { color: colors.textTertiary }]}
            >
              {item.location}
            </Text>
          </View>
          <View style={styles.listItemMetaItem}>
            <Calendar size={12} color={colors.textTertiary} />
            <Text
              style={[styles.listItemMetaText, { color: colors.textTertiary }]}
            >
              {new Date(item.completedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })}
            </Text>
          </View>
          {item.budget && (
            <View style={styles.listItemMetaItem}>
              <DollarSign size={12} color={colors.textTertiary} />
              <Text
                style={[styles.listItemMetaText, { color: colors.textTertiary }]}
              >
                {item.budget}
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {item.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioGallery({ portfolio }: PortfolioGalleryProps) {
  const { colors } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(
    null
  );
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const openProject = (project: PortfolioItem) => {
    setSelectedProject(project);
  };

  const closeProject = () => {
    setSelectedProject(null);
  };

  const openImageViewer = (index: number) => {
    setImageViewerIndex(index);
    setShowImageViewer(true);
  };

  if (portfolio.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Grid3x3 size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
          No Portfolio Items
        </Text>
        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
          This contractor has not added any portfolio items yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Portfolio ({portfolio.length} project
          {portfolio.length !== 1 ? "s" : ""})
        </Text>
        <View
          style={[
            styles.viewModeToggle,
            { backgroundColor: colors.background },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "grid" && { backgroundColor: colors.surface },
            ]}
            onPress={() => setViewMode("grid")}
          >
            <Grid3x3
              size={18}
              color={
                viewMode === "grid" ? colors.primary : colors.textSecondary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "list" && { backgroundColor: colors.surface },
            ]}
            onPress={() => setViewMode("list")}
          >
            <List
              size={18}
              color={
                viewMode === "list" ? colors.primary : colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "grid" ? (
        <View style={styles.grid}>
          {portfolio.map((item) => (
            <PortfolioGridItem
              key={item.id}
              item={item}
              onPress={() => openProject(item)}
              colors={colors}
            />
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {portfolio.map((item) => (
            <PortfolioListItem
              key={item.id}
              item={item}
              onPress={() => openProject(item)}
              colors={colors}
            />
          ))}
        </View>
      )}

      <Modal
        visible={selectedProject !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeProject}
      >
        {selectedProject && (
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedProject.projectName}
              </Text>
              <TouchableOpacity onPress={closeProject}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentInner}
            >
              <View style={styles.imageGallery}>
                {selectedProject.images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.galleryImage,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => openImageViewer(index)}
                  >
                    <SafeImage
                      uri={image}
                      style={styles.galleryImageView}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View
                style={[
                  styles.projectDetails,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.projectDetailRow}>
                  <Text
                    style={[
                      styles.projectDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Category
                  </Text>
                  <Text style={[styles.projectDetailValue, { color: colors.text }]}>
                    {selectedProject.category}
                  </Text>
                </View>

                <View style={styles.projectDetailRow}>
                  <Text
                    style={[
                      styles.projectDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Location
                  </Text>
                  <View style={styles.projectDetailValueRow}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <Text style={[styles.projectDetailValue, { color: colors.text }]}>
                      {selectedProject.location}
                    </Text>
                  </View>
                </View>

                <View style={styles.projectDetailRow}>
                  <Text
                    style={[
                      styles.projectDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Completed
                  </Text>
                  <View style={styles.projectDetailValueRow}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={[styles.projectDetailValue, { color: colors.text }]}>
                      {new Date(
                        selectedProject.completedDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {selectedProject.budget && (
                  <View style={styles.projectDetailRow}>
                    <Text
                      style={[
                        styles.projectDetailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Budget
                    </Text>
                    <View style={styles.projectDetailValueRow}>
                      <DollarSign size={16} color={colors.success} />
                      <Text
                        style={[
                          styles.projectDetailValue,
                          {
                            color: colors.success,
                            fontWeight: "700" as const,
                          },
                        ]}
                      >
                        {selectedProject.budget}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.projectDescription,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.projectDescriptionTitle,
                    { color: colors.text },
                  ]}
                >
                  Description
                </Text>
                <Text
                  style={[styles.projectDescriptionText, { color: colors.text }]}
                >
                  {selectedProject.description}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {showImageViewer && selectedProject && (
        <ImageViewer
          images={selectedProject.images}
          initialIndex={imageViewerIndex}
          onClose={() => setShowImageViewer(false)}
          projectName={selectedProject.projectName}
          colors={colors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  viewModeToggle: {
    flexDirection: "row" as const,
    gap: 4,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 6,
  },
  grid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  gridItem: {
    width: imageSize,
    marginBottom: 12,
  },
  gridImageContainer: {
    position: "relative" as const,
    width: "100%",
    height: imageSize,
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  imageCountBadge: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageCountText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  gridItemInfo: {
    marginTop: 8,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  gridItemCategory: {
    fontSize: 12,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: "row" as const,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  listImageContainer: {
    position: "relative" as const,
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden" as const,
  },
  listImage: {
    width: "100%",
    height: "100%",
  },
  listItemInfo: {
    flex: 1,
    justifyContent: "space-between" as const,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  listItemMeta: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 8,
  },
  listItemMetaItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  listItemMetaText: {
    fontSize: 12,
  },
  categoryBadge: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center" as const,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    flex: 1,
    marginRight: 16,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
  },
  imageGallery: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 24,
  },
  galleryImage: {
    width: (screenWidth - 48) / 2,
    height: (screenWidth - 48) / 2,
    borderRadius: 8,
    overflow: "hidden" as const,
  },
  galleryImageView: {
    width: "100%",
    height: "100%",
  },
  projectDetails: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
    borderWidth: 1,
  },
  projectDetailRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  projectDetailLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  projectDetailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  projectDetailValueRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  projectDescription: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  projectDescriptionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  projectDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewerContainer: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  viewerHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  viewerCounter: {
    fontSize: 13,
  },
  viewerCloseButton: {
    padding: 8,
  },
  viewerContent: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  viewerImage: {
    width: screenWidth,
    height: "100%",
  },
  navButton: {
    position: "absolute" as const,
    top: "50%",
    transform: [{ translateY: -24 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 24,
    padding: 8,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  thumbnailContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 12,
  },
  thumbnailScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: "hidden" as const,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
});
