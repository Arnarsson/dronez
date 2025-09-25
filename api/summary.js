import { promises as fs } from 'fs';
import { join } from 'path';

export default async function handler(request, response) {
  try {
    const filePath = join(process.cwd(), 'data', 'processed', 'incidents_summary.json');
    const payload = await fs.readFile(filePath, 'utf8');
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    response.status(200).send(payload);
  } catch (error) {
    console.error('[api/summary] failed to read summary', error);
    response.status(500).json({ error: 'Failed to load summary dataset' });
  }
}
