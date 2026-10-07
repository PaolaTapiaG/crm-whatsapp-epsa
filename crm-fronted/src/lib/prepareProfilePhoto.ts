export async function prepareProfilePhoto(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('Selecciona una imagen JPG o PNG.');
  }

  const image = await createImageBitmap(file);
  try {
    const side = 640;
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo preparar la imagen.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, side, side);
    const scale = Math.min(side / image.width, side / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, (side - width) / 2, (side - height) / 2, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob) throw new Error('No se pudo preparar la imagen.');
    return new File([blob], 'perfil-whatsapp.jpg', { type: 'image/jpeg' });
  } finally {
    image.close();
  }
}
