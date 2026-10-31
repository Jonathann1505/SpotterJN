interface PropiedadesAnimacion {
  /** Ruta de la animación dentro de public/, por ejemplo "ejercicios/press-banca.html". */
  archivo: string;
  titulo: string;
}

function prefiereMenosMovimiento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Muestra la animación de un ejercicio dentro de un iframe aislado (sin acceso al origen de la app).
 * La animación se pausa o reanuda al tocarla y respeta la preferencia de menos movimiento.
 */
export function AnimacionEjercicio({ archivo, titulo }: PropiedadesAnimacion) {
  const consulta = prefiereMenosMovimiento() ? '?autoplay=0' : '';

  return (
    <div className="sj-animacion">
      <iframe
        className="sj-animacion-marco"
        title={`Animación del ejercicio: ${titulo}`}
        src={`${import.meta.env.BASE_URL}${archivo}${consulta}`}
        sandbox="allow-scripts"
        loading="lazy"
      />
    </div>
  );
}
