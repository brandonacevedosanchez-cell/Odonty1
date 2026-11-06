import { getToothSurfaces } from './toothData.js';

function updateToothSelection(selections, toothNumber, update) {
  const current = selections[toothNumber] ?? { wholeTooth: false, surfaces: [] };
  const next = update(current);

  if (!next.wholeTooth && next.surfaces.length === 0) {
    const { [toothNumber]: removed, ...remaining } = selections;
    return remaining;
  }

  return { ...selections, [toothNumber]: next };
}

export function toggleToothSurface(selections, toothNumber, surface) {
  if (!getToothSurfaces(toothNumber).includes(surface)) return selections;

  return updateToothSelection(selections, toothNumber, (current) => ({
    ...current,
    surfaces: current.surfaces.includes(surface)
      ? current.surfaces.filter((selected) => selected !== surface)
      : [...current.surfaces, surface],
  }));
}

export function toggleWholeTooth(selections, toothNumber) {
  return updateToothSelection(selections, toothNumber, (current) => ({
    ...current,
    wholeTooth: !current.wholeTooth,
  }));
}

export function toToothSelectionPayload(selections) {
  return Object.entries(selections)
    .sort(([first], [second]) => Number(first) - Number(second))
    .map(([toothNumber, selection]) => ({
      tooth_number: toothNumber,
      whole_tooth: selection.wholeTooth,
      surfaces: getToothSurfaces(toothNumber).filter((surface) => selection.surfaces.includes(surface)),
    }));
}
