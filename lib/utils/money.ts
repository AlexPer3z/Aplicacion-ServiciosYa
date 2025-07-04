export function formatMoney(amount: number): string {
  const isWholeNumber = amount % 1 === 0;
  const options = {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2,
    useGrouping: true,
  };
  return new Intl.NumberFormat("es-AR", options).format(amount);
}
