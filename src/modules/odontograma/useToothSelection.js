import { useState } from 'react';
import { toggleToothSurface, toggleWholeTooth, toToothSelectionPayload } from './toothSelection.js';

export default function useToothSelection() {
  const [selections, setSelections] = useState({});

  return {
    selections,
    toggleSurface: (toothNumber, surface) => {
      setSelections((current) => toggleToothSurface(current, toothNumber, surface));
    },
    toggleWholeTooth: (toothNumber) => {
      setSelections((current) => toggleWholeTooth(current, toothNumber));
    },
    getPayload: () => toToothSelectionPayload(selections),
  };
}
