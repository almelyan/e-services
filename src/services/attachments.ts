import type { RequestAttachment } from "../models";

export async function readPdf(file: File): Promise<RequestAttachment> {
  if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 1024 * 1024)
    throw Error("اختر ملف PDF بحجم لا يتجاوز 1 ميغابايت");

  const signature = new TextDecoder().decode(
    await file.slice(0, 5).arrayBuffer(),
  );

  if (signature !== "%PDF-") throw Error("الملف ليس مستند PDF صالحاً");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });

  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    dataUrl,
  };
}

export function openAttachment(a: RequestAttachment, download = false) {
  if (!a.dataUrl) return false;

  const [header, body] = a.dataUrl.split(",");

  if (
    !header.includes("application/pdf") &&
    !header.includes("application/octet-stream")
  )
    return false;

  const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/pdf" }),
  );

  const link = document.createElement("a");
  link.href = url;
  
  if (download) link.download = a.name;
  else {
    link.target = "_blank";
    link.rel = "noopener";
  }

  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  
  return true;
}
