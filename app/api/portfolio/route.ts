import { Portfolio } from "@/lib/portfolio";
import { NextResponse } from "next/server";

// placeholder — returns all portfolio data as json
export async function GET() {
  return NextResponse.json(Portfolio);
}
