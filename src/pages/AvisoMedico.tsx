import { useHistory } from 'react-router-dom';
import { BotonSJ, PantallaSJ } from '../components/PantallaSJ';

function AvisoMedico() {
  const history = useHistory();

  return (
    <PantallaSJ
      etiqueta="Tu salud primero"
      titulo="Aviso médico"
      reglaBajoTitulo
      pie={<BotonSJ onClick={() => history.push('/salud')}>Entendido</BotonSJ>}
    >
      <p className="sj-texto">
        SpotterJN te guía con pesos y series, pero no reemplaza a un médico ni a un entrenador certificado.
      </p>
      <p className="sj-texto">
        Si sientes dolor, mareo o falta de aire, detente. Durante la sesión siempre tendrás el botón
        «Sentí dolor».
      </p>
      <p className="sj-texto">
        Ahora te haremos unas preguntas cortas sobre tu salud. Tus respuestas se guardan separadas de tu
        perfil.
      </p>
    </PantallaSJ>
  );
}

export default AvisoMedico;
