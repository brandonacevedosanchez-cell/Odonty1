import test from 'node:test';
import assert from 'node:assert/strict';
import { DENTITION, getToothSurfaces, getToothSurfaceType } from '../src/modules/odontograma/toothData.js';
import { toggleToothSurface, toggleWholeTooth, toToothSelectionPayload } from '../src/modules/odontograma/toothSelection.js';

const allTeeth = (dentition) => [...dentition.upper, ...dentition.lower];

test('preserva los 32 dientes permanentes y los 20 temporales sin duplicados', () => {
  const permanent = allTeeth(DENTITION.permanent);
  const primary = allTeeth(DENTITION.primary);

  assert.equal(permanent.length, 32);
  assert.equal(new Set(permanent).size, 32);
  assert.equal(primary.length, 20);
  assert.equal(new Set(primary).size, 20);
  assert.equal(DENTITION.permanent.upper.length, 16);
  assert.equal(DENTITION.permanent.lower.length, 16);
  assert.equal(DENTITION.primary.upper.length, 10);
  assert.equal(DENTITION.primary.lower.length, 10);
});

test('clasifica dientes anteriores como incisales y posteriores como oclusales', () => {
  const anteriorTeeth = ['11', '13', '21', '23', '31', '33', '41', '43', '51', '53', '61', '63', '71', '73', '81', '83'];
  const posteriorTeeth = ['14', '18', '24', '28', '34', '38', '44', '48', '54', '55', '64', '65', '74', '75', '84', '85'];

  for (const tooth of anteriorTeeth) {
    assert.equal(getToothSurfaceType(tooth), 'incisal', `pieza ${tooth}`);
    assert.ok(getToothSurfaces(tooth).includes('incisal'));
  }
  for (const tooth of posteriorTeeth) {
    assert.equal(getToothSurfaceType(tooth), 'occlusal', `pieza ${tooth}`);
    assert.ok(getToothSurfaces(tooth).includes('occlusal'));
  }
});

test('cada pieza permite seleccionar y deseleccionar sus cuatro caras y su cara incisal u oclusal', () => {
  for (const toothNumber of ['11', '16']) {
    let selections = {};
    for (const surface of getToothSurfaces(toothNumber)) {
      selections = toggleToothSurface(selections, toothNumber, surface);
      assert.ok(selections[toothNumber].surfaces.includes(surface), `${toothNumber} ${surface} seleccionada`);
    }

    for (const surface of getToothSurfaces(toothNumber)) {
      selections = toggleToothSurface(selections, toothNumber, surface);
      assert.ok(!selections[toothNumber] || !selections[toothNumber].surfaces.includes(surface), `${toothNumber} ${surface} deseleccionada`);
    }
    assert.equal(selections[toothNumber], undefined);
  }
});

test('permite seleccionar y deseleccionar superficies y el diente completo por FDI', () => {
  let selections = {};
  selections = toggleToothSurface(selections, '11', 'vestibular');
  selections = toggleToothSurface(selections, '11', 'mesial');
  selections = toggleWholeTooth(selections, '11');
  selections = toggleToothSurface(selections, '16', 'occlusal');

  assert.deepEqual(selections['11'], { wholeTooth: true, surfaces: ['vestibular', 'mesial'] });
  assert.deepEqual(selections['16'], { wholeTooth: false, surfaces: ['occlusal'] });

  selections = toggleToothSurface(selections, '11', 'vestibular');
  selections = toggleWholeTooth(selections, '11');
  assert.deepEqual(selections['11'], { wholeTooth: false, surfaces: ['mesial'] });

  selections = toggleToothSurface(selections, '11', 'mesial');
  assert.equal(selections['11'], undefined);
});

test('genera payload estable por número FDI con las superficies seleccionadas', () => {
  const selections = {
    16: { wholeTooth: false, surfaces: ['distal', 'occlusal'] },
    11: { wholeTooth: true, surfaces: ['mesial'] },
  };

  assert.deepEqual(toToothSelectionPayload(selections), [
    { tooth_number: '11', whole_tooth: true, surfaces: ['mesial'] },
    { tooth_number: '16', whole_tooth: false, surfaces: ['distal', 'occlusal'] },
  ]);
});

test('ignora superficies que no corresponden al tipo de diente', () => {
  const selections = toggleToothSurface({}, '11', 'occlusal');
  assert.deepEqual(selections, {});
});
