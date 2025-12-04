/**
 * Simple geo-location lookup
 * For production, use MaxMind GeoIP2 or similar service
 */
export async function getGeoLocation(ip: string): Promise<{
  country: string;
  city?: string;
  region?: string;
  timezone?: string;
}> {
  // Default values
  const defaultGeo = {
    country: "Unknown",
    city: undefined,
    region: undefined,
    timezone: undefined,
  };

  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("192.168.")) {
    return defaultGeo;
  }

  // In production, use MaxMind GeoIP2 or external API
  // For now, return default
  // Example with external API:
  // try {
  //   const response = await fetch(`https://ipapi.co/${ip}/json/`);
  //   const data = await response.json();
  //   return {
  //     country: data.country_name || "Unknown",
  //     city: data.city,
  //     region: data.region,
  //     timezone: data.timezone,
  //   };
  // } catch (error) {
  //   return defaultGeo;
  // }

  return defaultGeo;
}

