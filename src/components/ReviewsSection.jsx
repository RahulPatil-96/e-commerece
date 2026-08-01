import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

/**
 * @typedef {Object} Review
 * @property {number} id
 * @property {number} user_id
 * @property {number} product_id
 * @property {number} rating
 * @property {string} [title]
 * @property {string} [review_text]
 * @property {boolean} [verified_purchase]
 * @property {number} [helpful_count]
 * @property {string} created_at
 * @property {string} [first_name]
 * @property {string} [last_name]
 */

/**
 * @typedef {Object} ReviewStats
 * @property {number} totalReviews
 * @property {number} avgRating
 * @property {Object.<string, number>} distribution
 */

/**
 * Reviews section component for product detail page.
 * @param {{ productId: number }} props
 */
export default function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState(/** @type {Review[]} */ ([]));
  const [stats, setStats] = useState(/** @type {ReviewStats | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, title: '', review_text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    Promise.all([
      apiClient.entities.Review.list(productId, sort),
      apiClient.entities.Review.stats(productId),
    ])
      .then(([reviewData, statsData]) => {
        setReviews(Array.isArray(reviewData) ? reviewData : []);
        setStats(statsData || null);
      })
      .catch(() => {
        setReviews([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [productId, sort]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const newReview = await apiClient.entities.Review.create({
        product_id: productId,
        rating: formData.rating,
        title: formData.title || undefined,
        review_text: formData.review_text || undefined,
      });
      setReviews(prev => [newReview, ...prev]);
      setShowForm(false);
      setFormData({ rating: 5, title: '', review_text: '' });
      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await apiClient.entities.Review.delete(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({ title: 'Review deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete review', description: error.message });
    }
  };

const handleMarkHelpful = async (reviewId) => {
    try {
      await apiClient.entities.Review.helpful(reviewId);
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
      ));
    } catch {
      // Silently fail
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderStars = (rating = 0, interactive = false, onChange = () => {}) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onChange(star)}
            className={`w-4 h-4 ${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform ${
              star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'
            }`}
          >
            <Star className={`w-full h-full ${star <= rating ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-16 md:mt-24 border-t border-border pt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-medium">Customer Reviews</h2>
          {stats && (
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''} · {stats.avgRating.toFixed(1)} avg
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-border bg-card rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
          </select>
          {isAuthenticated && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              {showForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="bg-secondary/30 border border-border rounded-sm p-6 mb-8 space-y-4">
          <h3 className="font-display text-lg font-medium">Write Your Review</h3>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Rating</label>
            {renderStars(formData.rating, true, (rating) => setFormData({ ...formData, rating }))}
          </div>
          <div>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Review title (optional)"
              className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <textarea
              value={formData.review_text}
              onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              placeholder="Write your review..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-secondary animate-pulse rounded-sm" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-base mb-1">{review.title}</h4>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className="text-muted-foreground">
                      {review.first_name || review.email?.split('@')[0] || 'Anonymous'}
                    </span>
                    {review.verified_purchase && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleMarkHelpful(review.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
                    title="Mark as helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{review.helpful_count || 0}</span>
                  </button>
                  {user && (user.id === review.user_id || user.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
