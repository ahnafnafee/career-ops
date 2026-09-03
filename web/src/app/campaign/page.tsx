import { CampaignView } from "@/components/campaign-view";
import { readCampaign } from "@/lib/campaign";

export const dynamic = "force-dynamic";

export default function CampaignPage() {
  return <CampaignView data={readCampaign()} />;
}
