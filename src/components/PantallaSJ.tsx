import type { ReactNode } from 'react';
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { chevronForward } from 'ionicons/icons';
import '@fontsource/archivo/latin-400.css';
import '@fontsource/archivo/latin-500.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/archivo/latin-800.css';
import logo from '../assets/logo-spotterjn.webp';
import '../theme/spotter-ui.css';

interface PropiedadesPantalla {
  etiqueta?: string;
  titulo: string;
  reglaBajoTitulo?: boolean;
  mostrarLogo?: boolean;
  cabecera?: ReactNode;
  pie?: ReactNode;
  children: ReactNode;
}

export function PantallaSJ({
  etiqueta,
  titulo,
  reglaBajoTitulo = false,
  mostrarLogo = false,
  cabecera,
  pie,
  children,
}: PropiedadesPantalla) {
  return (
    <IonPage>
      <IonContent className="sj">
        <div className="sj-layout">
          <main className="sj-main">
            {cabecera}
            {mostrarLogo ? <img className="sj-logo" src={logo} alt="SpotterJN" /> : null}
            {etiqueta ? <p className="sj-eyebrow">{etiqueta}</p> : null}
            <h1 className={reglaBajoTitulo ? 'sj-titulo sj-titulo-regla' : 'sj-titulo'}>{titulo}</h1>
            {children}
          </main>
          {pie ? <footer className="sj-pie">{pie}</footer> : null}
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
}

export function BotonSJ({ children, onClick, deshabilitado = false, variante = 'principal' }: PropiedadesBoton) {
  const clase =
    variante === 'principal'
      ? 'sj-boton'
      : variante === 'secundario'
        ? 'sj-boton sj-boton-secundario'
        : 'sj-boton sj-boton-texto';

  return (
    <IonButton className={clase} expand="block" disabled={deshabilitado} onClick={onClick}>
      <span>{children}</span>
      {variante === 'principal' ? <IonIcon slot="end" icon={chevronForward} aria-hidden="true" /> : null}
    </IonButton>
  );
}
