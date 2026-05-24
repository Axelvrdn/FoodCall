import { useCallback, useState } from 'react';
import { useRestaurantReviewsQuery } from '@/features/server-state';
import { useDeleteReviewMutation } from '@/features/server-state';
import { ReviewForm } from './ReviewForm';
import { formatDate } from '@/lib/formatters';
import type { RestaurantReview } from '@/types/api';

interface ReviewItemProps {
  review: RestaurantReview;
  isAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ReviewItem({ review, isAuthor, onEdit, onDelete, isDeleting }: ReviewItemProps) {
  return (
    <article className="rounded-card bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">
              {review.rating}/5
            </span>
          </div>
          {review.comment && (
            <p className="mt-1 text-muted text-sm">{review.comment}</p>
          )}
          <p className="mt-2 text-xs text-muted">
            {formatDate(review.createdAt)}
          </p>
        </div>
        {isAuthor && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-radius bg-surface border border-border px-3 py-1.5 text-xs font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Modifier
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onDelete}
              className="rounded-radius bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

interface ReviewsListProps {
  restaurantId: string;
  currentUserId?: string;
  onReviewEdited?: () => void;
  onReviewDeleted?: () => void;
}

export function ReviewsList({ restaurantId, currentUserId, onReviewEdited, onReviewDeleted }: ReviewsListProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allReviews, setAllReviews] = useState<RestaurantReview[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useRestaurantReviewsQuery(restaurantId, cursor);
  const deleteMutation = useDeleteReviewMutation();

  const mergedReviews = (() => {
    if (!data) return allReviews;
    if (cursor === undefined) return data.data;
    const existingIds = new Set(allReviews.map((r) => r.id));
    const newReviews = data.data.filter((r) => !existingIds.has(r.id));
    return [...allReviews, ...newReviews];
  })();

  const loadMore = useCallback(() => {
    if (data?.meta.nextCursor) {
      setAllReviews(mergedReviews);
      setCursor(data.meta.nextCursor);
    }
  }, [data, mergedReviews]);

  const handleDelete = useCallback((reviewId: string) => {
    setDeletingReviewId(reviewId);
    deleteMutation.mutate(
      { reviewId, restaurantId },
      {
        onSettled: () => setDeletingReviewId(null),
        onSuccess: () => onReviewDeleted?.(),
      },
    );
  }, [deleteMutation, restaurantId, onReviewDeleted]);

  const handleEditSuccess = useCallback(() => {
    setEditingReviewId(null);
    onReviewEdited?.();
  }, [onReviewEdited]);

  const editReview = mergedReviews.find((r) => r.id === editingReviewId);

  const totalRating = (() => {
    if (mergedReviews.length === 0) return null;
    const avg = mergedReviews.reduce((sum, r) => sum + r.rating, 0) / mergedReviews.length;
    return { average: avg, count: mergedReviews.length };
  })();

  if (isLoading && allReviews.length === 0) {
    return (
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <p role="status" className="text-sm text-muted">Chargement des avis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <div role="alert" className="rounded bg-danger/10 p-4 text-sm text-danger">
          Impossible de charger les avis.
        </div>
        <button
          type="button"
          className="mt-3 rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          onClick={() => refetch()}
        >
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-card bg-surface p-5 shadow-soft">
        {totalRating ? (
          <p className="text-sm font-semibold text-fg">
            {totalRating.average.toFixed(1)} / 5
            {' '}<span className="text-muted font-normal">sur {totalRating.count} avis affichés</span>
          </p>
        ) : (
          <p className="text-sm text-muted">Soyez le premier a donner votre avis</p>
        )}
      </div>

      {editReview && currentUserId && (
        <ReviewForm
          restaurantId={restaurantId}
          initialReview={editReview}
          isComplete={true}
          currentUserId={currentUserId}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingReviewId(null)}
        />
      )}

      <div className="grid gap-3">
        {mergedReviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            isAuthor={currentUserId === review.userId}
            onEdit={() => setEditingReviewId(review.id)}
            onDelete={() => handleDelete(review.id)}
            isDeleting={deletingReviewId === review.id}
          />
        ))}
        {data?.meta.nextCursor && (
          <button
            type="button"
            onClick={loadMore}
            className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97] self-start"
          >
            Charger plus d&apos;avis
          </button>
        )}
      </div>
    </div>
  );
}
