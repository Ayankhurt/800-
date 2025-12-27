import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import {
  Star,
  ThumbsUp,
  Calendar,
  Filter,
  X,
  MessageSquare,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Review } from "@/types";

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

interface ReviewsListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

type SortOption = "recent" | "highest" | "lowest" | "helpful";
type FilterOption = "all" | 1 | 2 | 3 | 4 | 5;

function RatingStars({
  rating,
  size = 14,
  colors,
}: {
  rating: number;
  size?: number;
  colors: any;
}) {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          color={star <= rating ? colors.warning : colors.border}
          fill={star <= rating ? colors.warning : "transparent"}
        />
      ))}
    </View>
  );
}

function RatingDistribution({
  reviews,
  colors,
}: {
  reviews: Review[];
  colors: any;
}) {
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      counts[review.rating as keyof typeof counts]++;
    });
    return counts;
  }, [reviews]);

  return (
    <View style={styles.distributionContainer}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating as keyof typeof distribution];
        const percentage =
          reviews.length > 0 ? (count / reviews.length) * 100 : 0;

        return (
          <View key={rating} style={styles.distributionRow}>
            <View style={styles.distributionLabel}>
              <Text style={[styles.distributionRating, { color: colors.text }]}>
                {rating}
              </Text>
              <Star size={12} color={colors.warning} fill={colors.warning} />
            </View>
            <View
              style={[
                styles.distributionBarContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.distributionBar,
                  { width: `${percentage}%`, backgroundColor: colors.warning },
                ]}
              />
            </View>
            <Text
              style={[
                styles.distributionCount,
                { color: colors.textSecondary },
              ]}
            >
              {count}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ReviewCard({ review, colors }: { review: Review; colors: any }) {
  const [expanded, setExpanded] = useState(false);

  const shouldTruncate = review.comment.length > 200;
  const displayComment =
    shouldTruncate && !expanded
      ? review.comment.substring(0, 200) + "..."
      : review.comment;

  return (
    <View
      style={[
        styles.reviewCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAuthorContainer}>
          <View
            style={[
              styles.reviewAvatar,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>
              {review.authorName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Text>
          </View>
          <View style={styles.reviewAuthorInfo}>
            <Text style={[styles.reviewAuthor, { color: colors.text }]}>
              {review.authorName}
            </Text>
            <Text
              style={[styles.reviewCompany, { color: colors.textSecondary }]}
            >
              {review.authorCompany}
            </Text>
          </View>
        </View>
        <View style={styles.reviewRatingContainer}>
          <RatingStars rating={review.rating} size={14} colors={colors} />
        </View>
      </View>

      <View style={styles.reviewMeta}>
        <View style={styles.reviewMetaItem}>
          <Calendar size={12} color={colors.textTertiary} />
          <Text style={[styles.reviewMetaText, { color: colors.textTertiary }]}>
            {new Date(review.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        {review.projectType && (
          <View style={styles.reviewMetaItem}>
            <Text
              style={[
                styles.reviewProjectType,
                {
                  color: colors.primary,
                  backgroundColor: colors.primary + "15",
                },
              ]}
            >
              {review.projectType}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.reviewComment, { color: colors.text }]}>
        {displayComment}
      </Text>

      {shouldTruncate && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.expandButton}
        >
          <Text style={[styles.expandButtonText, { color: colors.primary }]}>
            {expanded ? "Show Less" : "Read More"}
          </Text>
        </TouchableOpacity>
      )}

      {review.response && (
        <View
          style={[
            styles.responseContainer,
            {
              backgroundColor: colors.background,
              borderLeftColor: colors.primary,
            },
          ]}
        >
          <View style={styles.responseHeader}>
            <MessageSquare size={14} color={colors.primary} />
            <Text style={[styles.responseTitle, { color: colors.primary }]}>
              Contractor Response
            </Text>
          </View>
          <Text style={[styles.responseMessage, { color: colors.text }]}>
            {review.response.message}
          </Text>
          <Text
            style={[styles.responseDate, { color: colors.textTertiary }]}
          >
            {new Date(review.response.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      )}

      <View style={[styles.reviewFooter, { borderTopColor: colors.border }]}>
        <View style={styles.reviewHelpful}>
          <ThumbsUp size={14} color={colors.textSecondary} />
          <Text
            style={[styles.reviewHelpfulText, { color: colors.textSecondary }]}
          >
            {review.helpful} found this helpful
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ReviewsList({
  reviews,
  averageRating,
  totalReviews,
}: ReviewsListProps) {
  const { colors } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterRating, setFilterRating] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  const sortedAndFilteredReviews = useMemo(() => {
    let filtered = [...reviews];

    if (filterRating !== "all") {
      filtered = filtered.filter((review) => review.rating === filterRating);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        case "helpful":
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, sortBy, filterRating]);

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Star size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
          No Reviews Yet
        </Text>
        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
          This contractor has not received any reviews yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.summaryLeft, { borderRightColor: colors.border }]}>
          <Text style={[styles.averageRating, { color: colors.text }]}>
            {averageRating.toFixed(1)}
          </Text>
          <RatingStars
            rating={Math.round(averageRating)}
            size={16}
            colors={colors}
          />
          <Text style={[styles.totalReviews, { color: colors.textSecondary }]}>
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.summaryRight}>
          <RatingDistribution reviews={reviews} colors={colors} />
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={16} color={colors.primary} />
          <Text style={[styles.filterButtonText, { color: colors.primary }]}>
            {filterRating === "all" ? "All Ratings" : `${filterRating} Stars`}
          </Text>
        </TouchableOpacity>

        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              sortBy === "recent" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSortBy("recent")}
          >
            <Text
              style={[
                styles.sortButtonText,
                { color: colors.textSecondary },
                sortBy === "recent" && { color: colors.white },
              ]}
            >
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              sortBy === "helpful" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSortBy("helpful")}
          >
            <Text
              style={[
                styles.sortButtonText,
                { color: colors.textSecondary },
                sortBy === "helpful" && { color: colors.white },
              ]}
            >
              Helpful
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              sortBy === "highest" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSortBy("highest")}
          >
            <Text
              style={[
                styles.sortButtonText,
                { color: colors.textSecondary },
                sortBy === "highest" && { color: colors.white },
              ]}
            >
              Highest
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {sortedAndFilteredReviews.length === 0 ? (
        <View style={styles.noResultsState}>
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            No reviews match your filter criteria
          </Text>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {sortedAndFilteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} colors={colors} />
          ))}
        </View>
      )}

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter Reviews
              </Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  filterRating === "all" && {
                    backgroundColor: colors.primary + "15",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  setFilterRating("all");
                  setShowFilters(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    { color: colors.text },
                    filterRating === "all" && {
                      color: colors.primary,
                      fontWeight: "600" as const,
                    },
                  ]}
                >
                  All Ratings
                </Text>
              </TouchableOpacity>

              {[5, 4, 3, 2, 1].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                    filterRating === rating && {
                      backgroundColor: colors.primary + "15",
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setFilterRating(rating as FilterOption);
                    setShowFilters(false);
                  }}
                >
                  <RatingStars rating={rating} size={14} colors={colors} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text },
                      filterRating === rating && {
                        color: colors.primary,
                        fontWeight: "600" as const,
                      },
                    ]}
                  >
                    {rating} Stars
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: "row" as const,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    gap: 24,
  },
  summaryLeft: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingRight: 24,
    borderRightWidth: 1,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 13,
    marginTop: 8,
  },
  summaryRight: {
    flex: 1,
  },
  distributionContainer: {
    gap: 6,
  },
  distributionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  distributionLabel: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    width: 32,
  },
  distributionRating: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  distributionBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  distributionBar: {
    height: "100%",
    borderRadius: 3,
  },
  distributionCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    width: 24,
    textAlign: "right" as const,
  },
  controls: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  sortButtons: {
    flexDirection: "row" as const,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  reviewAuthorContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  reviewAuthorInfo: {
    justifyContent: "center" as const,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  reviewCompany: {
    fontSize: 13,
  },
  reviewRatingContainer: {
    justifyContent: "center" as const,
  },
  starsContainer: {
    flexDirection: "row" as const,
    gap: 2,
  },
  reviewMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 12,
  },
  reviewMetaItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  reviewMetaText: {
    fontSize: 12,
  },
  reviewProjectType: {
    fontSize: 12,
    fontWeight: "600" as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  expandButton: {
    alignSelf: "flex-start" as const,
    marginBottom: 8,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  responseContainer: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  responseHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 8,
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  responseMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  responseDate: {
    fontSize: 11,
  },
  reviewFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  reviewHelpful: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  reviewHelpfulText: {
    fontSize: 12,
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
  noResultsState: {
    paddingVertical: 32,
    alignItems: "center" as const,
  },
  noResultsText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  filterOptions: {
    padding: 20,
    gap: 12,
  },
  filterOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
});
