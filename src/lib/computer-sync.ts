import Constants from 'expo-constants';

import { buildSpreadsheetBase64 } from '@/lib/spreadsheet';
import { loadProducts, readPhotoBase64 } from '@/lib/storage';

const RECEIVER_PORT = 8787;

export type ComputerCopyResult =
  | { ok: true; folder: string; photoCount: number }
  | { ok: false; message: string };

type CopyOptions = {
  imageNames?: string[];
  deleteNames?: string[];
  onProgress?: (message: string) => void;
};

function devHost(): string | null {
  const candidates = [Constants.expoConfig?.hostUri, Constants.linkingUri, Constants.experienceUrl];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = candidate.match(/(?:[a-z][a-z0-9+.-]*:\/\/)?([^/:]+)/i);
    const host = match?.[1];
    if (host && isPrivateHost(host)) return host;
  }
  return null;
}

function isPrivateHost(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return true;
  const parts = host.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || (a === 192 && b === 168)) return true;
  return a === 172 && b >= 16 && b <= 31;
}

function computerOrigin(): string | null {
  const host = devHost();
  if (!host) return null;
  return `http://${host}:${RECEIVER_PORT}`;
}

const OFFLINE_MESSAGE =
  'Saved on this phone. The computer did not get the photo. Leave npx expo start running on the PC, allow the firewall prompt, and keep the phone on that same hotspot or Wi-Fi.';

async function postFiles(
  origin: string,
  body: { spreadsheetBase64?: string; photos?: { imageName: string; base64: string }[]; deleteNames?: string[] },
): Promise<ComputerCopyResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${origin}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = (await response.json()) as { ok?: boolean; folder?: string; message?: string };
    if (!response.ok || !payload.ok || !payload.folder) {
      return { ok: false, message: payload.message || OFFLINE_MESSAGE };
    }
    return { ok: true, folder: payload.folder, photoCount: body.photos?.length ?? 0 };
  } catch {
    return { ok: false, message: OFFLINE_MESSAGE };
  } finally {
    clearTimeout(timer);
  }
}

export async function copyToComputer(options: CopyOptions = {}): Promise<ComputerCopyResult> {
  const origin = computerOrigin();
  if (!origin) {
    return {
      ok: false,
      message:
        'The phone is not on the computer’s hotspot or Wi-Fi. Connect them together, run npx expo start on the PC, then copy the photos again.',
    };
  }

  const products = loadProducts();
  const imageNames = options.imageNames ?? products.map((product) => product.imageName);
  const photos: { imageName: string; base64: string }[] = [];

  for (let index = 0; index < imageNames.length; index += 1) {
    const imageName = imageNames[index];
    options.onProgress?.(`Copying photo ${index + 1} of ${imageNames.length}...`);
    const base64 = await readPhotoBase64(imageName);
    if (!base64) continue;
    photos.push({ imageName, base64 });
  }

  options.onProgress?.('Updating the spreadsheet on the computer...');
  const spreadsheetBase64 = await buildSpreadsheetBase64(products);
  const result = await postFiles(origin, {
    spreadsheetBase64,
    photos,
    deleteNames: options.deleteNames ?? [],
  });
  if (!result.ok) return result;
  return { ...result, photoCount: photos.length };
}
