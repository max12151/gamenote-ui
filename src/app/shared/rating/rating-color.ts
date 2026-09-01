/**
 * Couleur d'une note, du rouge (1) au vert (10).
 *
 * Une rampe continue plutôt que trois paliers : deux jeux notés 6 et 7 doivent se
 * distinguer, et un seuil arbitraire ferait basculer brutalement 6,4 et 6,6 de part et
 * d'autre. La clarté monte avec la note pour que le rouge sombre reste lisible sur blanc.
 *
 * La saturation est fixe : elle était écrite `100 + t * 6`, mais au-delà de 100 % les
 * navigateurs ramènent la valeur à 100 — le terme ne produisait rien.
 */
export function ratingColor(note: number): string {
  const t = (note - 1) / 9;
  const hue = 120 * t;
  const lightness = 25 + t * 25;
  return `hsl(${hue}, 100%, ${lightness}%)`;
}
