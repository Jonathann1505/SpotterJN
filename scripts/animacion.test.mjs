// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { PRESETS, construirAnimacion, imagenADataUri } from './animacion.mjs';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const plantilla = readFileSync(path.join(raiz, 'scripts', 'plantilla-animacion.html'), 'utf8');
const original = readFileSync(path.join(raiz, 'public', 'ejercicios', 'press-banca.html'), 'utf8');
const [arriba, medio, abajo] = [...original.matchAll(/src="(data:image\/webp;base64,[A-Za-z0-9+/=]+)"/gu)].map((m) => m[1]);
const descripcionOriginal = /aria-label="([^"]+)"/u.exec(original)?.[1] ?? '';

const carpeta = mkdtempSync(path.join(tmpdir(), 'spotter-animacion-'));
afterAll(() => rmSync(carpeta, { recursive: true, force: true }));

const base = {
  titulo: 'Sentadilla goblet',
  descripcion: 'Animación de la sentadilla goblet.',
  imagenes: { arriba: 'data:image/webp;base64,AAAA', medio: 'data:image/webp;base64,BBBB', abajo: 'data:image/webp;base64,CCCC' },
  pistas: PRESETS.piernas,
};

describe('construirAnimacion', () => {
  it('reproduce exactamente la animación del press de banca con sus mismos datos', () => {
    const html = construirAnimacion(plantilla, {
      titulo: 'Press de banca',
      descripcion: descripcionOriginal,
      imagenes: { arriba, medio, abajo },
      pistas: PRESETS.empuje,
    });

    expect(html).toBe(original);
  });

  it('inserta el título, las imágenes y las indicaciones del ejercicio', () => {
    const html = construirAnimacion(plantilla, base);

    expect(html).toContain('<title>Sentadilla goblet</title>');
    expect(html).toContain('src="data:image/webp;base64,AAAA"');
    expect(html).toContain('<span id="cue-text">Firme arriba</span>');
    expect(html).toContain('text: "Sube con fuerza" }');
    expect(html).not.toMatch(/\{\{\w+\}\}/u);
  });

  it('escapa comillas y etiquetas en los textos', () => {
    const html = construirAnimacion(plantilla, {
      ...base,
      titulo: 'Remo "pesado" <b>',
      pistas: ['Uno "a"', 'Dos', '</script>', 'Cuatro'],
    });

    expect(html).toContain('<title>Remo &quot;pesado&quot; &lt;b&gt;</title>');
    expect(html).toContain('text: "Uno \\"a\\"" }');
    expect(html).toContain('text: "\\u003c/script>" }');
    expect(html.match(/<\/script>/gu)).toHaveLength(1);
  });

  it.each([
    ['sin título', { titulo: '' }],
    ['con tres indicaciones', { pistas: ['a', 'b', 'c'] }],
    ['con una indicación vacía', { pistas: ['a', '', 'c', 'd'] }],
  ])('rechaza datos incompletos: %s', (_, cambios) => {
    expect(() => construirAnimacion(plantilla, { ...base, ...cambios })).toThrow();
  });

  it('rechaza una plantilla con un marcador desconocido', () => {
    expect(() => construirAnimacion('{{OTRO}}', base)).toThrow(/OTRO/u);
  });
});

describe('PRESETS', () => {
  it('cada tipo define cuatro indicaciones', () => {
    for (const pistas of Object.values(PRESETS)) {
      expect(pistas).toHaveLength(4);
    }
  });
});

describe('imagenADataUri', () => {
  it('convierte una imagen en un data URI con su tipo', () => {
    const archivo = path.join(carpeta, 'pose.png');
    writeFileSync(archivo, Buffer.from([1, 2, 3]));

    expect(imagenADataUri(archivo)).toBe('data:image/png;base64,AQID');
  });

  it('rechaza formatos no admitidos, archivos inexistentes y archivos muy pesados', () => {
    const gif = path.join(carpeta, 'pose.gif');
    writeFileSync(gif, 'x');
    const grande = path.join(carpeta, 'grande.webp');
    writeFileSync(grande, Buffer.alloc(301 * 1024));

    expect(() => imagenADataUri(gif)).toThrow(/Formato no admitido/u);
    expect(() => imagenADataUri(path.join(carpeta, 'no-existe.webp'))).toThrow(/No existe/u);
    expect(() => imagenADataUri(grande)).toThrow(/máximo/u);
  });
});
