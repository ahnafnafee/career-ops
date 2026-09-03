import fs from "node:fs";
import path from "node:path";
import { findCampaignArtifact, type CampaignArtifactFormat } from "@/lib/campaign-packet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<CampaignArtifactFormat, string> = {
  markdown: "text/markdown; charset=utf-8",
  text: "text/plain; charset=utf-8",
  json: "application/json; charset=utf-8",
  tex: "text/plain; charset=utf-8",
  html: "text/plain; charset=utf-8",
  pdf: "application/pdf",
};

function safeFilename(value: string): string {
  return path.basename(value).replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id, artifactId } = await params;
  const artifact = findCampaignArtifact(id, artifactId);
  if (!artifact) return new Response("Artifact not found.", { status: 404 });

  try {
    const bytes = fs.readFileSync(/* turbopackIgnore: true */ artifact.file);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const disposition = download || artifact.format !== "pdf" ? "attachment" : "inline";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": MIME[artifact.format],
        "Content-Disposition": `${disposition}; filename="${safeFilename(artifact.name)}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Artifact could not be read.", { status: 500 });
  }
}

