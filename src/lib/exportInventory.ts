import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

import { buildSpreadsheetBase64 } from '@/lib/spreadsheet';
import { readPhotoBase64 } from '@/lib/storage';
import type { Product } from '@/lib/types';

export type ExportKind = 'sheet' | 'zip';

function exportDirectory(): Directory {
  const directory = new Directory(Paths.cache, 'exports');
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

function datedName(extension: string): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `apparel-inventory-${stamp}.${extension}`;
}

function writeBase64(name: string, base64: string): File {
  const file = new File(exportDirectory(), name);
  if (file.exists) file.delete();
  file.create();
  file.writeSync(base64, { encoding: 'base64' });
  return file;
}

async function share(file: File, mimeType: string, uti: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this phone.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType,
    UTI: uti,
    dialogTitle: 'Export inventory',
  });
}

export async function exportInventory(products: Product[], kind: ExportKind): Promise<void> {
  const spreadsheet = await buildSpreadsheetBase64(products);

  if (kind === 'sheet') {
    const file = writeBase64(datedName('xlsx'), spreadsheet);
    await share(
      file,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'org.openxmlformats.spreadsheetml.sheet',
    );
    return;
  }

  const zip = new JSZip();
  zip.file('inventory.xlsx', spreadsheet, { base64: true });
  for (const product of products) {
    const photo = await readPhotoBase64(product.imageName);
    if (photo) zip.file(`photos/${product.imageName}`, photo, { base64: true });
  }
  const zipped = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
  const file = writeBase64(datedName('zip'), zipped);
  await share(file, 'application/zip', 'public.zip-archive');
}
