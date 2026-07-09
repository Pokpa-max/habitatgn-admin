import React from 'react'
import Head from 'next/head'

const Page = ({ name, children }) => {
  const title = name

  return (
    <div>
      <Head>
        <title>{title}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {children}
    </div>
  )
}

export default Page
