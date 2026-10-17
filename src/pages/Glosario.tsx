import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';
import { GLOSARIO } from '../data/glosario';

function Glosario() {
  const history = useHistory();

  return (
    <PantallaSJ
      etiqueta="Ayuda"
      titulo="Glosario"
      reglaBajoTitulo
      pie={<BotonSJ variante="texto" onClick={() => history.goBack()}>Volver</BotonSJ>}
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
