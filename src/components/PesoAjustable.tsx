import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IonIcon } from '@ionic/react';
import { createOutline } from 'ionicons/icons';
import type { UnidadPeso } from '../types/perfil';
import { PESO_MAXIMO_MANUAL, esPesoManualValido } from '../utils/progresion';
import ContadorNumerico from './ContadorNumerico';
import { BotonSJ } from './PantallaSJ';

interface PropiedadesPesoAjustable {
  nombreEjercicio: string;
  /** Peso mostrado (recomendado o ajustado) en la unidad del perfil. */
  peso: number;
  unidad: UnidadPeso;
  /** Guarda el peso elegido; si falla, el diálogo sigue abierto y muestra el error. */
  alGuardar: (peso: number) => Promise<void>;
}

/** Peso de un ejercicio que se puede ajustar a mano con un diálogo (RF-17). */
export function PesoAjustable({ nombreEjercicio, peso, unidad, alGuardar }: PropiedadesPesoAjustable) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState(peso);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idTitulo = useId();
  const disparador = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  const cerrar = (): void => {
    setAbierto(false);
    setError(null);
    // Devuelve el foco al peso que abrió el diálogo.
    window.setTimeout(() => disparador.current?.focus(), 0);
  };

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }
    // Lleva el foco al campo de peso al abrir.
    dialogo.current?.querySelector<HTMLInputElement>('input')?.focus();
    const alPulsar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape' && !guardando) {
        cerrar();
      }
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto, guardando]);

  const abrir = (): void => {
    setValor(peso);
    setError(null);
    setAbierto(true);
  };

  const valido = esPesoManualValido(valor, unidad);

  const guardar = async (): Promise<void> => {
    if (!valido || guardando) {
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await alGuardar(valor);
      cerrar();
    } catch {
      setError('No se pudo guardar el peso. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const pesoTexto = peso.toLocaleString('es');

  return (
    <>
      <button
        ref={disparador}
        type="button"
        className="sj-peso sj-peso-ajustable"
        aria-haspopup="dialog"
        aria-label={`Ajustar peso de ${nombreEjercicio}: ${pesoTexto} ${unidad}`}
        onClick={abrir}
      >
        {pesoTexto}
        <small> {unidad}</small>
        <IonIcon icon={createOutline} aria-hidden="true" />
      </button>
      {abierto
        ? createPortal(
            <div className="sj sj-dialogo-fondo" onClick={() => (guardando ? undefined : cerrar())}>
              <div
                ref={dialogo}
                className="sj-dialogo"
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                onClick={(evento) => evento.stopPropagation()}
              >
                <p className="sj-eyebrow">Ajuste manual</p>
                <h2 className="sj-dialogo-titulo" id={idTitulo}>Peso de {nombreEjercicio}</h2>
                <p className="sj-texto sj-suave">
                  Será el peso de partida de tu próxima sesión. Puedes elegir más o menos de lo que sugiere la app
                  (máximo {PESO_MAXIMO_MANUAL[unidad]} {unidad}).
                </p>
                <ContadorNumerico
                  etiqueta="Peso"
                  valor={valor}
                  onChange={setValor}
                  minimo={0}
                  maximo={PESO_MAXIMO_MANUAL[unidad]}
                  unidad={unidad}
                />
                {error ? <p className="sj-error" role="alert">{error}</p> : null}
                <BotonSJ deshabilitado={!valido || guardando} onClick={() => void guardar()}>
                  {guardando ? 'Guardando…' : 'Guardar'}
                </BotonSJ>
                <BotonSJ variante="secundario" deshabilitado={guardando} onClick={cerrar}>
                  Cancelar
                </BotonSJ>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
