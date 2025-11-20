import { NextResponse } from "next/server";
import { getSyncStatus } from "@/sync-service/utils";

export async function GET() {
  try {
    const status = getSyncStatus();

    return NextResponse.json({
      isRunning: status.isRunning,
      lastBatchSync: status.lastBatchSync,
      stats: status.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Sync status check error:", error);
    return NextResponse.json({
      error: "Failed to get sync status",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
