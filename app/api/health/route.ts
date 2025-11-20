import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/sync-service/utils";

export async function GET() {
  try {
    // Check database health
    const health = await checkDatabaseHealth();

    const isHealthy = health.mongodb && health.sqlserver;

    return NextResponse.json({
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: health.mongodb ? "connected" : "disconnected",
        sqlserver: health.sqlserver ? "connected" : "disconnected"
      },
      errors: health.errors.length > 0 ? health.errors : undefined
    }, {
      status: isHealthy ? 200 : 503
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed"
    }, { status: 500 });
  }
}
