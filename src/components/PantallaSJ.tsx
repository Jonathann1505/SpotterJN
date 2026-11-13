import type { ReactNode } from 'react';
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { chevronForward } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import logo from '../assets/logo-spotterjn.webp';

interface PropiedadesLogo {
  grande?: boolean;
}

export function LogoSJ({ grande = false }: PropiedadesLogo) {
  return (
    <img
      className={grande ? 'sj-logo sj-logo-grande' : 'sj-logo'}
      src={logo}
      alt="Logo de SpotterJN: una rata levantando pesas"
    />
  );
}

type VistaAcceso = 'registro' | 'login';

interface PropiedadesPestanasAcceso {
  activa: VistaAcceso;
}

export function PestanasAccesoSJ({ activa }: PropiedadesPestanasAcceso) {
  return (
    <nav className="sj-tabs" aria-label="Acceso a la cuenta">
      <Link to="/consentimientos" aria-current={activa === 'registro' ? 'page' : undefined}>
        Crear cuenta
      </Link>
      <Link to="/login" aria-current={activa === 'login' ? 'page' : undefined}>
        Iniciar sesión
      </Link>
    </nav>
  );
}

interface PropiedadesMarcoAcceso {
  activa: VistaAcceso;
  children: ReactNode;
}

export function MarcoAccesoSJ({ activa, children }: PropiedadesMarcoAcceso) {
  return (
    <IonPage>
      <IonContent className="sj sj-acceso">
        <main className="sj-acceso-layout">
          <LogoSJ grande />
          <PestanasAccesoSJ activa={activa} />
          <section className="sj-acceso-panel">{children}</section>
        </main>
      </IonContent>
    </IonPage>
  );
}

interface PropiedadesPantalla {
  etiqueta?: string;
  titulo: string;
  reglaBajoTitulo?: boolean;
  mostrarLogo?: boolean;
  cabecera?: ReactNode;
  pie?: ReactNode;
  /** Mantiene el pie visible al desplazarse (por ejemplo, acciones de seguridad). */
  pieFijo?: boolean;
  children: ReactNode;
}

export function PantallaSJ({
  etiqueta,
  titulo,
  reglaBajoTitulo = false,
  mostrarLogo = false,
  cabecera,
  pie,
  pieFijo = false,
  children,
}: PropiedadesPantalla) {
  return (
    <IonPage>
      <IonContent className="sj">
        <div className="sj-layout">
          <main className="sj-main">
            {cabecera}
            {mostrarLogo ? <LogoSJ /> : null}
            {etiqueta ? <p className="sj-eyebrow">{etiqueta}</p> : null}
            <h1 className={reglaBajoTitulo ? 'sj-titulo sj-titulo-regla' : 'sj-titulo'}>{titulo}</h1>
            {children}
          </main>
          {pie ? <footer className={pieFijo ? 'sj-pie sj-pie-fijo' : 'sj-pie'}>{pie}</footer> : null}
        </div>
      </IonContent>
    </IonPage>
  );
}

interface PropiedadesBoton {
  children: ReactNode;
  onClick?: () => void;
  deshabilitado?: boolean;
  variante?: 'principal' | 'secundario' | 'texto';
  /** Ícono opcional al inicio, para no depender solo del color. */
  icono?: string;
}

export function BotonSJ({
  children,
  onClick,
  deshabilitado = false,
  variante = 'principal',
  icono,
}: PropiedadesBoton) {
  const clase =
    variante === 'principal'
      ? 'sj-boton'
      : variante === 'secundario'
        ? 'sj-boton sj-boton-secundario'
        : 'sj-boton sj-boton-texto';

  return (
    <IonButton className={clase} expand="block" disabled={deshabilitado} onClick={onClick}>
      {icono ? <IonIcon slot="start" icon={icono} aria-hidden="true" /> : null}
      <span>{children}</span>
      {variante === 'principal' ? <IonIcon slot="end" icon={chevronForward} aria-hidden="true" /> : null}
    </IonButton>
  );
}
