import { useCallback, useState } from 'react';
import { useCreateReviewMutation, useUpdateReviewMutation } from '@/features/server-state';
import type { RestaurantReview } from '@/types/api';

interface ReviewFormProps {
  restaurantId: string;
  sessionId?: string;
  initialReview?: RestaurantReview;
  isComplete: boolean;
  currentUserId: string;
  onSuccess?: (review: RestaurantReview) => void;
  onCancel?: () => void;
}

export function ReviewForm({
  restaurantId,
  sessionId,
  initialReview,
  isComplete,
  currentUserId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const isEdit = !!initialReview;
  const createMutation = useCreateReviewMutation();
  const updateMutation = useUpdateReviewMutation();

  const [rating, setRating] = useState<number>(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mutation = isEdit ? updateMutation : createMutation;
  const isSubmitting = mutation.isPending;

  const resetForm = useCallback(() => {
    setRating(0);
    setComment('');
    setFieldError(null);
  }, []);

  const validate = useCallback((): string | null => {
    if (rating < 1 || rating > 5) return 'Veuillez selectionner une note entre 1 et 5.';
    if (comment.length > 2000) return 'Le commentaire ne peut pas depasser 2000 caracteres.';
    return null;
  }, [rating, comment]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError(null);

    if (isEdit && initialReview) {
      updateMutation.mutate(
        {
          reviewId: initialReview.id,
          restaurantId,
          payload: { rating, comment: comment || null },
        },
        {
          onSuccess: (review) => {
            onSuccess?.(review);
          },
        },
      );
    } else if (sessionId) {
      createMutation.mutate(
        {
          restaurantId,
          payload: { sessionId, rating, comment: comment || undefined },
        },
        {
          onSuccess: (review) => {
            resetForm();
            onSuccess?.(review);
          },
        },
      );
    }
  }, [validate, isEdit, initialReview, updateMutation, restaurantId, rating, comment, onSuccess, sessionId, createMutation, resetForm]);

  const errorMessage = (() => {
    if (fieldError) return fieldError;
    const err = mutation.error;
    if (!err) return null;
    switch (err.status) {
      case 400: return 'Donnees invalides. Verifiez votre note.';
      case 403: return 'Vous n\'avez pas la permission de modifier cet avis.';
      case 404: return 'Avis introuvable.';
      case 409: return 'Un avis existe deja pour ce restaurant.';
      default: return 'Echec de la soumission. Veuillez reessayer.';
    }
  })();

  if (!isComplete && !isEdit) {
    return (
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <p className="text-sm text-muted">
          Les avis sont disponibles apres la fin de la session.
        </p>
      </div>
    );
  }

  if (isEdit && currentUserId !== initialReview?.userId) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-card bg-surface p-5 shadow-soft">
      <h3 className="text-lg font-bold text-fg">
        {isEdit ? 'Modifier votre avis' : 'Donnez votre avis'}
      </h3>

      {errorMessage && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-2">
        <label htmlFor="review-rating" className="text-sm font-semibold text-fg">
          Note
        </label>
        <div id="review-rating" className="flex gap-2" role="radiogroup" aria-label="Note">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`w-10 h-10 rounded-radius border text-lg font-bold transition-transform duration-150 ease-out active:scale-[0.97] ${
                star <= rating
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface border-border text-muted'
              }`}
              aria-label={`${star} etoile${star > 1 ? 's' : ''}`}
            >
              {star}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="review-comment" className="text-sm font-semibold text-fg">
          Commentaire (optionnel)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={3}
          className="rounded-radius border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted resize-y"
          placeholder="Partagez votre experience..."
        />
        <p className="text-xs text-muted">{comment.length}/2000</p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || rating < 1 || rating > 5}
          className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          {isSubmitting
            ? 'Envoi...'
            : isEdit
              ? 'Mettre a jour'
              : 'Publier'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
