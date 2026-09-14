import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  const clientIp = req.headers.get("client-ip");

  let ip =
    cfIp ||
    realIp ||
    clientIp ||
    (forwarded ? forwarded.split(",")[0].trim() : "");

  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    ip = "127.0.0.1";
  }

  return NextResponse.json({ ip });
}
