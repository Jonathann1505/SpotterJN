import { IonSkeletonText } from '@ionic/react';

export type VarianteCarga = 'lista' | 'detalle';

interface PropiedadesCargando {
  /** Texto que anuncian los lectores de pantalla mientras se carga. */
  etiqueta: string;
  /** "lista" imita filas de ejercicios; "detalle" imita una ficha con párrafos. */
  variante?: VarianteCarga;
  filas?: number;
}

/**
 * Estado de carga con skeletons que imitan la forma del contenido final,
 * para que la pantalla no salte al terminar de cargar.
 */
export function CargandoSJ({ etiqueta, variante = 'lista', filas = 3 }: PropiedadesCargando) {
  return (
    <div className="sj-skeleton" role="status" aria-live="polite" aria-busy="true" aria-label={etiqueta}>
      <div className="sj-skeleton-tarjeta" aria-hidden="true">
        <IonSkeletonText animated style={{ width: '45%', height: '1.25rem' }} />
        <IonSkeletonText animated style={{ width: '85%', height: '0.875rem' }} />
        <IonSkeletonText animated style={{ width: '65%', height: '0.875rem' }} />
      </div>
      {Array.from({ length: filas }, (_, indice) =>
        variante === 'lista' ? (
          <div key={indice} className="sj-skeleton-fila" aria-hidden="true">
            <IonSkeletonText animated style={{ width: '3.5rem', height: '3.5rem', flex: '0 0 auto' }} />
            <div>
              <IonSkeletonText animated style={{ width: '70%', height: '1rem' }} />
              <IonSkeletonText animated style={{ width: '40%', height: '0.875rem' }} />
            </div>
          </div>
        ) : (
          <IonSkeletonText
            key={indice}
            animated
            aria-hidden="true"
            style={{ width: indice % 2 === 0 ? '100%' : '80%', height: '0.875rem' }}
          />
        ),
      )}
    </div>
  );
}
