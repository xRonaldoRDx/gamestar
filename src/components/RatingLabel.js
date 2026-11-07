import React from 'react';
import AppText from './AppText';

export function isValidRating(rating) {
  return typeof rating === 'number' && !Number.isNaN(rating);
}

export function formatRating(rating) {
  return isValidRating(rating) ? `★ ${rating.toFixed(1)}/5.0` : 'Sem nota';
}

export default function RatingLabel({ rating, variant = 'subtitle', style }) {
  return (
    <AppText variant={variant} tone="warning" style={[{ fontWeight: '700' }, style]}>
      {formatRating(rating)}
    </AppText>
  );
}
