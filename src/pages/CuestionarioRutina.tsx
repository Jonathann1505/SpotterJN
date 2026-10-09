import { useState } from 'react';
import { IonButton, IonCheckbox, IonChip, IonContent, IonItem, IonLabel, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { rutinaLocal } from '../repositories/local';
import { DIAS_MAXIMOS, DIAS_MINIMOS, asignarRutina } from '../utils/rutina';
import { EQUIPOS, EXPERIENCIAS, type EquipoGimnasio, type Experiencia } from '../types/perfil';
import './AuthPages.css';
import './Rutina.css';
import './Salud.css';

const ETIQUETAS_EXPERIENCIA: Record<Experiencia, string> = {
  ninguna: 'Ninguna',
  'menos-6-meses': 'Menos de 6 meses',
  'mas-6-meses': 'Más de 6 meses',
};

const ETIQUETAS_EQUIPO: Record<EquipoGimnasio, string> = {
  mancuernas: 'Mancuernas',
  barra: 'Barra y discos',
  maquinas: 'Máquinas guiadas',
  poleas: 'Poleas',
  'peso-corporal': 'Solo peso corporal',
};

function CuestionarioRutina() {
  const [experiencia, setExperiencia] = useState<Experiencia | null>(null);
  const [dias, setDias] = useState(3);
  const [equipo, setEquipo] = useState<EquipoGimnasio[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();
  const completo = experiencia !== null && equipo.length > 0;

  const alternarEquipo = (item: EquipoGimnasio, marcado: boolean): void => {
    setEquipo((actual) =>
      marcado ? (actual.includes(item) ? actual : [...actual, item]) : actual.filter((e) => e !== item),
    );
  };

  const verRutina = async (): Promise<void> => {
    if (experiencia === null || equipo.length === 0 || guardando) {
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await rutinaLocal.guardar(asignarRutina({ experiencia, diasPorSemana: dias, equipo }));
      history.replace('/rutina');
    } catch {
      setError('No se pudo guardar tu rutina. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-page">
        <main className="auth-page-content">
          <section className="auth-page-card" aria-labelledby="rutina-title">
            <h1 id="rutina-title">Tu rutina inicial</h1>
            <p>Responde tres preguntas para asignarte una rutina.</p>

            <h2 className="rutina-pregunta" id="pregunta-experiencia">Experiencia previa</h2>
            <div className="rutina-chips" role="radiogroup" aria-labelledby="pregunta-experiencia">
              {EXPERIENCIAS.map((opcion) => (
                <IonChip
                  key={opcion}
                  role="radio"
                  aria-checked={experiencia === opcion}
                  className={experiencia === opcion ? 'rutina-chip rutina-chip-activo' : 'rutina-chip'}
                  onClick={() => setExperiencia(opcion)}
                >
                  {ETIQUETAS_EXPERIENCIA[opcion]}
                </IonChip>
              ))}
            </div>

            <h2 className="rutina-pregunta" id="pregunta-dias">Días disponibles por semana</h2>
            <div className="rutina-stepper" role="group" aria-labelledby="pregunta-dias">
              <IonButton
                fill="outline"
                aria-label="Menos días"
                disabled={dias <= DIAS_MINIMOS}
                onClick={() => setDias((actual) => Math.max(DIAS_MINIMOS, actual - 1))}
              >
                −
              </IonButton>
              <output className="rutina-stepper-valor" aria-live="polite">{dias}</output>
              <IonButton
                fill="outline"
                aria-label="Más días"
                disabled={dias >= DIAS_MAXIMOS}
                onClick={() => setDias((actual) => Math.min(DIAS_MAXIMOS, actual + 1))}
              >
                +
              </IonButton>
            </div>

            <h2 className="rutina-pregunta">Equipo disponible</h2>
            {EQUIPOS.map((item) => (
              <IonItem key={item} className="auth-check-row salud-check" lines="none">
                <IonCheckbox
                  checked={equipo.includes(item)}
                  onIonChange={(evento) => alternarEquipo(item, evento.detail.checked === true)}
                  aria-label={ETIQUETAS_EQUIPO[item]}
                />
                <IonLabel>{ETIQUETAS_EQUIPO[item]}</IonLabel>
              </IonItem>
            ))}

            {error ? <p className="auth-inline-error" role="alert">{error}</p> : null}
            <IonButton
              className="auth-submit"
              expand="block"
              disabled={!completo || guardando}
              onClick={() => void verRutina()}
            >
              Ver mi rutina
            </IonButton>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default CuestionarioRutina;
