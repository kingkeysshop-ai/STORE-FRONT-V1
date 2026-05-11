import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.DEFAULT_REGION || process.env.NEXT_PUBLIC_DEFAULT_REGION || "co"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: BACKEND_URL no está configurado. Verifica MEDUSA_BACKEND_URL en variables de entorno."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    console.log("🔄 Fetching regions from:", `${BACKEND_URL}/store/regions`)

    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    console.log("📊 Regions response status:", response.status)

    if (!response.ok) {
      const text = await response.text()
      console.log("❌ Regions response body (first 500 chars):", text.substring(0, 500))
      throw new Error(`Failed to fetch regions: ${response.status} - ${text}`)
    }

    const json = await response.json()
    const regions = json.regions

    console.log("✅ Regions found:", regions?.length ?? 0)

    if (!regions?.length) {
      throw new Error(
        "No regions found. Por favor configura regiones en Medusa Admin."
      )
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
        console.log(`  ✓ Mapeado: ${c.iso_2} → ${region.name}`)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
    console.log("🗺️ Region map actualizado. Total países mapeados:", regionMapCache.regionMap.size)
  }

  return regionMapCache.regionMap
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  let countryCode

  const vercelCountryCode = request.headers
    .get("x-vercel-ip-country")
    ?.toLowerCase()

  // ✅ FIX CRÍTICO: Cambiar sintaxis de optional chaining
  const pathParts = request.nextUrl.pathname.split("/")
  const urlCountryCode = pathParts ? pathParts.toLowerCase() : undefined

  console.log("🌍 URL country code:", urlCountryCode)
  console.log("🌍 Vercel country code:", vercelCountryCode)
  console.log("🌍 Default region:", DEFAULT_REGION)
  console.log("🗺️ Region map keys:", Array.from(regionMap.keys()).join(", "))

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    countryCode = urlCountryCode
    console.log(`✅ Country code from URL: ${countryCode}`)
  } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    countryCode = vercelCountryCode
    console.log(`✅ Country code from Vercel header: ${countryCode}`)
  } else if (regionMap.has(DEFAULT_REGION)) {
    countryCode = DEFAULT_REGION
    console.log(`✅ Country code from DEFAULT_REGION: ${countryCode}`)
  } else if (regionMap.keys().next().value) {
    countryCode = regionMap.keys().next().value
    console.log(`✅ Country code from first in map: ${countryCode}`)
  } else {
    console.log("❌ No country code found!")
  }

  console.log("📍 Final country code:", countryCode)
  return countryCode
}

export async function middleware(request: NextRequest) {
  try {
    console.log("\n" + "=".repeat(60))
    console.log(`🚀 MIDDLEWARE START - Path: ${request.nextUrl.pathname}`)
    console.log("=".repeat(60))

    let redirectUrl = request.nextUrl.href
    let response = NextResponse.redirect(redirectUrl, 307)
    let cacheIdCookie = request.cookies.get("_medusa_cache_id")
    let cacheId = cacheIdCookie?.value || crypto.randomUUID()

    console.log("🔑 Cache ID:", cacheId)

    const regionMap = await getRegionMap(cacheId)
    console.log("📦 Region map size:", regionMap.size)

    const countryCode = regionMap && (await getCountryCode(request, regionMap))

    // ✅ FIX: Sintaxis más robusta
    const pathParts = request.nextUrl.pathname.split("/")
    const firstPathSegment = pathParts || ""
    const urlHasCountryCode = countryCode && firstPathSegment === countryCode

    console.log("🔍 URL has country code:", urlHasCountryCode)
    console.log("🔍 Country code value:", countryCode)

    if (urlHasCountryCode && cacheIdCookie) {
      console.log("✅ URL has country code + cache ID → NEXT")
      return NextResponse.next()
    }

    if (urlHasCountryCode && !cacheIdCookie) {
      console.log("✅ URL has country code but no cache ID → SET COOKIE + REDIRECT")
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
      return response
    }

    if (request.nextUrl.pathname.includes(".")) {
      console.log("✅ Static asset detected → NEXT")
      return NextResponse.next()
    }

    const redirectPath =
      request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
    const queryString = request.nextUrl.search ? request.nextUrl.search : ""

    if (!urlHasCountryCode && countryCode) {
      redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
      console.log(`🔄 Redirecting to: ${redirectUrl}`)
      response = NextResponse.redirect(`${redirectUrl}`, 307)
    } else if (!urlHasCountryCode && !countryCode) {
      console.log("❌ No valid country code found → ERROR 500")
      return new NextResponse(
        "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
        { status: 500 }
      )
    }

    console.log("✅ MIDDLEWARE END - SUCCESS")
    console.log("=".repeat(60) + "\n")
    return response

  } catch (error) {
    console.error("\n" + "❌".repeat(30))
    console.error("🚨 MIDDLEWARE ERROR CRÍTICO:")
    console.error({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: request.nextUrl.pathname,
      url: request.url,
      backend_url: BACKEND_URL,
      has_api_key: !!PUBLISHABLE_API_KEY,
      timestamp: new Date().toISOString(),
    })
    console.error("❌".repeat(30) + "\n")

    console.log("⚠️ Dejando pasar request sin middleware processing")
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
