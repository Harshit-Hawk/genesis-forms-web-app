import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface CheckInBroadcastPayload {
  id: string;
  checked_in: boolean;
  checked_in_at: string;
  volunteer?: string;
  attendeeName?: string;
  timestamp: number;
}

export interface SheetsSyncBroadcastPayload {
  timestamp: number;
  updatedCount?: number;
  initiator?: string;
}

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface RealtimeHandlers {
  onCheckInUpdate?: (payload: CheckInBroadcastPayload) => void;
  onSheetsSync?: (payload: SheetsSyncBroadcastPayload) => void;
  onStatusChange?: (status: RealtimeStatus) => void;
  onPresenceChange?: (onlineCount: number) => void;
}

let activeChannel: RealtimeChannel | null = null;

/**
 * Initialize Supabase Realtime channel for instant cross-device desk synchronization.
 */
export function initRealtimeDesk(
  handlers: RealtimeHandlers,
  userIdentifier?: string
): () => void {
  if (!supabase) {
    handlers.onStatusChange?.('disconnected');
    return () => {};
  }

  // Clean up any previous channel before establishing a new one
  if (activeChannel) {
    try {
      supabase.removeChannel(activeChannel);
    } catch {
      // Ignore cleanup error
    }
    activeChannel = null;
  }

  handlers.onStatusChange?.('connecting');

  const channelName = 'genesis-desk-realtime';
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { ack: true, self: false },
      presence: { key: userIdentifier || `volunteer-${Math.random().toString(36).substring(2, 7)}` }
    }
  });

  // 1. Listen for Check-In updates from other desk devices
  channel.on(
    'broadcast',
    { event: 'checkin_updated' },
    ({ payload }: { payload: CheckInBroadcastPayload }) => {
      if (payload && payload.id) {
        handlers.onCheckInUpdate?.(payload);
      }
    }
  );

  // 2. Listen for Sheet sync notifications (e.g. fresh Google Forms pull)
  channel.on(
    'broadcast',
    { event: 'sheets_synced' },
    ({ payload }: { payload: SheetsSyncBroadcastPayload }) => {
      handlers.onSheetsSync?.(payload);
    }
  );

  // 3. Track volunteer device presence
  const updatePresenceCount = () => {
    try {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      handlers.onPresenceChange?.(Math.max(1, count));
    } catch {
      handlers.onPresenceChange?.(1);
    }
  };

  channel
    .on('presence', { event: 'sync' }, updatePresenceCount)
    .on('presence', { event: 'join' }, updatePresenceCount)
    .on('presence', { event: 'leave' }, updatePresenceCount);

  // 4. Subscribe to the channel
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      handlers.onStatusChange?.('connected');
      try {
        await channel.track({
          onlineAt: new Date().toISOString(),
          user: userIdentifier || 'Desk Volunteer'
        });
      } catch {
        // Presence tracking optional
      }
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      handlers.onStatusChange?.('error');
    } else if (status === 'CLOSED') {
      handlers.onStatusChange?.('disconnected');
    }
  });

  activeChannel = channel;

  // Cleanup handler
  return () => {
    if (activeChannel === channel) {
      try {
        channel.unsubscribe();
        if (supabase) {
          supabase.removeChannel(channel);
        }
      } catch {
        // Ignore
      }
      activeChannel = null;
    }
  };
}

/**
 * Broadcast an attendee check-in/checkout event to all connected desk devices.
 */
export async function broadcastCheckIn(payload: CheckInBroadcastPayload): Promise<boolean> {
  if (!activeChannel) return false;
  try {
    const res = await activeChannel.send({
      type: 'broadcast',
      event: 'checkin_updated',
      payload
    });
    return res === 'ok';
  } catch (err) {
    console.warn('Realtime broadcastCheckIn warning:', err);
    return false;
  }
}

/**
 * Broadcast that Google Sheets has been refreshed so all devices sync fresh rows.
 */
export async function broadcastSheetsSync(payload: SheetsSyncBroadcastPayload): Promise<boolean> {
  if (!activeChannel) return false;
  try {
    const res = await activeChannel.send({
      type: 'broadcast',
      event: 'sheets_synced',
      payload
    });
    return res === 'ok';
  } catch (err) {
    console.warn('Realtime broadcastSheetsSync warning:', err);
    return false;
  }
}
