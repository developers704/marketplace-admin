import axios from 'axios'

type UploadResponse = {
  success?: boolean
  data?: unknown[]
  message?: string
}

/**
 * Upload one or more files to the file-manager (multipart).
 * Uses a fresh axios instance so global defaults (e.g. JSON Content-Type) cannot break multipart boundaries.
 */
export async function uploadFileManagerFiles(params: {
  baseUrl: string
  token: string
  folder: string
  files: File[]
}): Promise<UploadResponse> {
  const { baseUrl, token, folder, files } = params
  const root = String(baseUrl).replace(/\/$/, '')
  const url = `${root}/api/file-manager/upload`

  const fd = new FormData()
  fd.append('folder', folder ?? '')
  files.forEach((f) => {
    fd.append('files', f, f.name)
  })

  const client = axios.create({
    timeout: 30 * 60 * 1000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
  })

  const res = await client.post<UploadResponse>(url, fd, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (res.status < 200 || res.status >= 300) {
    const msg =
      (typeof res.data === 'object' && res.data && 'message' in res.data && String((res.data as UploadResponse).message)) ||
      `Upload failed (${res.status})`
    throw new Error(msg)
  }

  return res.data ?? {}
}
