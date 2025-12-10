import React from 'react'
import Head from 'next/head'
import { Toaster } from 'react-hot-toast'

const Page = ({ name, children }) => {
  const title = name

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Toaster position="top-right" />
      {children}
    </div>
  )
}

export default Page
