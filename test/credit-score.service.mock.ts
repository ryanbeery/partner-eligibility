import type { CreditScoreService } from '../src/credit-score.service';

/** A service that answers with a fixed score. */
export const scoringService = (score: number): CreditScoreService => ({
  fetchScore: async () => score,
});

/** A service that is down, so the score cannot be verified either way. */
export const failingScoreService: CreditScoreService = {
  fetchScore: async () => {
    throw new Error('credit score service unavailable');
  },
};

/** A service that never answers, exercising the deadline rather than an error. */
export const hangingScoreService: CreditScoreService = {
  fetchScore: () => new Promise<number>(() => {}),
};
