import type jsPDF from "jspdf";

const BASE_PATH = "C:\\Users\\91903\\Desktop\\AS-TRADERS\\SALES";

/**
 * Saves PDF to C:\Users\91903\Desktop\AS-TRADERS\SALES\Year\Month\filename.pdf
 * using the File System Access API. Falls back to regular download if unavailable.
 */
export async function saveWithFolderStructure(
  doc: jsPDF,
  year: string,
  month: string,
  fileName: string
): Promise<void> {
  // Try File System Access API (Chrome/Edge 86+)
  if ("showDirectoryPicker" in window) {
    try {
      // Prompt user to pick the base folder (first time only — they select AS-TRADERS/SALES)
      const rootHandle = await (window as any).showDirectoryPicker({
        id: "as-traders-sales",
        mode: "readwrite",
        startIn: "desktop",
      });

      const yearDir = await rootHandle.getDirectoryHandle(year, {
        create: true,
      });
      const monthDir = await yearDir.getDirectoryHandle(month, {
        create: true,
      });

      const fileHandle = await monthDir.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      const blob = doc.output("blob");
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled — fall through to regular download
      }
    }
  }

  // Fallback: save with structured filename
  doc.save(`${year}_${month}_${fileName}`);
}
