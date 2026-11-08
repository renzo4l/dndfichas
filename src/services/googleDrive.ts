import { getAccessToken } from './firebaseAuth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
}

/**
 * Searches files and folders in Google Drive.
 * Can filter by query or specific RPG keywords.
 */
export async function searchDriveFiles(query = ''): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive. Faça login primeiro.');
  }

  let q = "trashed = false";
  if (query.trim()) {
    q += ` and (name contains '${query.replace(/'/g, "\\'")}')`;
  }

  const fields = 'files(id, name, mimeType, modifiedTime, size, parents)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=30&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Falha ao buscar no Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Searches specifically for RPG-related folders or files in Drive
 * (e.g. "biblioteca rpg", "dungeons and dragons", or JSON sheet files).
 */
export async function findRpgFoldersAndFiles(): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive.');
  }

  // Broad query to find rpg folders or files
  const q = "trashed = false and (name contains 'rpg' or name contains 'dungeons' or name contains 'dragons' or name contains 'ficha' or name contains 'dnd')";
  const fields = 'files(id, name, mimeType, modifiedTime, size, parents)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=50&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Falha ao buscar pastas RPG no Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads the text or JSON content of a Drive file.
 */
export async function downloadDriveFile(fileId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Não foi possível baixar o arquivo (${res.status}). Verifique as permissões.`);
  }

  return await res.text();
}

/**
 * Saves or updates a JSON file in Google Drive.
 * Uses multipart upload to set both metadata and content.
 */
export async function saveFileToDrive(fileName: string, jsonContent: string): Promise<{ id: string; name: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive.');
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName.endsWith('.json') ? fileName : `${fileName}.json`,
    mimeType: 'application/json',
    description: 'Ficha D&D 5e exportada pelo aplicativo D&D 5e Fichas & Campanhas',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Falha ao salvar no Google Drive (${res.status})`);
  }

  const data = await res.json();
  return { id: data.id, name: data.name };
}
