import fs from "node:fs";
import path from "node:path";
import { campaignMarkdownPath } from "@/lib/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const markdownPath = campaignMarkdownPath();
    const markdown = fs.readFileSync(/* turbopackIgnore: true */ markdownPath, "utf8");
    const filename = path.basename(markdownPath).replace(/[^a-zA-Z0-9._-]/g, "-");
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Campaign export has not been generated." }, { status: 404 });
  }
}
