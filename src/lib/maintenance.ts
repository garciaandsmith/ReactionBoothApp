import { prisma } from "@/lib/prisma";

/**
 * Returns true when the site is in maintenance mode.
 * Reads the `maintenance_mode` key from SiteSettings.
 * Falls back to false if the key is missing or DB is unreachable.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: "maintenance_mode" },
    });
    return setting?.value === "true";
  } catch {
    return false;
  }
}
