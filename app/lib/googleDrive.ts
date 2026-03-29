declare global {
  interface Window {
    google: any;
  }
}

let accessToken: string | null = null;

function getGoogleClientId(): string {
  return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

function requestAccessToken(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      reject(
        new Error(
          "Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file."
        )
      );
      return;
    }

    try {
      await loadGoogleScript();
    } catch (e) {
      reject(e);
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
        } else {
          accessToken = response.access_token;
          resolve(response.access_token);
        }
      },
      error_callback: (error: any) => {
        reject(new Error(error.message || "Google OAuth failed"));
      },
    });

    tokenClient.requestAccessToken();
  });
}

async function getOrCreateFolder(
  name: string,
  parentId: string | null,
  token: string
): Promise<string> {
  const parentClause = parentId
    ? `'${parentId}' in parents`
    : `'root' in parents`;
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and ${parentClause} and trashed=false`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!searchRes.ok) {
    throw new Error(`Failed to search Google Drive: ${searchRes.statusText}`);
  }

  const data = await searchRes.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const metadata: Record<string, any> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) metadata.parents = [parentId];

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    throw new Error(
      `Failed to create folder '${name}': ${createRes.statusText}`
    );
  }

  const folder = await createRes.json();
  return folder.id;
}

export async function uploadToGoogleDrive(
  pdfBlob: Blob,
  fileName: string,
  customerName: string
): Promise<{ success: boolean; link?: string; error?: string }> {
  try {
    const token = accessToken || (await requestAccessToken());

    const date = new Date();
    const year = date.getFullYear().toString();
    const month = date.toLocaleString("en-US", { month: "long" });

    // Create folder hierarchy: Invoice > Year > Month
    const invoiceFolderId = await getOrCreateFolder("Invoice", null, token);
    const yearFolderId = await getOrCreateFolder(year, invoiceFolderId, token);
    const monthFolderId = await getOrCreateFolder(month, yearFolderId, token);

    // Upload file using multipart upload
    const metadata = {
      name: `${customerName}.pdf`,
      parents: [monthFolderId],
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", pdfBlob, `${customerName}.pdf`);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.statusText}`);
    }

    const file = await uploadRes.json();
    return { success: true, link: file.webViewLink };
  } catch (error: any) {
    accessToken = null;
    return { success: false, error: error.message };
  }
}
