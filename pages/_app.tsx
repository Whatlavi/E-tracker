import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Navbar from '../components/Navbar'; // Importamos el componente Navbar
import Head from 'next/head';

/**
 * Componente raíz de la aplicación Next.js. 
 * Cualquier componente colocado aquí (como Navbar o Footer) 
 * aparecerá en todas las páginas.
 */
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Usamos Head aquí para el título y favicon global */}
        <title>Elitegg | Buscador de Invocador</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* 1. La barra de navegación se renderiza primero */}
      <Navbar />

      {/* 2. El contenido de la página actual se renderiza debajo */}
      <div className="pt-16 min-h-screen">
         {/* El pt-16 es crucial para asegurar que el contenido no quede oculto 
             detrás del Navbar fijo de 16 unidades de altura (h-16). */}
         <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;
