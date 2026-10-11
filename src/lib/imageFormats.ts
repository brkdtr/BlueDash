const heicExtensions = /\.(heic|heif)$/i;
const heicMimeTypes = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

export function isHeicFile(file: File): boolean {
  return heicMimeTypes.has(file.type.toLowerCase()) || heicExtensions.test(file.name);
}

export async function normalizeImageFile(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return new File([blob], file.name.replace(heicExtensions, ".jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified
    });
  } catch (error) {
    throw new Error(
      "HEIC fotograf JPEG'e donusturulemedi. iPhone Ayarlar > Kamera > Bicimler bolumunden 'En Uyumlu' secenegini kullanabilir veya fotografi JPEG olarak paylasabilirsiniz."
    );
  }
}
