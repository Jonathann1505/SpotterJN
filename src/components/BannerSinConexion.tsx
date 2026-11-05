import { useConexion } from '../hooks/useConexion';
import './BannerSinConexion.css';

function BannerSinConexion() {
  const hayConexion = useConexion();

  if (hayConexion) {
    return null;
  }

  return (
    <div className="banner-sin-conexion" role="status">
      Sin conexión, tus datos se guardarán localmente
    </div>
  );
}

export default BannerSinConexion;
