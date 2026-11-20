import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { MiniaturaEjercicio } from '../components/MiniaturaEjercicio';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import type { EquipoGimnasio } from '../types/perfil';
import {
  SIN_FILTROS,
  equiposDisponibles,
  filtrarBiblioteca,
  grupoDe,
  gruposDisponibles,
  type FiltrosBiblioteca,
} from '../utils/biblioteca';
import { ETIQUETAS_EQUIPO } from '../utils/etiquetasRutina';

const GRUPOS = gruposDisponibles();
const EQUIPOS = equiposDisponibles();

interface PropiedadesFiltro<T extends string> {
  titulo: string;
  opciones: readonly T[];
  seleccionada: T | null;
  etiqueta: (opcion: T) => string;
  onElegir: (opcion: T | null) => void;
}

function Filtro<T extends string>({ titulo, opciones, seleccionada, etiqueta, onElegir }: PropiedadesFiltro<T>) {
  return (
    <div className="sj-filtro" role="group" aria-label={titulo}>
      <h2 className="sj-subtitulo">{titulo}</h2>
      <div className="sj-chips">
        <button type="button" className="sj-chip" aria-pressed={seleccionada === null} onClick={() => onElegir(null)}>
          Todos
        </button>
        {opciones.map((opcion) => (
          <button
            key={opcion}
            type="button"
            className="sj-chip"
            aria-pressed={seleccionada === opcion}
            onClick={() => onElegir(opcion)}
          >
            {etiqueta(opcion)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Todos los ejercicios del catálogo, con filtros por grupo muscular y equipo, para consultar sus fichas. */
function Biblioteca() {
  const [filtros, setFiltros] = useState<FiltrosBiblioteca>(SIN_FILTROS);
  const history = useHistory();
  const ejercicios = filtrarBiblioteca(filtros);

  return (
    <PantallaSJ atras="/perfil" etiqueta="Ayuda" titulo="Ejercicios" reglaBajoTitulo>
      <p className="sj-texto sj-suave">Consulta cómo se hace cada ejercicio, aunque no esté en tu rutina.</p>
      <BotonSJ variante="secundario" onClick={() => history.push('/calentamiento')}>Calentamiento antes de entrenar</BotonSJ>
      <Filtro<string>
        titulo="Grupo muscular"
        opciones={GRUPOS}
        seleccionada={filtros.grupo}
        etiqueta={(grupo) => grupo}
        onElegir={(grupo) => setFiltros((actual) => ({ ...actual, grupo }))}
      />
      <Filtro<EquipoGimnasio>
        titulo="Equipo"
        opciones={EQUIPOS}
        seleccionada={filtros.equipo}
        etiqueta={(equipo) => ETIQUETAS_EQUIPO[equipo]}
        onElegir={(equipo) => setFiltros((actual) => ({ ...actual, equipo }))}
      />

      <p className="sj-texto sj-suave" role="status">
        {ejercicios.length === 1 ? '1 ejercicio' : `${ejercicios.length} ejercicios`}
      </p>
      {ejercicios.length === 0 ? (
        <p className="sj-texto">No hay ejercicios con esa combinación. Prueba con otro filtro.</p>
      ) : (
        <ul className="sj-lista">
          {ejercicios.map((ejercicio) => (
            <li key={ejercicio.id} className="sj-fila-ejercicio">
              <MiniaturaEjercicio idEjercicio={ejercicio.id} nombre={ejercicio.nombre} />
              <span>
                <button
                  type="button"
                  className="sj-enlace-ejercicio"
                  onClick={() => history.push(`/ejercicio/${ejercicio.id}`)}
                >
                  <strong>{ejercicio.nombre}</strong>
                </button>
                <small className="sj-suave sj-bloque">
                  {grupoDe(ejercicio)} · {ETIQUETAS_EQUIPO[ejercicio.equipo]}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </PantallaSJ>
  );
}

export default Biblioteca;
