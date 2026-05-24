import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { ReviewForm } from '@/components/ReviewForm';
import { reviewFixtures, apiErrors } from '@/mocks/fixtures';

const BASE = 'http://localhost:3000/api';

function createWrapper(qc?: QueryClient) {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('ReviewForm', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('create mode', () => {
    it('shows form only when isComplete is true', () => {
      render(
        <ReviewForm restaurantId="rest-marcel" isComplete={true} currentUserId="user-alice" />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByText('Donnez votre avis')).toBeInTheDocument();
    });

    it('shows placeholder message when isComplete is false', () => {
      render(
        <ReviewForm restaurantId="rest-marcel" isComplete={false} currentUserId="user-alice" />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByText('Les avis sont disponibles apres la fin de la session.')).toBeInTheDocument();
      expect(screen.queryByText('Donnez votre avis')).not.toBeInTheDocument();
    });

    it('requires rating before submission', async () => {
      render(
        <ReviewForm restaurantId="rest-marcel" sessionId="session-monday" isComplete={true} currentUserId="user-alice" />,
        { wrapper: createWrapper() },
      );
      const submitBtn = screen.getByRole('button', { name: 'Publier' });
      expect(submitBtn).toBeDisabled();

      const starBtn = screen.getByRole('button', { name: '5 etoiles' });
      await userEvent.click(starBtn);
      expect(submitBtn).not.toBeDisabled();
    });

    it('enforces comment max length of 2000', async () => {
      render(
        <ReviewForm restaurantId="rest-marcel" sessionId="session-monday" isComplete={true} currentUserId="user-alice" />,
        { wrapper: createWrapper() },
      );
      const textarea = screen.getByPlaceholderText('Partagez votre experience...');
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });

    it('shows character count', async () => {
      render(
        <ReviewForm restaurantId="rest-marcel" sessionId="session-monday" isComplete={true} currentUserId="user-alice" />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByText('0/2000')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText('Partagez votre experience...');
      await userEvent.type(textarea, 'Bon');
      await waitFor(() => {
        expect(screen.getByText('3/2000')).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      server.use(
        http.post(`${BASE}/restaurants/:id/reviews`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return HttpResponse.json(reviewFixtures[0], { status: 201 });
        }),
      );
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      render(
        <ReviewForm restaurantId="rest-marcel" sessionId="session-monday" isComplete={true} currentUserId="user-alice" />,
        { wrapper: createWrapper(qc) },
      );

      const starBtn = screen.getByRole('button', { name: '4 etoiles' });
      await userEvent.click(starBtn);

      const submitBtn = screen.getByRole('button', { name: 'Publier' });
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Envoi...' })).toBeInTheDocument();
      });
    });

    it('successful create triggers reset', async () => {
      server.use(
        http.post(`${BASE}/restaurants/:id/reviews`, () =>
          HttpResponse.json(reviewFixtures[0], { status: 201 })),
      );
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      render(
        <ReviewForm restaurantId="rest-marcel" sessionId="session-monday" isComplete={true} currentUserId="user-alice" />,
        { wrapper: createWrapper(qc) },
      );

      const starBtn = screen.getByRole('button', { name: '3 etoiles' });
      await userEvent.click(starBtn);

      const submitBtn = screen.getByRole('button', { name: 'Publier' });
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Publier' })).toBeDisabled();
      });
    });
  });

  describe('edit mode', () => {
    it('pre-populates rating and comment from initialReview', () => {
      const review = reviewFixtures[0];
      render(
        <ReviewForm
          restaurantId="rest-marcel"
          initialReview={review}
          isComplete={true}
          currentUserId="user-alice"
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText('Modifier votre avis')).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText('Partagez votre experience...');
      expect(textarea).toHaveValue('Déçu, la qualité a baissé.');
    });

    it('hides form if not review author', () => {
      const review = reviewFixtures[0];
      const { container } = render(
        <ReviewForm
          restaurantId="rest-marcel"
          initialReview={review}
          isComplete={true}
          currentUserId="user-ben"
        />,
        { wrapper: createWrapper() },
      );
      expect(container.firstChild).toBeNull();
    });

    it('shows update button label', () => {
      const review = reviewFixtures[1];
      render(
        <ReviewForm
          restaurantId="rest-marcel"
          initialReview={review}
          isComplete={true}
          currentUserId="user-ben"
        />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByRole('button', { name: 'Mettre a jour' })).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('submit button is disabled when no rating', () => {
      render(
        <ReviewForm restaurantId="rest-marcel" sessionId="session-monday" isComplete={true} currentUserId="user-alice" />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByRole('button', { name: 'Publier' })).toBeDisabled();
    });

    it('shows error on API failure', async () => {
      server.use(
        http.post(`${BASE}/restaurants/:id/reviews`, () =>
          HttpResponse.json(apiErrors.validation({ rating: 'Rating must be 1-5' }), { status: 400 })),
      );
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      render(
        <ReviewForm
          restaurantId="rest-marcel"
          sessionId="session-monday"
          isComplete={true}
          currentUserId="user-alice"
        />,
        { wrapper: createWrapper(qc) },
      );

      const starBtn = screen.getByRole('button', { name: '3 etoiles' });
      await userEvent.click(starBtn);

      const submitBtn = screen.getByRole('button', { name: 'Publier' });
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
