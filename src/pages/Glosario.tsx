import { PantallaSJ } from '../components/PantallaSJ';
import { GLOSARIO } from '../data/glosario';

function Glosario() {
  return (
    <PantallaSJ
      atras="/perfil"
      etiqueta="Ayuda"
      titulo="Glosario"
      reglaBajoTitulo
    >
      <p className="sj-texto sj-suave">Los términos básicos que verás en la app, explicados de forma sencilla.</p>
      <dl className="sj-glosario">
        {GLOSARIO.map((entrada) => (
          <div key={entrada.id} className="sj-glosario-item">
            <dt>{entrada.termino}</dt>
            <dd>{entrada.definicion}</dd>
          </div>
        ))}
      </dl>
    </PantallaSJ>
  );
}

export default Glosario;
