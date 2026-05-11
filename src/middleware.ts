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
    throw new Error("BACKEND_URL no configurado")
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.status}`)
    }

    const json = await response.json()
    const regions = json.regions

    if (!regions?.length) {
      throw new Error("No regions found")
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
): string | undefined {
  // Obtener el primer segmento de la ruta
  const pathname = request.nextUrl.pathname
  const segments = pathname.split("/").filter(Boolean) // Elimina strings vacíos

  // Si el primer segmento existe y está en el regionMap, es un país válido
  if (segments && regionMap.has(segments)) {
    return segments
  }

  // Si no, intentar con Vercel header
  const vercelHeader = request.headers.get("x-vercel-ip-country")
  if (vercelHeader) {
    const vercelCountryCode = String(vercelHeader).toLowerCase()
    if (regionMap.has(vercelCountryCode)) {
      return vercelCountryCode
    }
  }

  // Si no, usar DEFAULT_REGION si existe en el map
  if (regionMap.has(DEFAULT_REGION)) {
    return DEFAULT_REGION
  }

  // Si no, usar el primer país disponible
  return regionMap.keys().next().value
}

export async function middleware(request: NextRequest) {
  try {
    // Ignorar rutas estáticas
    if (request.nextUrl.pathname.includes(".")) {
      return NextResponse.next()
    }

    let cacheIdCookie = request.cookies.get("_medusa_cache_id")
    let cacheId = cacheIdCookie?.value || crypto.randomUUID()

    const regionMap = await getRegionMap(cacheId)

    if (!regionMap.size) {
      return new NextResponse("No regions configured", { status: 500 })
    }

    const countryCode = getCountryCode(request, regionMap)

    if (!countryCode) {
      return new NextResponse("No valid region found", { status: 500 })
    }

    const pathname = request.nextUrl.pathname
    const segments = pathname.split("/").filter(Boolean)

    // ✅ CRÍTICO: Si el primer segmento YA es el country code, NO redirigir
    if (segments === countryCode) {
      // Ya estamos en la ruta correcta
      if (!cacheIdCookie) {
        const response = NextResponse.next()
        response.cookies.set("_medusa_cache_id", cacheId, {
          maxAge: 60 * 60 * 24,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        })
        return response
      }
      return NextResponse.next()
    }

    // ✅ Si no está en la ruta correcta, redirigir UNA SOLA VEZ
    const newPathname = `/${countryCode}${pathname}`
    const response = NextResponse.redirect(
      new URL(newPathname, request.url),
      307
    )

    if (!cacheIdCookie) {
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
    }

    return response

  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
