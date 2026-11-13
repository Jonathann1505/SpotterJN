import { useState } from 'react';
import { IonInput } from '@ionic/react';
import { PantallaSJ } from '../components/PantallaSJ';
import { filtrarGlosario } from '../data/glosario';

function Glosario() {
  const [consulta, setConsulta] = useState('');
  const terminos = filtrarGlosario(consulta);

  return (
    <PantallaSJ
      atras="/perfil"
      etiqueta="Ayuda"
      titulo="Glosario"
      reglaBajoTitulo
    >
      <p className="sj-texto sj-suave">Los términos básicos que verás en la app, explicados de forma sencilla.</p>
      <IonInput
        className="sj-campo"
        label="Buscar un término"
        labelPlacement="stacked"
        fill="outline"
        type="search"
        clearInput
        value={consulta}
        onIonInput={(evento) => setConsulta(String(evento.detail.value ?? ''))}
      />
      {terminos.length === 0 ? (
        <p className="sj-texto sj-suave" role="status">No encontramos ese término. Prueba con otra palabra.</p>
      ) : (
        <dl className="sj-glosario">
          {terminos.map((entrada) => (
            <div key={entrada.id} className="sj-glosario-item">
              <dt>{entrada.termino}</dt>
              <dd>{entrada.definicion}</dd>
            </div>
          ))}
        </dl>
      )}
    </PantallaSJ>
  );
}

export default Glosario;
