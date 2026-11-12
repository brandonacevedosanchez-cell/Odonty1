/**
 * Generador mínimo de códigos QR (modo byte, versión 10, corrección L, máscara 0).
 *
 * Se incluye en el proyecto para mostrar el secreto TOTP sin enviarlo a servicios
 * externos. No pretende ser una librería general: solo cubre el tamaño necesario
 * para una URI `otpauth://` (hasta 271 bytes). Si el texto es más largo,
 * `createQrMatrix` devuelve null y la pantalla muestra el secreto manualmente.
 */

const VERSION = 10;
const SIZE = VERSION * 4 + 17;
const ECC_CODEWORDS_PER_BLOCK = 18;
// Versión 10-L: 2 bloques de 68 + 2 bloques de 69 = 274 codewords de datos.
const DATA_BLOCKS = [68, 68, 69, 69];
const DATA_CODEWORDS = DATA_BLOCKS.reduce((total, length) => total + length, 0);
const MAX_BYTES = 271;

/* ---------- Aritmética de GF(256) ---------- */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = value;
    LOG[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function generatorPolynomial(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

const GENERATOR = generatorPolynomial(ECC_CODEWORDS_PER_BLOCK);

function reedSolomon(data) {
  const buffer = new Array(data.length + ECC_CODEWORDS_PER_BLOCK).fill(0);
  data.forEach((value, index) => { buffer[index] = value; });
  for (let i = 0; i < data.length; i += 1) {
    const factor = buffer[i];
    if (factor === 0) continue;
    for (let j = 0; j < GENERATOR.length; j += 1) {
      buffer[i + j] ^= gfMul(GENERATOR[j], factor);
    }
  }
  return buffer.slice(data.length);
}

/* ---------- Flujo de bits ---------- */

function buildCodewords(bytes) {
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };

  push(0b0100, 4); // Modo byte
  push(bytes.length, 16); // Versión 10 usa contador de 16 bits
  bytes.forEach((byte) => push(byte, 8));

  const capacity = DATA_CODEWORDS * 8;
  const terminator = Math.min(4, Math.max(0, capacity - bits.length));
  for (let i = 0; i < terminator; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  let pad = 0;
  while (codewords.length < DATA_CODEWORDS) {
    codewords.push(pad % 2 === 0 ? 0xec : 0x11);
    pad += 1;
  }
  return codewords;
}

function interleave(codewords) {
  const blocks = [];
  let offset = 0;
  DATA_BLOCKS.forEach((length) => {
    const data = codewords.slice(offset, offset + length);
    offset += length;
    blocks.push({ data, ecc: reedSolomon(data) });
  });

  const result = [];
  const maxLength = Math.max(...blocks.map((block) => block.data.length));
  for (let i = 0; i < maxLength; i += 1) {
    blocks.forEach((block) => {
      if (i < block.data.length) result.push(block.data[i]);
    });
  }
  for (let i = 0; i < ECC_CODEWORDS_PER_BLOCK; i += 1) {
    blocks.forEach((block) => result.push(block.ecc[i]));
  }
  return result;
}

/* ---------- Matriz ---------- */

function createMatrix() {
  const modules = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  const reserved = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));

  const setFunction = (x, y, dark) => {
    modules[y][x] = Boolean(dark);
    reserved[y][x] = true;
  };

  const drawFinder = (originX, originY) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const x = originX + dx;
        const y = originY + dy;
        if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) continue;
        const distance = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        setFunction(x, y, distance !== 2 && distance !== 4);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(SIZE - 7, 0);
  drawFinder(0, SIZE - 7);

  for (let i = 8; i < SIZE - 8; i += 1) {
    setFunction(i, 6, i % 2 === 0);
    setFunction(6, i, i % 2 === 0);
  }

  const centers = [6, 28, 50];
  centers.forEach((cy) => {
    centers.forEach((cx) => {
      const overlapsFinder =
        (cx === 6 && cy === 6) ||
        (cx === SIZE - 7 && cy === 6) ||
        (cx === 6 && cy === SIZE - 7);
      if (overlapsFinder) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    });
  });

  // Módulo oscuro fijo.
  setFunction(8, SIZE - 8, true);

  // Reservar las zonas de formato y versión antes de colocar los datos.
  for (let i = 0; i <= 5; i += 1) reserved[i][8] = true;
  reserved[7][8] = true;
  reserved[8][8] = true;
  reserved[8][7] = true;
  for (let i = 9; i < 15; i += 1) reserved[8][14 - i] = true;
  for (let i = 0; i < 8; i += 1) reserved[8][SIZE - 1 - i] = true;
  for (let i = 8; i < 15; i += 1) reserved[SIZE - 15 + i][8] = true;

  for (let i = 0; i < 18; i += 1) {
    const a = SIZE - 11 + (i % 3);
    const b = Math.floor(i / 3);
    reserved[b][a] = true;
    reserved[a][b] = true;
  }

  return { modules, reserved, setFunction };
}

function placeData(matrix, codewords) {
  const { modules, reserved } = matrix;
  const totalBits = codewords.length * 8;
  const bitAt = (index) => index < totalBits && ((codewords[index >>> 3] >>> (7 - (index & 7))) & 1) === 1;

  let index = 0;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < SIZE; vertical += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? SIZE - 1 - vertical : vertical;
        if (reserved[y][x]) continue;
        let dark = bitAt(index);
        index += 1;
        if ((x + y) % 2 === 0) dark = !dark; // Máscara 0
        modules[y][x] = dark;
      }
    }
  }
}

function formatBits() {
  const data = (1 << 3) | 0; // Nivel L + máscara 0
  let remainder = data;
  for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  return ((data << 10) | remainder) ^ 0x5412;
}

function versionBits() {
  let remainder = VERSION;
  for (let i = 0; i < 12; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
  return (VERSION << 12) | remainder;
}

function drawFormatAndVersion(matrix) {
  const { setFunction } = matrix;
  const bits = formatBits();
  const bit = (i) => ((bits >>> i) & 1) === 1;

  for (let i = 0; i <= 5; i += 1) setFunction(8, i, bit(i));
  setFunction(8, 7, bit(6));
  setFunction(8, 8, bit(7));
  setFunction(7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, bit(i));

  for (let i = 0; i < 8; i += 1) setFunction(SIZE - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i += 1) setFunction(8, SIZE - 15 + i, bit(i));
  setFunction(8, SIZE - 8, true);

  const vBits = versionBits();
  const vBit = (i) => ((vBits >>> i) & 1) === 1;
  for (let i = 0; i < 18; i += 1) {
    const a = SIZE - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFunction(a, b, vBit(i));
    setFunction(b, a, vBit(i));
  }
}

/** Devuelve { size, modules } o null si el texto excede la capacidad. */
export function createQrMatrix(text) {
  const bytes = new TextEncoder().encode(String(text ?? ''));
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;

  const matrix = createMatrix();
  const codewords = interleave(buildCodewords([...bytes]));
  placeData(matrix, codewords);
  drawFormatAndVersion(matrix);
  return { size: SIZE, modules: matrix.modules };
}
