export async function GET() {
  return Response.json({
    message: "Portfolio API is ready",
    items: [],
  });
}

export async function POST() {
  return Response.json({
    message: "Portfolio API is ready",
  });
}
