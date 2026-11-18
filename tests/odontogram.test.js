import test from 'node:test';
import assert from 'node:assert/strict';
import { DENTITION, getToothSurfaces, getToothSurfaceType } from '../src/modules/odontograma/toothData.js';
import {
  EMPTY_ODONTOGRAM_FORM,
  FALLBACK_ODONTOGRAM_CATALOGS,
  buildOdontogramFields,
  loadOdontogramCatalogs,
  validateOdontogramCups,
  validateOdontogramSelection,
  withProcedureCode,
} from '../src/modules/odontograma/odontogramForm.js';
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

test('usa el enum ToothSurface del contrato en todas las piezas', () => {
  const expected = ['vestibular', 'lingual_palatino', 'mesial', 'distal', 'oclusal'];

  for (const tooth of ['11', '13', '16', '18', '51', '55', '71', '85']) {
    assert.deepEqual(getToothSurfaces(tooth), expected, `pieza ${tooth}`);
    assert.equal(getToothSurfaceType(tooth), 'oclusal', `pieza ${tooth}`);
  }
});

test('cada pieza permite seleccionar y deseleccionar sus cinco superficies', () => {
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
  selections = toggleToothSurface(selections, '16', 'oclusal');

  assert.deepEqual(selections['11'], { wholeTooth: true, surfaces: ['vestibular', 'mesial'] });
  assert.deepEqual(selections['16'], { wholeTooth: false, surfaces: ['oclusal'] });

  selections = toggleToothSurface(selections, '11', 'vestibular');
  selections = toggleWholeTooth(selections, '11');
  assert.deepEqual(selections['11'], { wholeTooth: false, surfaces: ['mesial'] });

  selections = toggleToothSurface(selections, '11', 'mesial');
  assert.equal(selections['11'], undefined);
});

test('genera payload estable por número FDI con las superficies seleccionadas', () => {
  const selections = {
    16: { wholeTooth: false, surfaces: ['distal', 'oclusal'] },
    11: { wholeTooth: true, surfaces: ['mesial'] },
  };

  assert.deepEqual(toToothSelectionPayload(selections), [
    { tooth_number: '11', whole_tooth: true, surfaces: ['mesial'] },
    { tooth_number: '16', whole_tooth: false, surfaces: ['distal', 'oclusal'] },
  ]);
});

test('ignora superficies fuera del enum ToothSurface', () => {
  assert.deepEqual(toggleToothSurface({}, '11', 'incisal'), {});
  assert.deepEqual(toggleToothSurface({}, '11', 'lingual'), {});
});

test('cups_code es obligatorio solo cuando hay procedimiento', () => {
  assert.equal(validateOdontogramCups({ ...EMPTY_ODONTOGRAM_FORM, condition_code: 'C1' }), '');
  assert.match(
    validateOdontogramCups({ ...EMPTY_ODONTOGRAM_FORM, procedure_code: 'resina' }),
    /CUPS/,
  );
  assert.equal(
    validateOdontogramCups({ ...EMPTY_ODONTOGRAM_FORM, procedure_code: 'resina', cups_code: '234105' }),
    '',
  );
  assert.match(
    validateOdontogramCups({ ...EMPTY_ODONTOGRAM_FORM, procedure_code: 'resina', cups_code: '1234567' }),
    /máximo 6/,
  );
});

test('exige un hallazgo o un procedimiento', () => {
  assert.match(validateOdontogramSelection(EMPTY_ODONTOGRAM_FORM), /hallazgo o un procedimiento/);
  assert.equal(validateOdontogramSelection({ ...EMPTY_ODONTOGRAM_FORM, condition_code: 'caries' }), '');
  assert.equal(validateOdontogramSelection({ ...EMPTY_ODONTOGRAM_FORM, procedure_code: 'resina' }), '');
});

test('usa los catálogos de respaldo cuando falla GET /odontogram/catalogs', async () => {
  const catalogs = await loadOdontogramCatalogs(async () => {
    throw new Error('Ruta no disponible');
  });

  assert.deepEqual(
    catalogs.conditions.map(({ code }) => code).sort(),
    FALLBACK_ODONTOGRAM_CATALOGS.conditions.map(({ code }) => code).sort(),
  );
  assert.deepEqual(
    catalogs.procedures.map(({ code }) => code).sort(),
    FALLBACK_ODONTOGRAM_CATALOGS.procedures.map(({ code }) => code).sort(),
  );
  assert.ok(catalogs.procedures.some(({ code, name }) => code === 'resina' && name === 'Resina'));
});

test('cambiar o quitar el procedimiento limpia el cups_code', () => {
  const base = { ...EMPTY_ODONTOGRAM_FORM, procedure_code: 'resina', cups_code: '234105' };

  assert.deepEqual(withProcedureCode(base, 'resina'), base);
  assert.deepEqual(withProcedureCode(base, 'corona'), { ...base, procedure_code: 'corona', cups_code: '' });
  assert.deepEqual(withProcedureCode(base, ''), { ...base, procedure_code: '', cups_code: '' });
});

test('envía el código interno en procedure_code y el buscador CUPS en cups_code', () => {
  const fields = buildOdontogramFields({
    appointment_id: '31',
    condition_code: ' caries ',
    procedure_code: ' resina ',
    cups_code: ' 234105 ',
    notes: ' Nota ',
  });

  assert.deepEqual(fields, {
    appointment_id: 31,
    condition_code: 'caries',
    procedure_code: 'resina',
    cups_code: '234105',
    notes: ' Nota ',
  });
  assert.notEqual(fields.procedure_code, '234105');
});

test('omite cups_code sin procedimiento y omite los campos vacíos', () => {
  const fields = buildOdontogramFields({
    appointment_id: '31',
    condition_code: 'caries',
    procedure_code: ' ',
    cups_code: '234105',
    notes: '  ',
  });

  assert.deepEqual(fields, { appointment_id: 31, condition_code: 'caries' });
  assert.equal('cups_code' in fields, false);
  assert.equal('procedure_code' in fields, false);
});

test('el CUPS 234105 solo puede enviarse como cups_code', () => {
  const fields = buildOdontogramFields({
    appointment_id: '31',
    procedure_code: 'resina',
    cups_code: '234105',
  });

  assert.equal(fields.procedure_code, 'resina');
  assert.equal(fields.cups_code, '234105');
  assert.notEqual(fields.procedure_code, '234105');
});
