export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  // We assume the API is at the same origin /api/images
  // If not, we might need an environment variable or config
  const response = await fetch('/api/images', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
