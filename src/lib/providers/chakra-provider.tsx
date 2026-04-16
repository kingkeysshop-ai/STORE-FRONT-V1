"use client"

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react"
import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { useServerInsertedHTML } from "next/navigation"
import { useState } from "react"

const config = defineConfig({
  globalCss: {},
  theme: {
    tokens: {
      colors: {
        brand: {
          50:  { value: "#fff8e1" },
          100: { value: "#ffecb3" },
          200: { value: "#ffe082" },
          300: { value: "#ffd54f" },
          400: { value: "#ffca28" },
          500: { value: "#FFC107" },
          600: { value: "#ffb300" },
          700: { value: "#ffa000" },
          800: { value: "#ff8f00" },
          900: { value: "#ff6f00" },
        },
      },
      fonts: {
        heading: { value: "'Inter', sans-serif" },
        body:    { value: "'Inter', sans-serif" },
      },
    },
  },
})

const system = createSystem(defaultConfig, config)

export default function KingKeysChakraProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [cache] = useState(() => {
    const c = createCache({ key: "chakra" })
    c.compat = true
    return c
  })

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted)
    if (names.length === 0) return null
    let styles = ""
    for (const name of names) {
      if (cache.inserted[name] !== true) {
        styles += cache.inserted[name]
      }
    }
    return (
      <style
        key="chakra-styles"
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    )
  })

  return (
    <CacheProvider value={cache}>
      <ChakraProvider value={system}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  )
}
