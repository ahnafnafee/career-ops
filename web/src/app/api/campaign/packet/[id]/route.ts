import { readCampaignPacket } from "@/lib/campaign-packet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const packet = readCampaignPacket(id);
  if (!packet) return Response.json({ error: "Packet not found." }, { status: 404 });
  return Response.json(packet, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

