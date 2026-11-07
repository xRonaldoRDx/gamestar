import React from 'react';
import AppText from './AppText';

export function formatRating(rating) {
  return Number(rating) > 0 ? `★ ${Number(rating).toFixed(1)}/5.0` : 'Sem nota';
}

export default function RatingLabel({ rating, variant = 'subtitle', style }) {
  return (
    <AppText variant={variant} tone="warning" style={[{ fontWeight: '700' }, style]}>
      {formatRating(rating)}
    </AppText>
  );
}
