const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET

/*
  Shrink before uploading. A 12 MP phone photo is ~4 MB; this brings
  it to roughly 200 KB with no visible loss at the sizes we display.
  Doing it in the browser also means slow connections aren't pushing
  megabytes up.
*/
export function compressImage(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Could not process that image')),
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('That file is not a valid image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.readAsDataURL(file)
  })
}

/* Upload straight to Cloudinary — our server never touches the file */
export async function uploadPhoto(file, onProgress) {
  if (!CLOUD || !PRESET)
    throw new Error('Photo uploads are not configured')

  if (!file.type.startsWith('image/'))
    throw new Error('Please choose an image file')

  if (file.size > 20 * 1024 * 1024)
    throw new Error('That image is too large — please pick one under 20 MB')

  const blob = await compressImage(file)

  const form = new FormData()
  form.append('file', blob)
  form.append('upload_preset', PRESET)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`)

    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({ url: data.secure_url, publicId: data.public_id })
      } else {
        reject(new Error('Upload failed — please try again'))
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed — check your connection'))
    xhr.send(form)
  })
}