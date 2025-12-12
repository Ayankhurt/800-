import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Create Enhanced Review with Category Ratings
export const createReview = async (req, res) => {
    try {
        const reviewerId = req.user.id;
        const {
            project_id,
            reviewee_id,
            rating,
            comment,
            category_ratings, // { quality, communication, timeline, professionalism, value }
            photo_urls
        } = req.body;

        // Validate project participation
        const { data: project } = await supabase.from("projects").select("*").eq("id", project_id).single();
        if (!project) return res.status(404).json(formatResponse(false, "Project not found", null));

        if (project.owner_id !== reviewerId && project.contractor_id !== reviewerId) {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        // Calculate overall rating from category ratings if provided
        let overallRating = rating;
        if (category_ratings) {
            const ratings = Object.values(category_ratings);
            overallRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        }

        const { data, error } = await supabase
            .from("reviews")
            .insert({
                project_id,
                reviewer_id: reviewerId,
                reviewee_id,
                rating: overallRating,
                comment,
                category_ratings: category_ratings || null,
                photo_urls: photo_urls || []
            })
            .select()
            .single();

        if (error) throw error;

        // Update user's average rating
        await updateUserAverageRating(reviewee_id);

        return res.status(201).json(formatResponse(true, "Review submitted", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get User Reviews
export const getUserReviews = async (req, res) => {
    try {
        const { user_id } = req.params;

        const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("reviewee_id", user_id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Calculate category averages
        const categoryAverages = calculateCategoryAverages(data);

        return res.json(formatResponse(true, "Reviews retrieved", {
            reviews: data,
            total: data.length,
            categoryAverages
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Contractor Response to Review
export const respondToReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;
        const { response } = req.body;

        // Get review
        const { data: review, error: reviewError } = await supabase
            .from("reviews")
            .select("*")
            .eq("id", reviewId)
            .single();

        if (reviewError || !review) {
            return res.status(404).json(formatResponse(false, "Review not found"));
        }

        // Verify user is the reviewee (contractor being reviewed)
        if (review.reviewee_id !== userId) {
            return res.status(403).json(formatResponse(false, "Only the reviewed contractor can respond"));
        }

        // Update review with response
        const { data, error } = await supabase
            .from("reviews")
            .update({
                contractor_response: response,
                response_date: new Date().toISOString()
            })
            .eq("id", reviewId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json(formatResponse(true, "Response added successfully", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Helper: Update User Average Rating
async function updateUserAverageRating(userId) {
    const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", userId);

    if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
            .from("users")
            .update({
                average_rating: avgRating,
                total_reviews: reviews.length
            })
            .eq("id", userId);
    }
}

// Helper: Calculate Category Averages
function calculateCategoryAverages(reviews) {
    if (!reviews || reviews.length === 0) return null;

    const categories = ['quality', 'communication', 'timeline', 'professionalism', 'value'];
    const averages = {};

    categories.forEach(category => {
        const ratingsWithCategory = reviews.filter(r => r.category_ratings && r.category_ratings[category]);
        if (ratingsWithCategory.length > 0) {
            const sum = ratingsWithCategory.reduce((acc, r) => acc + r.category_ratings[category], 0);
            averages[category] = sum / ratingsWithCategory.length;
        }
    });

    return averages;
}
