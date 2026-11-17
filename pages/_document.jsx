import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="fr" className="h-full">
        <Head>
          {/* Application installable sur téléphone (écran d'accueil, plein écran) */}
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="theme-color" content="#0A192F" />
          <meta name="application-name" content="BâtiMoo Admin" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="BâtiMoo Admin" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        </Head>
        <body className="h-full">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
