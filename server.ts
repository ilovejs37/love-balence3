import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'records.json');

// Ensure data directory and file exist
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readRecords(): any[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading records file:', err);
    return [];
  }
}

function writeRecords(records: any[]) {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing records file:', err);
  }
}

// 1. GET /api/records - Retrieve all records (with filter, search, sort)
app.get('/api/records', (req, res) => {
  let records = readRecords();

  const { search, status, gender, region, occupation, sortBy } = req.query as Record<string, string>;

  if (search) {
    const q = search.toLowerCase().trim();
    records = records.filter((r) => {
      const name = r.leadInfo?.name?.toLowerCase() || '';
      const phone = r.leadInfo?.phone?.toLowerCase() || '';
      const occ = r.selfProfile?.occupationGroup?.toLowerCase() || '';
      const reg = r.selfProfile?.region?.toLowerCase() || '';
      const arch = r.summary?.archetypeTitle?.toLowerCase() || '';
      const notes = r.adminNotes?.toLowerCase() || '';
      return name.includes(q) || phone.includes(q) || occ.includes(q) || reg.includes(q) || arch.includes(q) || notes.includes(q);
    });
  }

  if (status && status !== 'ALL') {
    if (status === 'LEADS_ONLY') {
      records = records.filter((r) => r.hasLeadConsultation);
    } else {
      records = records.filter((r) => r.leadStatus === status);
    }
  }

  if (gender && gender !== '전체') {
    records = records.filter((r) => r.selfProfile?.gender === gender);
  }

  if (region && region !== '전체') {
    records = records.filter((r) => r.selfProfile?.region === region);
  }

  if (occupation && occupation !== '전체') {
    records = records.filter((r) => r.selfProfile?.occupationGroup === occupation);
  }

  // Sort records
  records.sort((a, b) => {
    if (sortBy === 'lead_first') {
      if (a.hasLeadConsultation && !b.hasLeadConsultation) return -1;
      if (!a.hasLeadConsultation && b.hasLeadConsultation) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'rarity_desc') {
      return (a.summary?.rarityPercent || 0) - (b.summary?.rarityPercent || 0); // Lower % = more rare
    }
    if (sortBy === 'consistency_desc') {
      return (b.summary?.preferenceConsistency || 0) - (a.summary?.preferenceConsistency || 0);
    }
    // Default: latest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ success: true, count: records.length, records });
});

// 2. GET /api/records/:id - Get single record
app.get('/api/records/:id', (req, res) => {
  const records = readRecords();
  const record = records.find((r) => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  res.json({ success: true, record });
});

// 3. POST /api/records - Create or update a record
app.post('/api/records', (req, res) => {
  try {
    const payload = req.body;
    let records = readRecords();

    const recordId = payload.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const existingIndex = records.findIndex((r) => r.id === recordId);

    const now = new Date().toISOString();
    const updatedRecord = {
      ...(existingIndex >= 0 ? records[existingIndex] : {}),
      ...payload,
      id: recordId,
      updatedAt: now,
      createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : (payload.createdAt || now),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = updatedRecord;
    } else {
      records.unshift(updatedRecord);
    }

    writeRecords(records);
    res.json({ success: true, record: updatedRecord });
  } catch (err: any) {
    console.error('Error saving record:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. PUT /api/records/:id - Update specific fields (status, admin notes)
app.put('/api/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const records = readRecords();

    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    records[idx] = {
      ...records[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeRecords(records);
    res.json({ success: true, record: records[idx] });
  } catch (err: any) {
    console.error('Error updating record:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. DELETE /api/records/:id - Delete single record
app.delete('/api/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    let records = readRecords();
    records = records.filter((r) => r.id !== id);
    writeRecords(records);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. DELETE /api/records - Clear all records
app.delete('/api/records', (req, res) => {
  try {
    writeRecords([]);
    res.json({ success: true, message: 'All records cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. GET /api/stats - Compute aggregate analytics
app.get('/api/stats', (req, res) => {
  const records = readRecords();
  const totalRecords = records.length;
  const totalLeads = records.filter((r) => r.hasLeadConsultation).length;
  const pendingLeadsCount = records.filter((r) => r.leadStatus === '대기').length;
  const conversionRate = totalRecords > 0 ? Math.round((totalLeads / totalRecords) * 100) : 0;

  const maleCount = records.filter((r) => r.selfProfile?.gender === '남성').length;
  const femaleCount = records.filter((r) => r.selfProfile?.gender === '여성').length;

  const validAges = records.map((r) => r.selfProfile?.age).filter(Boolean);
  const avgAge = validAges.length > 0 ? Math.round(validAges.reduce((a, b) => a + b, 0) / validAges.length) : 0;

  const validRarities = records.map((r) => r.summary?.rarityPercent).filter((v) => typeof v === 'number');
  const avgRarity = validRarities.length > 0 ? Number((validRarities.reduce((a, b) => a + b, 0) / validRarities.length).toFixed(1)) : 0;

  const validConsistencies = records.map((r) => r.summary?.preferenceConsistency).filter((v) => typeof v === 'number');
  const avgConsistency = validConsistencies.length > 0 ? Math.round(validConsistencies.reduce((a, b) => a + b, 0) / validConsistencies.length) : 0;

  // Occupation counts
  const occCounts: Record<string, number> = {};
  records.forEach((r) => {
    const occ = r.selfProfile?.occupationGroup;
    if (occ) occCounts[occ] = (occCounts[occ] || 0) + 1;
  });
  const topOccupation = Object.entries(occCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'IT/개발';

  // Archetype counts
  const archCounts: Record<string, number> = {};
  records.forEach((r) => {
    const arch = r.summary?.archetypeTitle;
    if (arch) archCounts[arch] = (archCounts[arch] || 0) + 1;
  });
  const topArchetype = Object.entries(archCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '안정 지향 현실주의자';

  res.json({
    success: true,
    stats: {
      totalRecords,
      totalLeads,
      conversionRate,
      maleCount,
      femaleCount,
      avgAge,
      avgRarity,
      avgConsistency,
      topOccupation,
      topArchetype,
      pendingLeadsCount,
    }
  });
});

// Vite middleware & Static server setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LOVE BALANCE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
