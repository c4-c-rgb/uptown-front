export const formatCOP = (value) => {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    currencyDisplay: 'code',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(n);
};
