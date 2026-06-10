import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const result = await prisma.clip.aggregate({
      _sum: { fileSize: true },
    });

    const totalBytes = result._sum.fileSize || 0;
    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const limitGB = parseInt(process.env.STORAGE_LIMIT_GB || "9");
    const remainingGB = Math.max(0, limitGB - totalGB);

    return NextResponse.json({
      usedBytes: totalBytes,
      usedGB: parseFloat(totalGB.toFixed(2)),
      limitGB,
      remainingGB: parseFloat(remainingGB.toFixed(2)),
      remainingFormatted: remainingGB >= 1
        ? `${remainingGB.toFixed(1)} GB`
        : `${(remainingGB * 1024).toFixed(0)} MB`,
    });
  } catch (error) {
    console.error("Get storage error:", error);
    return NextResponse.json(
      { usedBytes: 0, usedGB: 0, limitGB: 9, remainingGB: 9, remainingFormatted: "9.0 GB" },
      { status: 500 }
    );
  }
}
