export const getCountdown = (deadlineStr: string): string => {
  const deadline = new Date(deadlineStr).getTime();
  const now = new Date().getTime();
  const distance = deadline - now;

  if (distance < 0) return "Expiré";

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}j ${hours}h restant(s)`;
  return `${hours}h ${minutes}m restant(s)`;
};