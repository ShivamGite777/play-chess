// Simple ELO rating update
export function updateEloRatings(ratingA: number, ratingB: number, resultA: 0 | 0.5 | 1, kFactor = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));
  const newA = Math.round(ratingA + kFactor * (resultA - expectedA));
  const newB = Math.round(ratingB + kFactor * ((1 - resultA) - expectedB));
  return { newA, newB };
}
