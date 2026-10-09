import { useEffect, useState } from 'react';
import { IonAccordion, IonAccordionGroup, IonButton, IonContent, IonItem, IonLabel, IonPage, IonSpinner } from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import { usePerfil } from '../context/PerfilContext';
import { rutinaLocal } from '../repositories/local';
import type { RutinaAsignada as Rutina } from '../types/perfil';
import { formatearPeso } from '../utils/unidades';
import './AuthPages.css';
import './Rutina.css';

function RutinaAsignada() {
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [cargando, setCargando] = useState(true);
  const { perfil } = usePerfil();
  const history = useHistory();

  useEffect(() => {
    let activo = true;
    void rutinaLocal
      .obtener()
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
  }, []);

  if (cargando) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner aria-label="Cargando rutina" />
        </IonContent>
      </IonPage>
    );
  }

  if (!rutina) {
    return <Redirect to="/cuestionario-rutina" />;
  }

  return (
    <IonPage>
      <IonContent className="auth-page">
        <main className="auth-page-content">
          <section className="auth-page-card" aria-labelledby="rutina-asignada-title">
            <h1 id="rutina-asignada-title">Tu rutina</h1>
            <p>Estos son tus {rutina.dias.length} días de entrenamiento. Toca un día para ver sus ejercicios.</p>
            <IonAccordionGroup className="rutina-dias">
              {rutina.dias.map((dia) => (
                <IonAccordion key={dia.nombre} value={dia.nombre}>
                  <IonItem slot="header" lines="none">
                    <IonLabel>{dia.nombre}</IonLabel>
                  </IonItem>
                  <ul slot="content" className="rutina-ejercicios">
                    {dia.ejercicios.map((ejercicio) => (
                      <li key={ejercicio.id}>
                        <strong>{ejercicio.nombre}</strong>
                        <span>
                          {ejercicio.series}x{ejercicio.repeticiones} · {formatearPeso(ejercicio.pesoInicialKg, perfil.unidadPeso)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </IonAccordion>
              ))}
            </IonAccordionGroup>
            <IonButton className="auth-submit" expand="block" onClick={() => history.replace('/hoy')}>
              Ir a Hoy
            </IonButton>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default RutinaAsignada;
