import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Persistent Database Storage File
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pixel_pros_db.json');

interface StoredRoster {
  id: string;
  room_code: string;
  user_name: string;
  sport: 'nfl' | 'nba';
  star_1_id: string;
  star_2_id: string;
  star_3_id: string;
  is_locked: boolean;
  device_id: string;
  updated_at: string;
}

interface ServerDB {
  rosters: StoredRoster[];
  locks: Record<string, boolean>; // key: `${room}_${user}_${sport}`
  rooms?: Record<string, { sport: 'nfl' | 'nba'; createdAt: string }>;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
      console.warn('Failed to create data directory:', err);
    }
  }
}

function loadDatabase(): ServerDB {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rosters)) {
        return {
          rosters: parsed.rosters,
          locks: parsed.locks || {},
          rooms: parsed.rooms || {},
        };
      }
    } catch (err) {
      console.warn('Failed to read pixel_pros_db.json, reinitializing:', err);
    }
  }

  const initialDB: ServerDB = {
    rosters: [],
    locks: {},
    rooms: {
      COUCH_nfl: { sport: 'nfl', createdAt: new Date().toISOString() },
      HOOPS_nba: { sport: 'nba', createdAt: new Date().toISOString() },
    },
  };
  saveDatabase(initialDB);
  return initialDB;
}

function saveDatabase(db: ServerDB): void {
  try {
    ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file atomically:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.error('Fallback write also failed:', fallbackErr);
    }
  }
}

// In-memory state synchronized with disk
let dbState: ServerDB = loadDatabase();

// Connected Server-Sent Event (SSE) clients
interface SSEClient {
  id: number;
  res: Response;
  roomCode?: string;
  sport?: string;
}
let sseClientId = 0;
const sseClients = new Map<number, SSEClient>();

function broadcastRoomUpdate(roomCode: string, sport?: string, actionDetail?: any) {
  const cleanRoom = (roomCode || '').trim().toUpperCase();
  const cleanSport = (sport || '').trim().toLowerCase();
  const payload = JSON.stringify({
    type: 'roster_update',
    room_code: cleanRoom,
    sport: cleanSport,
    detail: actionDetail || {},
    timestamp: Date.now(),
  });

  for (const [id, client] of sseClients.entries()) {
    try {
      if (
        !client.roomCode ||
        client.roomCode === '*' ||
        client.roomCode === cleanRoom
      ) {
        client.res.write(`data: ${payload}\n\n`);
      }
    } catch (err) {
      sseClients.delete(id);
    }
  }
}

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    rostersCount: dbState.rosters.length,
    activeConnections: sseClients.size,
  });
});

// 2. Real-time Server-Sent Events stream
app.get('/api/realtime', (req: Request, res: Response) => {
  const roomCode = req.query.roomCode ? String(req.query.roomCode).trim().toUpperCase() : '*';
  const sport = req.query.sport ? String(req.query.sport).trim().toLowerCase() : '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const id = ++sseClientId;
  sseClients.set(id, { id, res, roomCode, sport });

  // Initial connection handshake
  res.write(`: connected id=${id}\n\n`);

  // Periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(id);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(id);
  });
});

// 3. Fetch rosters for a room
app.get('/api/rosters', (req: Request, res: Response) => {
  const roomCode = req.query.roomCode ? String(req.query.roomCode).trim().toUpperCase() : 'COUCH';
  const sport = req.query.sport ? String(req.query.sport).trim().toLowerCase() : 'nfl';

  const results = dbState.rosters.filter((r) => {
    const rRoom = (r.room_code || '').trim().toUpperCase();
    const rSport = (r.sport || 'nfl').trim().toLowerCase();
    return rRoom === roomCode && (sport ? rSport === sport : true);
  });

  res.json({ success: true, rosters: results });
});

// 4. Upsert a user roster (picks, stars, lock)
app.post('/api/rosters', (req: Request, res: Response) => {
  const {
    room_code,
    user_name,
    sport = 'nfl',
    star_1_id = '',
    star_2_id = '',
    star_3_id = '',
    is_locked = false,
    device_id = 'UNLOCKED',
  } = req.body;

  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanUser = (user_name || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanUser) {
    res.status(400).json({ success: false, error: 'user_name is required' });
    return;
  }

  const starIds = [star_1_id, star_2_id, star_3_id].filter(
    (id) => id && typeof id === 'string' && id.trim() !== ''
  );
  const distinctIds = new Set(starIds);
  const hasThreeDistinct = starIds.length === 3 && distinctIds.size === 3;
  const guardedLocked = hasThreeDistinct && Boolean(is_locked);

  const lockKey = `${cleanRoom}_${cleanUser}_${cleanSport}`;
  dbState.locks[lockKey] = guardedLocked;

  const existingIdx = dbState.rosters.findIndex(
    (r) =>
      (r.room_code || '').trim().toUpperCase() === cleanRoom &&
      (r.user_name || '').trim().toUpperCase() === cleanUser &&
      (r.sport || 'nfl').trim().toLowerCase() === cleanSport
  );

  const updatedRecord: StoredRoster = {
    id: existingIdx >= 0 ? dbState.rosters[existingIdx].id : `rost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    room_code: cleanRoom,
    user_name: cleanUser,
    sport: cleanSport,
    star_1_id: star_1_id || '',
    star_2_id: star_2_id || '',
    star_3_id: star_3_id || '',
    is_locked: guardedLocked,
    device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
    updated_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    dbState.rosters[existingIdx] = updatedRecord;
  } else {
    dbState.rosters.push(updatedRecord);
  }

  if (!dbState.rooms) dbState.rooms = {};
  dbState.rooms[`${cleanRoom}_${cleanSport}`] = { sport: cleanSport, createdAt: new Date().toISOString() };

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'upsert', roster: updatedRecord });

  res.json({ success: true, data: updatedRecord });
});

// 5. Delete a user roster
app.delete('/api/rosters', (req: Request, res: Response) => {
  const room_code = req.query.room_code || req.body.room_code;
  const user_name = req.query.user_name || req.body.user_name;
  const sport = req.query.sport || req.body.sport || 'nfl';

  const cleanRoom = (room_code || 'COUCH').toString().trim().toUpperCase();
  const cleanUser = (user_name || '').toString().trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanUser) {
    res.status(400).json({ success: false, error: 'user_name is required' });
    return;
  }

  dbState.rosters = dbState.rosters.filter(
    (r) =>
      !(
        (r.room_code || '').trim().toUpperCase() === cleanRoom &&
        (r.user_name || '').trim().toUpperCase() === cleanUser &&
        (r.sport || 'nfl').trim().toLowerCase() === cleanSport
      )
  );

  delete dbState.locks[`${cleanRoom}_${cleanUser}_${cleanSport}`];
  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'delete', user_name: cleanUser });

  res.json({ success: true });
});

// 6. Rename a squad
app.post('/api/rosters/rename', (req: Request, res: Response) => {
  const { room_code, old_user_name, new_user_name, sport = 'nfl' } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanOld = (old_user_name || '').trim().toUpperCase();
  const cleanNew = (new_user_name || '').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanOld || !cleanNew) {
    res.status(400).json({ success: false, error: 'old_user_name and new_user_name are required' });
    return;
  }

  const roster = dbState.rosters.find(
    (r) =>
      (r.room_code || '').trim().toUpperCase() === cleanRoom &&
      (r.user_name || '').trim().toUpperCase() === cleanOld &&
      (r.sport || 'nfl').trim().toLowerCase() === cleanSport
  );

  if (roster) {
    roster.user_name = cleanNew;
    roster.updated_at = new Date().toISOString();

    const oldLock = dbState.locks[`${cleanRoom}_${cleanOld}_${cleanSport}`];
    if (typeof oldLock === 'boolean') {
      dbState.locks[`${cleanRoom}_${cleanNew}_${cleanSport}`] = oldLock;
      delete dbState.locks[`${cleanRoom}_${cleanOld}_${cleanSport}`];
    }

    saveDatabase(dbState);
    broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'rename', old_user_name: cleanOld, new_user_name: cleanNew });
  }

  res.json({ success: true });
});

// 7. Reset all rosters in a room
app.post('/api/rosters/reset', (req: Request, res: Response) => {
  const { room_code } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();

  dbState.rosters = dbState.rosters.filter((r) => (r.room_code || '').trim().toUpperCase() !== cleanRoom);

  if (dbState.rooms) {
    delete dbState.rooms[`${cleanRoom}_nfl`];
    delete dbState.rooms[`${cleanRoom}_nba`];
  }

  for (const k of Object.keys(dbState.locks)) {
    if (k.startsWith(`${cleanRoom}_`)) {
      delete dbState.locks[k];
    }
  }

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, undefined, { action: 'reset' });

  res.json({ success: true });
});

// 8. Lock / unlock squad(s)
app.post('/api/rosters/lock', (req: Request, res: Response) => {
  const { room_code, user_name, is_locked, sport = 'nfl', all = false } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';
  const lockedBool = Boolean(is_locked);

  if (all) {
    dbState.rosters.forEach((r) => {
      if (
        (r.room_code || '').trim().toUpperCase() === cleanRoom &&
        (r.sport || 'nfl').trim().toLowerCase() === cleanSport
      ) {
        r.is_locked = lockedBool;
        r.device_id = lockedBool ? 'LOCKED' : 'UNLOCKED';
        r.updated_at = new Date().toISOString();
        dbState.locks[`${cleanRoom}_${r.user_name.toUpperCase()}_${cleanSport}`] = lockedBool;
      }
    });
  } else {
    const cleanUser = (user_name || '').trim().toUpperCase();
    if (!cleanUser) {
      res.status(400).json({ success: false, error: 'user_name required' });
      return;
    }

    const roster = dbState.rosters.find(
      (r) =>
        (r.room_code || '').trim().toUpperCase() === cleanRoom &&
        (r.user_name || '').trim().toUpperCase() === cleanUser &&
        (r.sport || 'nfl').trim().toLowerCase() === cleanSport
    );

    if (roster) {
      roster.is_locked = lockedBool;
      roster.device_id = lockedBool ? 'LOCKED' : 'UNLOCKED';
      roster.updated_at = new Date().toISOString();
    }
    dbState.locks[`${cleanRoom}_${cleanUser}_${cleanSport}`] = lockedBool;
  }

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'lock', is_locked: lockedBool, all });

  res.json({ success: true });
});

// 9. Clear squad stars
app.post('/api/rosters/clear-stars', (req: Request, res: Response) => {
  const { room_code, user_name, sport = 'nfl' } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanUser = (user_name || '').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanUser) {
    res.status(400).json({ success: false, error: 'user_name required' });
    return;
  }

  const roster = dbState.rosters.find(
    (r) =>
      (r.room_code || '').trim().toUpperCase() === cleanRoom &&
      (r.user_name || '').trim().toUpperCase() === cleanUser &&
      (r.sport || 'nfl').trim().toLowerCase() === cleanSport
  );

  if (roster) {
    roster.star_1_id = '';
    roster.star_2_id = '';
    roster.star_3_id = '';
    roster.is_locked = false;
    roster.device_id = 'UNLOCKED';
    roster.updated_at = new Date().toISOString();
  }
  dbState.locks[`${cleanRoom}_${cleanUser}_${cleanSport}`] = false;

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'clear_stars', user_name: cleanUser });

  res.json({ success: true });
});

// 10. Register or touch an active room
app.post('/api/rooms', (req: Request, res: Response) => {
  const { room_code, sport = 'nfl' } = req.body;
  const cleanCode = (room_code || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = (sport || '').toString().toLowerCase() === 'nba' ? 'nba' : 'nfl';

  if (cleanCode) {
    if (!dbState.rooms) dbState.rooms = {};
    dbState.rooms[`${cleanCode}_${cleanSport}`] = {
      sport: cleanSport,
      createdAt: new Date().toISOString(),
    };
    saveDatabase(dbState);
  }

  res.json({ success: true });
});

// 11. List all active rooms across all devices
app.get('/api/rooms', (req: Request, res: Response) => {
  const roomMap = new Map<string, { sport: 'nfl' | 'nba'; squads: Set<string> }>();

  // Ensure default rooms are present
  roomMap.set('COUCH_nfl', { sport: 'nfl', squads: new Set() });
  roomMap.set('HOOPS_nba', { sport: 'nba', squads: new Set() });

  // Include registered rooms
  if (dbState.rooms) {
    Object.entries(dbState.rooms).forEach(([mapKey, meta]) => {
      if (!roomMap.has(mapKey)) {
        roomMap.set(mapKey, { sport: meta.sport, squads: new Set() });
      }
    });
  }

  // Include optional query hint ?roomCode=
  const hintRoom = (req.query.roomCode as string || '').trim().toUpperCase();
  const hintSport: 'nfl' | 'nba' = (req.query.sport as string || '').toLowerCase() === 'nba' ? 'nba' : 'nfl';
  if (hintRoom) {
    const hintKey = `${hintRoom}_${hintSport}`;
    if (!roomMap.has(hintKey)) {
      roomMap.set(hintKey, { sport: hintSport, squads: new Set() });
    }
  }

  dbState.rosters.forEach((r) => {
    const code = (r.room_code || '').trim().toUpperCase();
    const user = (r.user_name || '').trim().toUpperCase();
    const sport: 'nfl' | 'nba' = r.sport === 'nba' ? 'nba' : 'nfl';

    if (!code) return;
    const mapKey = `${code}_${sport}`;

    if (!roomMap.has(mapKey)) {
      roomMap.set(mapKey, { sport, squads: new Set() });
    }
    if (user) {
      roomMap.get(mapKey)!.squads.add(user);
    }
  });

  const summaries = Array.from(roomMap.entries()).map(([key, val]) => {
    const roomCode = key.split('_')[0];
    return {
      roomCode,
      sport: val.sport,
      squadCount: val.squads.size,
      squadNames: Array.from(val.squads),
    };
  });

  res.json({ success: true, rooms: summaries });
});

// -------------------------------------------------------------
// ESPN Proxy Endpoints (Zero-CORS backend fetching)
// -------------------------------------------------------------
app.get('/api/espn/scoreboard', async (req: Request, res: Response) => {
  try {
    const sport = req.query.sport === 'nba' ? 'nba' : 'nfl';
    const week = req.query.week ? String(req.query.week) : '';
    const seasonType = req.query.seasontype ? String(req.query.seasontype) : '2';

    const baseUrl = sport === 'nba'
      ? 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'
      : 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

    const params = new URLSearchParams();
    if (sport === 'nfl') {
      params.set('seasontype', seasonType);
      if (week) params.set('week', week);
    }
    const fullUrl = `${baseUrl}?${params.toString()}`;
    const resp = await fetch(fullUrl, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `ESPN returned ${resp.status}` });
      return;
    }
    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to proxy ESPN scoreboard' });
  }
});

app.get('/api/espn/summary', async (req: Request, res: Response) => {
  try {
    const event = String(req.query.event || '');
    const sport = req.query.sport === 'nba' ? 'basketball/nba' : 'football/nfl';
    if (!event) {
      res.status(400).json({ error: 'event ID is required' });
      return;
    }
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/summary?event=${event}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `ESPN returned ${resp.status}` });
      return;
    }
    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to proxy ESPN summary' });
  }
});

app.post('/api/espn/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncESPNToSupabase();
    res.json({ success: true, message: `ESPN active week matches synced to Supabase successfully`, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Background Poller: Writes real ESPN current active week games to Supabase
// -------------------------------------------------------------
async function syncESPNToSupabase() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iugxryuapgocygjckxve.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Z3hyeXVhcGdvY3lnamNreHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDQzMDMsImV4cCI6MjA1NzYyMDMwM30.4i4n4wHwM9uPms3xGv0_oPjWbF_K0Y8l7p4m1Q2k5zM';
    if (!supabaseUrl || !supabaseKey) return;

    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch ESPN scoreboard without hardcoding a week; ESPN authoritatively holds the current active week
    // until the last game (Monday Night Football) completes!
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.events)) return;

    const activeWeek = data.week?.number || 2;

    const records = data.events
      .map((ev: any) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        return {
          id: String(ev.id),
          sport: 'nfl',
          home_team: home?.team?.abbreviation || '',
          away_team: away?.team?.abbreviation || '',
          home_score: parseInt(home?.score || '0', 10),
          away_score: parseInt(away?.score || '0', 10),
          quarter_time: ev.status?.type?.detail || 'SCHEDULED',
          status: ev.status?.type?.state === 'post' ? 'final' : ev.status?.type?.state === 'in' ? 'live' : 'scheduled',
          updated_at: new Date().toISOString(),
        };
      })
      .filter((r: any) => r.home_team && r.away_team);

    if (records.length > 0) {
      const { error } = await sb.from('matches').upsert(records);
      if (!error) {
        console.log(`[ESPN Sync] Successfully synced ${records.length} Week ${activeWeek} matches to Supabase matches table.`);
      }
    }
  } catch (err: any) {
    console.warn('[ESPN Sync] Background sync error:', err.message);
  }
}

// -------------------------------------------------------------
// Vite middleware / Static Serving Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pixel Pros server running at http://0.0.0.0:${PORT} [persistent storage enabled]`);
    // Run initial ESPN sync and set periodic interval
    syncESPNToSupabase();
    setInterval(syncESPNToSupabase, 180000);
  });
}

startServer();
