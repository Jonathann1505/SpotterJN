import { describe, expect, it } from 'vitest';
import { decidirBotonAtras, rutaPadre } from './botonAtras';

describe('decidirBotonAtras', () => {
  it('en Hoy y Login cierra la app', () => {
    expect(decidirBotonAtras('/hoy', true, 'ninguno')).toEqual({ tipo: 'salir' });
    expect(decidirBotonAtras('/login', false, 'ninguno')).toEqual({ tipo: 'salir' });
  });

  it('en los pasos obligatorios del flujo inicial no hace nada', () => {
    expect(decidirBotonAtras('/aviso-medico', true, 'ninguno')).toEqual({ tipo: 'nada' });
    expect(decidirBotonAtras('/salud', false, 'ninguno')).toEqual({ tipo: 'nada' });
  });

  it('en una pantalla secundaria con historial vuelve a la anterior', () => {
    expect(decidirBotonAtras('/progreso', true, 'ninguno')).toEqual({ tipo: 'volver' });
  });

  it('sin historial va a la pantalla padre en lugar de salir de la app', () => {
    expect(decidirBotonAtras('/progreso', false, 'ninguno')).toEqual({ tipo: 'ir', ruta: '/perfil' });
    expect(decidirBotonAtras('/rutina', false, 'ninguno')).toEqual({ tipo: 'ir', ruta: '/perfil' });
    expect(decidirBotonAtras('/sesion', false, 'ninguno')).toEqual({ tipo: 'ir', ruta: '/hoy' });
    expect(decidirBotonAtras('/ejercicio/press-banca', false, 'ninguno')).toEqual({ tipo: 'ir', ruta: '/hoy' });
    expect(decidirBotonAtras('/registro', false, 'ninguno')).toEqual({ tipo: 'ir', ruta: '/consentimientos' });
  });

  it('con un diálogo propio abierto lo cierra antes de navegar', () => {
    expect(decidirBotonAtras('/hoy', true, 'propio')).toEqual({ tipo: 'cerrar-dialogo' });
  });

  it('con un diálogo de Ionic obligatorio abierto no hace nada', () => {
    expect(decidirBotonAtras('/sesion', true, 'ionic')).toEqual({ tipo: 'nada' });
  });
});

describe('rutaPadre', () => {
  it('usa las mismas rutas que la flecha del encabezado y Hoy por defecto', () => {
    expect(rutaPadre('/calentamiento')).toBe('/ejercicios');
    expect(rutaPadre('/recuperar-contrasena')).toBe('/login');
    expect(rutaPadre('/ruta-desconocida')).toBe('/hoy');
  });
});
