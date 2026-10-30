import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const rutaPlantilla = path.join(raiz, 'scripts', 'plantilla-animacion.html');
const TAMANO_MAXIMO = 300 * 1024;
const TIPOS_MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/** Indicaciones que acompañan el movimiento: [pose de arriba, fase lenta, pausa, fase rápida]. */
export const PRESETS = {
  empuje: ['Bloquea arriba', 'Baja controlado', 'Pausa abajo', 'Empuja'],
  tiron: ['Brazos estirados', 'Tira controlado', 'Aprieta y pausa', 'Vuelve despacio'],
  piernas: ['Firme arriba', 'Baja controlado', 'Pausa abajo', 'Sube con fuerza'],
};

const escaparHtml = (texto) =>
  texto.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');

const escaparJs = (texto) => JSON.stringify(texto).slice(1, -1).replace(/</gu, '\\u003c');

/** Reemplaza los marcadores de la plantilla y devuelve el HTML de la animación. */
export function construirAnimacion(plantilla, { titulo, descripcion, imagenes, pistas }) {
  if (!titulo || !descripcion) {
    throw new Error('Hacen falta un título y una descripción.');
  }

  if (!Array.isArray(pistas) || pistas.length !== 4 || pistas.some((p) => !p || !p.trim())) {
    throw new Error('Hacen falta exactamente 4 indicaciones, ninguna vacía.');
  }

  const valores = {
    TITULO: escaparHtml(titulo),
    DESCRIPCION: escaparHtml(descripcion),
    IMG_ARRIBA: imagenes.arriba,
    IMG_MEDIO: imagenes.medio,
    IMG_ABAJO: imagenes.abajo,
    PISTA_1: escaparHtml(pistas[0]),
  };
  pistas.forEach((pista, indice) => {
    valores[`PISTA_${indice + 1}_JS`] = escaparJs(pista);
  });

  return plantilla.replace(/\{\{(\w+)\}\}/gu, (_, nombre) => {
    if (!(nombre in valores)) {
      throw new Error(`La plantilla usa un marcador desconocido: ${nombre}`);
    }
    return valores[nombre];
  });
}

export function imagenADataUri(archivo) {
  const mime = TIPOS_MIME[path.extname(archivo).toLowerCase()];
  if (!mime) {
    throw new Error(`Formato no admitido en ${archivo}. Usa .webp, .png o .jpg.`);
  }

  if (!existsSync(archivo)) {
    throw new Error(`No existe la imagen ${archivo}.`);
  }

  const tamano = statSync(archivo).size;
  if (tamano > TAMANO_MAXIMO) {
    throw new Error(
      `${archivo} pesa ${Math.round(tamano / 1024)} KB y el máximo es ${TAMANO_MAXIMO / 1024} KB. Expórtala en WebP a unos 500 px.`,
    );
  }

  return `data:${mime};base64,${readFileSync(archivo).toString('base64')}`;
}

function leerOpciones(argumentos) {
  const opciones = {};
  for (let i = 0; i < argumentos.length; i += 2) {
    const nombre = argumentos[i];
    if (!nombre.startsWith('--') || argumentos[i + 1] === undefined) {
      throw new Error(`Argumento no válido: ${nombre}`);
    }
    opciones[nombre.slice(2)] = argumentos[i + 1];
  }
  return opciones;
}

const AYUDA = `Uso: npm run animacion:crear -- --id <id> --titulo "<Nombre>" --arriba <img> --medio <img> --abajo <img> --tipo <empuje|tiron|piernas>
Opciones:
  --id           Identificador del ejercicio (minúsculas y guiones), igual al de src/data/ejercicios.ts
  --titulo       Nombre visible del ejercicio
  --arriba       Imagen de la pose inicial
  --medio        Imagen de la pose intermedia
  --abajo        Imagen de la pose final
  --tipo         Indicaciones predefinidas: ${Object.keys(PRESETS).join(', ')}
  --pistas       Indicaciones propias, 4 separadas por "|" (reemplaza a --tipo)
  --descripcion  Texto para lectores de pantalla (opcional)
  --salida       Carpeta de salida (por defecto public/ejercicios)`;

function principal() {
  const opciones = leerOpciones(process.argv.slice(2));
  const faltan = ['id', 'titulo', 'arriba', 'medio', 'abajo'].filter((clave) => !opciones[clave]);
  if (faltan.length > 0 || !(opciones.pistas || opciones.tipo)) {
    console.error(`Faltan opciones: ${[...faltan, ...(opciones.pistas || opciones.tipo ? [] : ['tipo o pistas'])].join(', ')}\n\n${AYUDA}`);
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/u.test(opciones.id)) {
    throw new Error('El id solo admite minúsculas, números y guiones.');
  }

  const pistas = opciones.pistas ? opciones.pistas.split('|').map((p) => p.trim()) : PRESETS[opciones.tipo];
  if (!pistas) {
    throw new Error(`Tipo desconocido: ${opciones.tipo}. Usa ${Object.keys(PRESETS).join(', ')}.`);
  }

  const html = construirAnimacion(readFileSync(rutaPlantilla, 'utf8'), {
    titulo: opciones.titulo,
    descripcion: opciones.descripcion ?? `Animación del ejercicio: ${opciones.titulo}.`,
    imagenes: {
      arriba: imagenADataUri(opciones.arriba),
      medio: imagenADataUri(opciones.medio),
      abajo: imagenADataUri(opciones.abajo),
    },
    pistas,
  });

  const carpeta = path.resolve(opciones.salida ?? path.join(raiz, 'public', 'ejercicios'));
  mkdirSync(carpeta, { recursive: true });
  const destino = path.join(carpeta, `${opciones.id}.html`);
  writeFileSync(destino, html, 'utf8');
  console.log(`Animación creada: ${destino} (${Math.round(html.length / 1024)} KB)`);
  console.log(`Falta indicar "animacion: 'ejercicios/${opciones.id}.html'" en la guía de src/data/guias.ts.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    principal();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
