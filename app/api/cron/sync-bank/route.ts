import { NextResponse } from "next/server";
import { syncBankTransactionsInternal } from "@/app/(authenticated)/finance/actions";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Optional security measure: Check simple API key or cron secret
        const authHeader = req.headers.get("Authorization");
        const cronSecret = process.env.CRON_SECRET;

        // If CRON_SECRET is defined locally or on Easypanel, test it. If not, it runs openly.
        // It's recommended to add a CRON_SECRET env variable on Easypanel.
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        console.log("Cron Job triggered: Bank Sync");

        const result = await syncBankTransactionsInternal();

        if (result.success) {
            console.log(`Cron Job Sync Success: ${result.imported} imported, ${result.duplicates} duplicates.`);
            return NextResponse.json({
                success: true,
                message: "Sync completed.",
                imported: result.imported,
                duplicates: result.duplicates
            });
        } else {
            console.error("Cron Job Sync Failed:", result.error);
            return NextResponse.json({
                success: false,
                error: result.error,
                needsReconnect: result.needsReconnect
            }, { status: 500 });
        }
    } catch (e: any) {
        console.error("Cron job error:", e);
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
