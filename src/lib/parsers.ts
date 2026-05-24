export function parseCoords(latitude: string, longitude: string): { lat: number; lng: number } {
  if (!latitude.trim() || !longitude.trim()) throw new Error('Coordonnées invalides');
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Coordonnées invalides');
  return { lat, lng };
}

export function parseBudget(value: string): number {
  if (!value.trim()) throw new Error('Budget invalide');
  const budget = Number(value);
  if (!Number.isFinite(budget)) throw new Error('Budget invalide');
  return budget;
}
