/**
 * Pure formatting functions for transit events — titles, ranges, labels
 */

const PLANET_LABELS_TR = {
  sun: "Gunes", moon: "Ay", mercury: "Merkur", venus: "Venus",
  mars: "Mars", jupiter: "Jupiter", saturn: "Saturn",
  uranus: "Uranus", neptune: "Neptun", pluto: "Pluton",
  asc: "Yukselen", mc: "MC",
};

const ASPECT_LABELS_TR = {
  conjunction: "Kavusum", opposition: "Karsit", trine: "Ucgen",
  square: "Kare", sextile: "Sekstil",
};

function buildTitle(event) {
  if (event.type === "retrograde") {
    return `${PLANET_LABELS_TR[event.transitPlanet] || event.transitPlanet} Retrosu`;
  }
  if (event.type === "lunar_return") return "Ay Donusu";
  const tp = PLANET_LABELS_TR[event.transitPlanet] || event.transitPlanet;
  const np = PLANET_LABELS_TR[event.natalPlanet] || event.natalPlanet;
  const asp = ASPECT_LABELS_TR[event.aspect] || event.aspect;
  return `${tp} ${asp} ${np}`;
}

function buildRangeText(event) {
  if (event.startDate === event.endDate) return `${event.startDate} (doruk: ${event.exactDate})`;
  return `${event.startDate} - ${event.endDate} arasi (doruk: ${event.exactDate})`;
}

module.exports = {
  buildTitle,
  buildRangeText,
  PLANET_LABELS_TR,
  ASPECT_LABELS_TR,
};
