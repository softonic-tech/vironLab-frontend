import { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Calculate stats
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
        setTotalReviews(data.length);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    if (!user) {
      alert('Please sign in to mark reviews as helpful');
      return;
    }

    try {
      await supabase.rpc('increment_review_helpful', { review_id: reviewId });
      loadReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-[#F59E0B] fill-[#F59E0B]'
                : 'text-[rgba(244,246,250,0.2)]'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-8 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-40 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
              </div>
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <MessageSquare className="w-6 h-6 text-[#2ED1B4]" />
        <h3 className="text-xl font-semibold text-[#F4F6FA]">Customer Reviews</h3>
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            {renderStars(Math.round(averageRating))}
            <span className="text-[#A9B3C7]">({totalReviews})</span>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="p-6 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] text-center">
          <p className="text-[#A9B3C7]">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-5 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {renderStars(review.rating)}
                    {review.is_verified_purchase && (
                      <span className="flex items-center gap-1 text-xs text-[#22C55E]">
                        <CheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-[#F4F6FA]">{review.title}</h4>
                  )}
                </div>
                <span className="text-xs text-[#A9B3C7]">
                  {new Date(review.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
              
              <p className="text-[#A9B3C7] mb-4">{review.comment}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#A9B3C7]">
                  {'Verified Buyer'}
                </span>
                <button
                  onClick={() => markHelpful(review.id)}
                  className="flex items-center gap-1 text-sm text-[#A9B3C7] hover:text-[#2ED1B4] transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpful_count})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}