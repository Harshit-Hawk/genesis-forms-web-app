import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';
import { fetchLiveResponses } from '@/lib/googleSheets';
import { ResponseModel } from '@/models';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sync = searchParams.get('sync') === '1' || searchParams.get('live') === '1';

  let isLive = false;
  if (sync) {
    const forms = serverStore.getForms();
    const existing = serverStore.getResponses();

    try {
      const liveResult = await fetchLiveResponses(forms);
      isLive = liveResult.isLive;

      if (liveResult.responses.length > 0) {
        const responseMap = new Map<string, ResponseModel>();
        // Add existing so we don't lose any records
        existing.forEach(r => responseMap.set(r.id, r));
        // Overwrite / add live responses with fresh sheet data
        liveResult.responses.forEach(r => {
          const old = responseMap.get(r.id);
          responseMap.set(r.id, {
            ...r,
            checkedIn: old ? old.checkedIn : false,
            checked_in: old ? old.checked_in : false,
            checkedInAt: old?.checkedInAt,
            checked_in_at: old?.checked_in_at
          });
        });

        serverStore.setResponses(Array.from(responseMap.values()));
      }
    } catch {
      // Continue with cached responses if live sync fails
    }
  }

  const responses = serverStore.getResponses();
  const forms = serverStore.getForms();

  return NextResponse.json({
    responses,
    forms,
    count: responses.length,
    isLive,
    syncedAt: new Date().toISOString()
  });
}
