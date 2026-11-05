import { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import { AyudaTermino } from '../components/AyudaTermino';
import { MiniaturaEjercicio } from '../components/MiniaturaEjercicio';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { usePerfil } from '../context/PerfilContext';
import { rutinaLocal } from '../repositories/local';
import type { RutinaAsignada as Rutina } from '../types/perfil';
import { describirRutina } from '../utils/rutina';
import { formatearPeso } from '../utils/unidades';
import { useSesion } from '../context/SesionContext';

function RutinaAsignada() {
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(0);
  const { perfil } = usePerfil();
  const { sesion } = useSesion();
  const usuarioId = sesion?.user.id ?? null;
  const history = useHistory();

  useEffect(() => {
    let activo = true;
    if (usuarioId === null) {
      setRutina(null);
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    setRutina(null);
    setCargando(true);
    void rutinaLocal
      .obtener(usuarioId)
      .then((guardada) => {
        if (activo) {
          setRutina(guardada);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  if (cargando) {
    return (
      <PantallaSJ titulo="Tu rutina">
        <div className="sj-cargando">
          <IonSpinner aria-label="Cargando rutina" />
        </div>
      </PantallaSJ>
    );
  }

  if (!rutina) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  return (
    <PantallaSJ
      etiqueta="Rutina asignada"
      titulo={`${rutina.dias.length} días por semana`}
      pie={<BotonSJ onClick={() => history.replace('/hoy')}>Ir a Hoy</BotonSJ>}
    >
      <p className="sj-texto sj-suave">{describirRutina(rutina)} Toca un día para ver sus ejercicios.</p>
      <p className="sj-texto">
        Cada ejercicio indica sus <AyudaTermino termino="serie">series</AyudaTermino> y{' '}
        <AyudaTermino termino="repeticion">repeticiones</AyudaTermino>.
      </p>
      <div className="sj-cierre-lista">
        {rutina.dias.map((dia, indice) => {
          const expandido = abierto === indice;
          const idPanel = `dia-${indice}`;
          return (
            <section key={dia.nombre}>
              <button
                type="button"
                className="sj-fila-titulo"
                aria-expanded={expandido}
                aria-controls={idPanel}
                onClick={() => setAbierto(expandido ? -1 : indice)}
              >
                <span>
                  <strong>{dia.nombre}</strong>
                  <small>{dia.ejercicios.length} ejercicios</small>
                </span>
                <span className="sj-fila-signo" aria-hidden="true">{expandido ? '−' : '+'}</span>
              </button>
              {expandido ? (
                <ul className="sj-lista" id={idPanel}>
                  {dia.ejercicios.map((ejercicio) => (
                    <li key={ejercicio.id} className="sj-fila-ejercicio">
                      <MiniaturaEjercicio idEjercicio={ejercicio.id} nombre={ejercicio.nombre} />
                      <span>
                        {ejercicio.nombre}
                        <small className="sj-suave sj-bloque">
                          {formatearPeso(ejercicio.pesoInicialKg, perfil.unidadPeso)}
                        </small>
                      </span>
                      <strong>{ejercicio.series}x{ejercicio.repeticiones}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
        <div className="sj-cierre" />
      </div>
    </PantallaSJ>
  );
}

export default RutinaAsignada;
