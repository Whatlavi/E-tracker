import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Mi Web</title>
        <link rel="icon" href="/E-tracker.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
