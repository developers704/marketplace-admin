import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import Swal from 'sweetalert2'
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisV,
  FaFile,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFolder,
  FaDownload,
  FaRedo,
  FaSearch,
  FaTh,
  FaThList,
  FaTrash,
  FaUpload,
} from 'react-icons/fa'
import { LuArrowLeft } from 'react-icons/lu'
import { FaFolderPlus } from 'react-icons/fa6'
import { useAuthContext } from '@/common'
import { uploadFileManagerFiles } from '@/common/api/fileManager'
import { toastService } from '@/common/context/toast.service'

type FmItem = {
  name: string
  type: 'folder' | 'file'
  path: string
  url: string | null
  size: number
  createdAt: string
  updatedAt: string
  isImage: boolean
}

function formatBytes(n: number) {
  if (!n) return '—'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]}`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

function formatShortDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

const FOLDER_ACCENT = ['#f59e0b', '#3b82f6', '#ec4899', '#f97316', '#6366f1', '#14b8a6']

function folderAccentFromName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i += 1) {
    h = (h << 5) - h + name.charCodeAt(i)
    h |= 0
  }
  return FOLDER_ACCENT[Math.abs(h) % FOLDER_ACCENT.length]
}

function fileExtension(name: string) {
  const parts = name.split('.')
  if (parts.length < 2) return ''
  return (parts.pop() || '').toLowerCase()
}

function publicFileUrl(baseApi: string, url: string | null) {
  if (!url) return ''
  const origin = baseApi.replace(/\/api\/?$/i, '').replace(/\/$/, '')
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

const UploadedFilesManager: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const BASE_API = import.meta.env.VITE_BASE_API as string

  const [currentFolder, setCurrentFolder] = useState('')
  const [items, setItems] = useState<FmItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalFolders, setTotalFolders] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(48)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [previewsEnabled, setPreviewsEnabled] = useState(true)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [savingFolder, setSavingFolder] = useState(false)
  const [listBump, setListBump] = useState(0)
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)


  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(searchInput.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [currentFolder, searchDebounced, pageSize])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    ;(async () => {
      try {
        const params = new URLSearchParams()
        if (currentFolder) params.set('folder', currentFolder)
        params.set('page', String(page))
        params.set('limit', String(pageSize))
        if (searchDebounced) params.set('search', searchDebounced)
        const res = await fetch(`${BASE_API}/api/file-manager?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`)
        const rows = Array.isArray(json?.data) ? json.data : []
        const tot = typeof json?.total === 'number' ? json.total : rows.length
        if (rows.length === 0 && tot > 0 && page > 1) {
          setPage((p) => Math.max(1, p - 1))
          return
        }
        setItems(rows)
        setTotal(tot)
        setTotalFolders(typeof json?.totalFolders === 'number' ? json.totalFolders : 0)
        setTotalFiles(typeof json?.totalFiles === 'number' ? json.totalFiles : 0)
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return
        const msg = e instanceof Error ? e.message : 'Failed to load files'
        toastService.error(msg)
        setItems([])
        setTotal(0)
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [BASE_API, token, currentFolder, page, pageSize, searchDebounced, listBump])

  const pathSegments = useMemo(
    () => (currentFolder ? currentFolder.split('/').filter(Boolean) : []),
    [currentFolder]
  )

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)

  const folders = useMemo(() => items.filter((i) => i.type === 'folder'), [items])
  const files = useMemo(() => items.filter((i) => i.type === 'file'), [items])
  const imageFiles = useMemo(() => files.filter((i) => i.type === "file" && i.isImage && !!i.url),[files])

  const goToFolder = (relative: string) => {
    setCurrentFolder(relative)
    setSearchInput('')
    setPage(1)
  }

  const goUp = () => {
    if (!pathSegments.length) return
    const next = pathSegments.slice(0, -1).join('/')
    goToFolder(next)
  }

  const openChildFolder = (name: string) => {
    const next = pathSegments.length ? `${currentFolder}/${name}` : name
    goToFolder(next)
  }

  const bumpList = () => setListBump((x) => x + 1)

  const createFolder = async () => {
    if (!token) return
    const name = newFolderName.trim()
    if (!name) {
      toastService.warning('Enter a folder name')
      return
    }
    setSavingFolder(true)
    try {
      const res = await fetch(`${BASE_API}/api/file-manager/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parent: currentFolder, folderName: name }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || 'Create failed')
      toastService.success('Folder created')
      setShowFolderModal(false)
      setNewFolderName('')
      setPage(1)
      bumpList()
    } catch (e: unknown) {
      toastService.error(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSavingFolder(false)
    }
  }

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const input = e.target
    const picked = Array.from(input.files || [])
    input.value = ''
    if (!picked.length) return
    if (!BASE_API?.trim()) {
      toastService.error('API URL missing (VITE_BASE_API).')
      return
    }
    if (!token) {
      toastService.error('Please sign in again (no auth token).')
      return
    }
    setUploading(true)
    try {
      const json = await uploadFileManagerFiles({
        baseUrl: BASE_API,
        token,
        folder: currentFolder,
        files: picked,
      })
      const count = Array.isArray(json?.data) ? json.data.length : picked.length
      toastService.success(`Uploaded ${count} file(s)`)
      bumpList()
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (item: FmItem) => {
    if (item.type !== 'file' || !token) return
    setDownloadingPath(item.path)
    try {
      const params = new URLSearchParams({ path: item.path })
      const res = await fetch(`${BASE_API}/api/file-manager/file?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = res.statusText
        try {
          const j = JSON.parse(text) as { message?: string }
          if (j?.message) msg = j.message
        } catch {
          /* use statusText */
        }
        throw new Error(msg)
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition')
      let filename = item.name
      const m = cd?.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i)
      const rawName = m?.[1] || m?.[2]
      if (rawName) {
        try {
          filename = decodeURIComponent(rawName.replace(/["']/g, ''))
        } catch {
          filename = rawName.replace(/["']/g, '')
        }
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toastService.success('Download started')
    } catch (e: unknown) {
      toastService.error(e instanceof Error ? e.message : 'Download failed')
    } finally {
      setDownloadingPath(null)
    }
  }

  const confirmDelete = async (item: FmItem) => {
    const ok = await Swal.fire({
      title: item.type === 'folder' ? 'Delete folder?' : 'Delete file?',
      text: item.type === 'folder'
        ? `"${item.name}" and all contents will be removed.`
        : `"${item.name}" will be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc3545',
    })
    if (!ok.isConfirmed || !token) return
    try {
      const res = await fetch(`${BASE_API}/api/file-manager`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ path: item.path }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || 'Delete failed')
      toastService.success('Deleted')
      bumpList()
    } catch (err: unknown) {
      toastService.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const renderFileIcon = (item: FmItem, size = 36) => {
    const ext = fileExtension(item.name)
    if (ext === 'pdf') return <FaFilePdf className="text-danger" size={size} />
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FaFileExcel style={{ color: '#217346' }} size={size} aria-label="Excel file" />
    }
    if (item.isImage) return <FaFileImage className="text-primary" size={size} />
    return <FaFile className="text-secondary" size={size} />
  }

  const showImageThumb = (item: FmItem) =>
    previewsEnabled && item.type === 'file' && item.isImage && !!item.url

  const openImagePreview = (item: FmItem) => {
    const idx = imageFiles.findIndex((img) => img.path === item.path)
    if (idx >= 0) setPreviewIndex(idx)
  }

  const goPreviewNext = () => {
    setPreviewIndex((idx) =>
      idx === null ? null : (idx + 1) % imageFiles.length
    )
  }

  const goPreviewPrev = () => {
    setPreviewIndex((idx) =>
      idx === null ? null : (idx - 1 + imageFiles.length) % imageFiles.length
    )
  }

  const closeImagePreview = () => {
    setPreviewIndex(null)
  }

  const previewItem = previewIndex !== null ? imageFiles[previewIndex] : null

  const fileManagerActionsMenu = (item: FmItem) => {
    const menuId = `fm-dd-${item.path.replace(/\W+/g, '-')}`
    return (
      <Dropdown align="end" onClick={(e) => e.stopPropagation()}>
        <Dropdown.Toggle
          variant="light"
          size="sm"
          id={menuId}
          className="fm-doc-card__kebab rounded-circle shadow-none border-0 px-2 py-1 text-secondary"
        >
          <FaEllipsisV size={14} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {item.type === 'folder' && (
            <Dropdown.Item
              onClick={(e) => {
                e.stopPropagation()
                openChildFolder(item.name)
              }}
            >
              Open folder
            </Dropdown.Item>
          )}
          {item.type === 'file' && (
            <Dropdown.Item
              disabled={downloadingPath === item.path}
              onClick={(e) => {
                e.stopPropagation()
                void handleDownload(item)
              }}
            >
              {downloadingPath === item.path ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  Downloading…
                </span>
              ) : (
                <>
                  <FaDownload className="me-2" />
                  Download
                </>
              )}
            </Dropdown.Item>
          )}
          <Dropdown.Divider />
          <Dropdown.Item
            className="text-danger"
            onClick={(e) => {
              e.stopPropagation()
              void confirmDelete(item)
            }}
          >
            <FaTrash className="me-2" />
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  const itemCard = (item: FmItem) => {
    const accent = item.type === 'folder' ? folderAccentFromName(item.name) : undefined
    return (
      <div
        key={item.path}
        className={`fm-doc-card h-100 ${item.type === 'folder' ? 'fm-doc-card--folder' : 'fm-doc-card--file'}`}
        role={item.type === 'folder' ? 'button' : undefined}
        tabIndex={item.type === 'folder' ? 0 : undefined}
        onClick={() => item.type === 'folder' && openChildFolder(item.name)}
        onKeyDown={(e) => {
          if (item.type !== 'folder') return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openChildFolder(item.name)
          }
        }}
      >
        <div className="fm-doc-card__header d-flex justify-content-between align-items-start gap-2">
          <span
            className={`fm-doc-card__type-pill ${item.type === 'folder' ? 'fm-doc-card__type-pill--folder' : ''}`}
          >
            {item.type === 'folder' ? 'Folder' : 'File'}
          </span>
          {fileManagerActionsMenu(item)}
        </div>
        <div className="fm-doc-card__body text-center px-3 pb-2">
          <div
            className="fm-doc-card__icon-wrap mx-auto d-flex align-items-center justify-content-center mb-3"
            style={{ color: item.type === 'folder' ? accent : undefined }}
          >
            {item.type === 'folder' ? (
              <FaFolder size={52} className="fm-doc-card__folder-icon" />
            ) : showImageThumb(item) ? (
              <button
                type="button"
                className="fm-doc-card__thumb-btn rounded-3 border-0 bg-light p-0 overflow-hidden"
                style={{ width: 120, height: 96 }}
                onClick={(ev) => {
                  ev.stopPropagation()
                  openImagePreview(item)
                }}
              >
                <img
                  src={publicFileUrl(BASE_API, item.url)}
                  alt={item.name}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ) : (
              <div className="d-flex align-items-center justify-content-center fm-doc-card__file-icon-slot">
                {renderFileIcon(item, 48)}
              </div>
            )}
          </div>
          <div className="fw-semibold text-break fm-doc-card__title" title={item.name}>
            {item.name}
          </div>
          <div className="text-muted small mt-1 fm-doc-card__meta">{formatShortDate(item.updatedAt)}</div>
          {item.type === 'file' && (
            <div className="text-muted small fm-doc-card__meta">{formatBytes(item.size)}</div>
          )}
        </div>
        <div className="fm-doc-card__footer d-flex align-items-center justify-content-center gap-1 text-muted small">
          {item.type === 'folder' ? (
            <>
              <FaFolder className="opacity-50" size={12} />
              <span>Open</span>
            </>
          ) : (
            <>
              <FaFile className="opacity-50" size={12} />
              <span>Document</span>
            </>
          )}
        </div>
      </div>
    )
  }

  const totalShown = folders.length + files.length

  return (
    <>
      <Helmet>
        <title>Uploaded Files Manager | 3pl</title>
      </Helmet>
      <div className="uploaded-files-manager-page">
        <Row className="mb-4">
          <Col xs={12}>
            <div className="fm-page-hero">
              <div className="fm-page-hero__accent" aria-hidden />
              <div className="fm-page-hero__inner d-flex flex-column flex-lg-row align-items-lg-start justify-content-lg-between gap-3 gap-lg-4">
                <div className="fm-page-hero__copy">
                  <p className="fm-page-hero__eyebrow mb-2">Document library</p>
                  <h4 className="fm-page-hero__title mb-2">Uploaded Files Manager</h4>
                  <p className="fm-page-hero__subtitle mb-0">
                    Organize, share, and manage your documents in one place.
                  </p>
                </div>
                <Breadcrumb className="fm-page-hero__crumbs mb-0 align-self-lg-end">
                  <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
                    Home
                  </Breadcrumb.Item>
                  <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/settings/ecommerce' }}>
                    Core Settings
                  </Breadcrumb.Item>
                  <Breadcrumb.Item active>Uploaded Files Manager</Breadcrumb.Item>
                </Breadcrumb>
              </div>
            </div>
          </Col>
        </Row>

        <Card className="fm-surface-card border-0">
          <Card.Body className="fm-surface-card__body px-3 px-lg-4 py-4">
            <div className="fm-toolbar rounded-4 p-3 p-lg-4 mb-3">
              <Row className="g-3 align-items-center">
                <Col xs={12} lg="auto" className="d-flex flex-wrap align-items-center gap-2">
                  <Button
                    type="button"
                    variant="light"
                    className="fm-btn-lux fm-btn-lux-folder d-inline-flex align-items-center gap-2"
                    onClick={() => setShowFolderModal(true)}
                  >
                    <FaFolderPlus className="fm-btn-lux__icon" aria-hidden />
                    New folder
                  </Button>
                  <span className="position-relative d-inline-block fm-upload-hitbox">
                    <Button
                      type="button"
                      variant="light"
                      className="fm-btn-lux fm-btn-lux-upload d-inline-flex align-items-center gap-2"
                      style={{ pointerEvents: 'none' }}
                      tabIndex={-1}
                      disabled={uploading}
                      aria-hidden
                    >
                      {uploading ? <Spinner animation="border" size="sm" /> : <FaUpload className="fm-btn-lux__icon" />}
                      {uploading ? 'Uploading…' : 'Upload files'}
                    </Button>
                    <input
                      type="file"
                      multiple
                      disabled={uploading}
                      aria-label="Choose files to upload"
                      title="Choose files to upload"
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      style={{ cursor: uploading ? 'wait' : 'pointer', zIndex: 2 }}
                      onChange={onFilesSelected}
                    />
                  </span>
                  <Button
                    type="button"
                    variant="light"
                    className="fm-btn-lux fm-btn-lux-icon"
                    onClick={() => bumpList()}
                    disabled={loading}
                    title="Refresh listing"
                    aria-label="Refresh listing"
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : <FaRedo />}
                  </Button>
                </Col>
                <Col xs={12} lg>
                  <InputGroup className="fm-search-group shadow-sm">
                    <InputGroup.Text className="fm-search-group__prefix border-0 bg-transparent">
                      <FaSearch className="text-secondary opacity-75" aria-hidden />
                    </InputGroup.Text>
                    <Form.Control
                      className="fm-search-group__input border-0 shadow-none"
                      placeholder="Search in this folder…"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      aria-label="Search files and folders"
                    />
                  </InputGroup>
                </Col>
                <Col xs={12} md={6} lg="auto" className="d-flex align-items-center">
                  <Form.Check
                    type="switch"
                    id="fm-previews"
                    label="Image previews"
                    checked={previewsEnabled}
                    onChange={(e) => setPreviewsEnabled(e.target.checked)}
                    className="fm-toolbar-switch mb-0 text-nowrap"
                  />
                </Col>
                <Col xs={12} lg="auto" className="d-flex justify-content-lg-end">
                  <div className="fm-view-toggle" role="group" aria-label="Layout">
                    <Button
                      type="button"
                      variant="light"
                      className={`fm-view-toggle__btn ${view === 'grid' ? 'is-active' : ''}`}
                      onClick={() => setView('grid')}
                      title="Grid view"
                      aria-pressed={view === 'grid'}
                    >
                      <FaTh aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="light"
                      className={`fm-view-toggle__btn ${view === 'list' ? 'is-active' : ''}`}
                      onClick={() => setView('list')}
                      title="List view"
                      aria-pressed={view === 'list'}
                    >
                      <FaThList aria-hidden />
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="fm-path-strip rounded-4 px-2 py-2 py-md-1 mb-3 d-flex flex-wrap align-items-center gap-2 gap-md-3 small">
     
            <span className="fm-path-strip__label text-uppercase fw-semibold"></span>
            <Breadcrumb className="fm-path-strip__crumbs mb-0 flex-grow-1 ">
              <Breadcrumb.Item
                className="fm-path-strip__crumb-link"
                style={{ cursor: 'pointer' }}
                onClick={() => goToFolder('')}
              >
                <FaFolder className="fm-path-strip__folder-ico me-1" aria-hidden  />
                
              </Breadcrumb.Item >
              {pathSegments.map((seg, idx) => {
                const prefix = pathSegments.slice(0, idx + 1).join('/')
                const isLast = idx === pathSegments.length - 1
                return isLast ? (
                  <Breadcrumb.Item key={prefix} active>
                    {seg}
                  </Breadcrumb.Item>
                ) : (
                  <Breadcrumb.Item
                    key={prefix}
                    className="fm-path-strip__crumb-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => goToFolder(prefix)}
                  >
                    {seg}
                  </Breadcrumb.Item>
                )
              })}
            </Breadcrumb>
              {pathSegments.length > 0 && (
              <Button
                type="button"
                variant="light"
                size="sm"
                className="fm-btn-lux fm-btn-lux-ghost-sm d-flex align-items-center gap-1"
                onClick={goUp}
              >
                <LuArrowLeft size={18} /> Go To Back
              </Button>
            )}
           
          </div>

          {total > 0 && (
            <div className="fm-folder-summary text-muted small mb-3">
              This folder has <strong>{totalFolders.toLocaleString()}</strong> folders and{' '}
              <strong>{totalFiles.toLocaleString()}</strong> files
              {searchDebounced ? ' (after search filter)' : ''}. Listing is paginated for performance.
            </div>
          )}

          {loading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" />
            </div>
          ) : view === 'grid' ? (
            <>
              {folders.length > 0 && (
                <>
                  <div className="d-flex align-items-baseline justify-content-between gap-2 mb-3">
                    <h6 className="fm-section-title mb-0">
                      Folders <span className="text-muted fw-normal">({folders.length})</span>
                    </h6>
                  </div>
                  <div className="fm-grid mb-4">{folders.map(itemCard)}</div>
                </>
              )}
              {files.length > 0 && (
                <>
                  <div className="d-flex align-items-baseline justify-content-between gap-2 mb-3">
                    <h6 className="fm-section-title mb-0">
                      Files <span className="text-muted fw-normal">({files.length})</span>
                    </h6>
                  </div>
                  <div className="fm-grid">{files.map(itemCard)}</div>
                </>
              )}
              {totalShown === 0 && (
                <div className="fm-empty-plate text-center text-muted py-5 px-3 rounded-4">
                  {searchDebounced ? 'No items match your search.' : 'This folder is empty.'}
                </div>
              )}
            </>
          ) : (
            <Table responsive hover bordered className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 72 }} />
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Updated</th>
                  <th style={{ width: 140 }} className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...folders, ...files].map((item) => (
                  <tr
                    key={item.path}
                    style={{ cursor: item.type === 'folder' ? 'pointer' : 'default' }}
                    onClick={() => item.type === 'folder' && openChildFolder(item.name)}
                  >
                    <td>
                      {item.type === 'folder' ? (
                        <FaFolder className="text-warning" size={28} />
                      ) : showImageThumb(item) ? (
                       <button
                        type="button"
                        className="border-0 bg-transparent p-0"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          openImagePreview(item)
                        }}
                      >
                        <img
                          src={publicFileUrl(BASE_API, item.url)}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="rounded border object-fit-cover"
                          style={{ objectFit: 'cover' }}
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                      ) : (
                        renderFileIcon(item, 28)
                      )}
                    </td>
                    <td className="text-break fw-medium">{item.name}</td>
                    <td className="text-capitalize">{item.type}</td>
                    <td>{item.type === 'file' ? formatBytes(item.size) : '—'}</td>
                    <td className="small text-muted">{formatDate(item.updatedAt)}</td>
                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                      {fileManagerActionsMenu(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {!loading && view === 'list' && totalShown === 0 && (
            <div className="fm-empty-plate text-center text-muted py-5 px-3 rounded-4">
              {searchDebounced ? 'No items match your search.' : 'This folder is empty.'}
            </div>
          )}

          <div className="fm-pager-footer mt-4 pt-4">
            <p className="fm-pager-footer__stats mb-0">
              Showing{' '}
              <span className="fm-pager-footer__num">{rangeStart.toLocaleString()}</span>
              <span className="fm-pager-footer__dash">–</span>
              <span className="fm-pager-footer__num">{rangeEnd.toLocaleString()}</span>
              <span className="fm-pager-footer__of"> of </span>
              <span className="fm-pager-footer__num">{total.toLocaleString()}</span>
              <span className="fm-pager-footer__tail"> items{searchDebounced ? ' (filtered)' : ''}</span>
            </p>
            <div className="fm-pager-footer__controls d-flex flex-wrap align-items-center gap-2">
              <Form.Label htmlFor="fm-page-size" className="visually-hidden">
                Rows per page
              </Form.Label>
              <Form.Select
                id="fm-page-size"
                size="sm"
                className="fm-pager-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) || 48)}
              >
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
                <option value={96}>96 / page</option>
                <option value={200}>200 / page</option>
              </Form.Select>
              <div className="fm-pager-nav d-inline-flex align-items-stretch gap-1" role="group" aria-label="Pagination">
                <Button
                  type="button"
                  variant="light"
                  className="fm-pager-nav__icon"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(1)}
                  aria-label="First page"
                >
                  <FaAngleDoubleLeft />
                </Button>
                <Button
                  type="button"
                  variant="light"
                  className="fm-pager-nav__icon"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <FaChevronLeft />
                </Button>
                <span className="fm-pager-nav__page d-inline-flex align-items-center px-3">
                  Page {page.toLocaleString()} / {totalPages.toLocaleString()}
                </span>
                <Button
                  type="button"
                  variant="light"
                  className="fm-pager-nav__icon"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <FaChevronRight />
                </Button>
                <Button
                  type="button"
                  variant="light"
                  className="fm-pager-nav__icon"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(totalPages)}
                  aria-label="Last page"
                >
                  <FaAngleDoubleRight />
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Modal
        show={!!previewItem}
        onHide={closeImagePreview}
        centered
        size="xl"
        contentClassName="fm-preview-modal__content border-0 shadow-lg"
        dialogClassName="fm-preview-modal__dialog"
      >
        <Modal.Header closeButton className="fm-preview-modal__header border-0 flex-wrap">
          <div className="d-flex align-items-center gap-3 min-w-0 flex-grow-1">
            <div className="fm-preview-modal__header-icon-wrap d-none d-sm-flex" aria-hidden>
              <FaFileImage className="fm-preview-modal__header-icon" />
            </div>
            <div className="min-w-0 flex-grow-1">
              <p className="fm-preview-modal__eyebrow mb-1">Image preview</p>
              <Modal.Title as="h5" className="fm-preview-modal__title text-truncate mb-0">
                {previewItem?.name}
              </Modal.Title>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="fm-preview-modal__body p-0">
          {previewItem && (
            <>
              <div className="fm-preview-modal__viewer d-flex align-items-stretch gap-2 gap-md-3 px-3 py-3 px-md-4 py-md-4">
                <div className="fm-preview-modal__rail d-flex align-items-center justify-content-center flex-shrink-0">
                  <Button
                    type="button"
                    variant="light"
                    className="fm-preview-modal__nav-btn"
                    onClick={goPreviewPrev}
                    disabled={imageFiles.length <= 1}
                    aria-label="Previous image"
                    title="Previous"
                  >
                    <FaChevronLeft size={18} aria-hidden />
                  </Button>
                </div>
                <div className="fm-preview-modal__stage flex-grow-1 d-flex align-items-center justify-content-center position-relative overflow-hidden rounded-4">
                  <div className="fm-preview-modal__stage-shine" aria-hidden />
                  <img
                    src={publicFileUrl(BASE_API, previewItem.url)}
                    alt={previewItem.name}
                    className="fm-preview-modal__img img-fluid position-relative"
                  />
                </div>
                <div className="fm-preview-modal__rail d-flex align-items-center justify-content-center flex-shrink-0">
                  <Button
                    type="button"
                    variant="light"
                    className="fm-preview-modal__nav-btn"
                    onClick={goPreviewNext}
                    disabled={imageFiles.length <= 1}
                    aria-label="Next image"
                    title="Next"
                  >
                    <FaChevronRight size={18} aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="fm-preview-modal__meta-bar d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 px-md-4 py-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fm-preview-modal__chip">
                    {previewIndex !== null ? previewIndex + 1 : 0} / {imageFiles.length}
                  </span>
                  <span className="fm-preview-modal__meta-muted small">Gallery</span>
                </div>
                <span className="fm-preview-modal__meta-size small font-monospace">
                  {formatBytes(previewItem.size)}
                </span>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
      <Modal show={showFolderModal} onHide={() => setShowFolderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Folder name</Form.Label>
            <Form.Control
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. banners"
              maxLength={120}
            />
            <Form.Text className="text-muted">
              Letters, numbers, spaces, underscores, and hyphens only.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFolderModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void createFolder()} disabled={savingFolder}>
            {savingFolder ? 'Creating…' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>
        {`
          .uploaded-files-manager-page {
            --fm-lux-ink: #0b1220;
            --fm-lux-muted: #64748b;
            --fm-lux-line: rgba(15, 23, 42, 0.09);
            --fm-lux-gold: #b8952e;
            --fm-lux-cream: #faf8f5;
            --fm-lux-card: #ffffff;
            padding-bottom: 2rem;
          }
          .uploaded-files-manager-page .fm-page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 20px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 42%, #334155 100%);
            color: #f8fafc;
            padding: 1.75rem 1.75rem 1.75rem 1.5rem;
            box-shadow:
              0 4px 6px rgba(15, 23, 42, 0.08),
              0 24px 48px rgba(15, 23, 42, 0.18);
          }
          @media (min-width: 992px) {
            .uploaded-files-manager-page .fm-page-hero {
              padding: 2rem 2.25rem;
            }
          }
          .uploaded-files-manager-page .fm-page-hero__accent {
            position: absolute;
            top: -40%;
            right: -8%;
            width: 42%;
            max-width: 320px;
            aspect-ratio: 1;
            border-radius: 50%;
            background: radial-gradient(
              circle at 30% 30%,
              rgba(196, 160, 53, 0.35) 0%,
              rgba(99, 102, 241, 0.12) 45%,
              transparent 70%
            );
            pointer-events: none;
          }
          .uploaded-files-manager-page .fm-page-hero__inner {
            position: relative;
            z-index: 1;
          }
          .uploaded-files-manager-page .fm-page-hero__eyebrow {
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(248, 250, 252, 0.55);
            margin: 0;
          }
          .uploaded-files-manager-page .fm-page-hero__title {
            font-size: clamp(1.35rem, 2.5vw, 1.75rem);
            font-weight: 700;
            letter-spacing: -0.03em;
            color: #fff;
            line-height: 1.2;
          }
          .uploaded-files-manager-page .fm-page-hero__subtitle {
            font-size: 0.9rem;
            line-height: 1.55;
            color: rgba(248, 250, 252, 0.72);
            max-width: 36rem;
          }
          .uploaded-files-manager-page .fm-page-hero__crumbs {
            background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.5rem 0.85rem !important;
            font-size: 0.78rem;
          }
          .uploaded-files-manager-page .fm-page-hero__crumbs .breadcrumb-item,
          .uploaded-files-manager-page .fm-page-hero__crumbs .breadcrumb-item a {
            color: rgba(248, 250, 252, 0.75) !important;
          }
          .uploaded-files-manager-page .fm-page-hero__crumbs .breadcrumb-item.active {
            color: rgba(255, 255, 255, 0.95) !important;
          }
          .uploaded-files-manager-page .fm-page-hero__crumbs .breadcrumb-item + .breadcrumb-item::before {
            color: rgba(248, 250, 252, 0.35);
          }
          .uploaded-files-manager-page .fm-surface-card {
            border-radius: 20px;
            background: var(--fm-lux-card);
            box-shadow:
              0 1px 2px rgba(15, 23, 42, 0.04),
              0 20px 50px rgba(15, 23, 42, 0.06);
          }
          .uploaded-files-manager-page .fm-surface-card__body {
            border-radius: 20px;
          }
          .uploaded-files-manager-page .fm-toolbar {
            background: linear-gradient(180deg, #fafaf9 0%, #f4f4f2 100%);
            border: 1px solid var(--fm-lux-line);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
          }
          .uploaded-files-manager-page .fm-btn-lux {
            font-weight: 600;
            font-size: 0.875rem;
            letter-spacing: 0.01em;
            border-radius: 12px !important;
            border: 1px solid transparent !important;
            padding: 0.55rem 1.15rem;
            transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          }
          .uploaded-files-manager-page .fm-btn-lux:disabled {
            opacity: 0.65;
          }
          .uploaded-files-manager-page .fm-btn-lux-folder {
            background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%) !important;
            color: #f8fafc !important;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.35);
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          .uploaded-files-manager-page .fm-btn-lux-folder:hover {
            color: #fff !important;
            filter: brightness(1.06);
            box-shadow: 0 6px 20px rgba(15, 23, 42, 0.4);
            transform: translateY(-1px);
          }
          .uploaded-files-manager-page .fm-btn-lux-upload {
            background: linear-gradient(135deg, #3730a3 0%, #4f46e5 55%, #6366f1 100%) !important;
            color: #fff !important;
            box-shadow: 0 4px 16px rgba(79, 70, 229, 0.35);
            border-color: rgba(255, 255, 255, 0.12) !important;
          }
          .uploaded-files-manager-page .fm-btn-lux-upload:hover {
            color: #fff !important;
            filter: brightness(1.05);
            box-shadow: 0 6px 22px rgba(79, 70, 229, 0.45);
            transform: translateY(-1px);
          }
          .uploaded-files-manager-page .fm-btn-lux-icon {
            width: 2.65rem;
            height: 2.65rem;
            padding: 0 !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px !important;
            background: #fff !important;
            color: #475569 !important;
            border: 1px solid var(--fm-lux-line) !important;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          }
          .uploaded-files-manager-page .fm-btn-lux-icon:hover:not(:disabled) {
            border-color: rgba(99, 102, 241, 0.35) !important;
            color: #4338ca !important;
          }
          .uploaded-files-manager-page .fm-btn-lux-ghost-sm {
            background: rgba(255, 255, 255, 0.65) !important;
            color: #334155 !important;
            border: 1px solid var(--fm-lux-line) !important;
            border-radius: 10px !important;
            font-weight: 600;
          }
          .uploaded-files-manager-page .fm-btn-lux-ghost-sm:hover {
            background: #fff !important;
            border-color: rgba(99, 102, 241, 0.25) !important;
          }
          .uploaded-files-manager-page .fm-btn-lux__icon {
            opacity: 0.95;
          }
          .uploaded-files-manager-page .fm-upload-hitbox .fm-btn-lux-upload:disabled {
            opacity: 0.75;
          }
          .uploaded-files-manager-page .fm-search-group {
            border-radius: 14px !important;
            overflow: hidden;
            border: 1px solid var(--fm-lux-line) !important;
            background: #fff !important;
            transition: box-shadow 0.2s ease, border-color 0.2s ease;
          }
          .uploaded-files-manager-page .fm-search-group:focus-within {
            border-color: rgba(99, 102, 241, 0.45) !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          }
          .uploaded-files-manager-page .fm-search-group__prefix {
            padding-left: 1rem;
          }
          .uploaded-files-manager-page .fm-search-group__input {
            padding: 0.65rem 1rem 0.65rem 0;
            font-size: 0.9rem;
          }
          .uploaded-files-manager-page .fm-toolbar-switch .form-check-input {
            width: 2.35rem;
            height: 1.2rem;
            cursor: pointer;
            border-color: rgba(15, 23, 42, 0.15);
            background-color: #e2e8f0;
          }
          .uploaded-files-manager-page .fm-toolbar-switch .form-check-input:checked {
            background-color: #4f46e5;
            border-color: #4338ca;
          }
          .uploaded-files-manager-page .fm-toolbar-switch .form-check-label {
            font-size: 0.82rem;
            font-weight: 500;
            color: #475569;
            padding-left: 0.35rem;
          }
          .uploaded-files-manager-page .fm-view-toggle {
            display: inline-flex;
            padding: 4px;
            border-radius: 14px;
            background: #fff;
            border: 1px solid var(--fm-lux-line);
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          }
          .uploaded-files-manager-page .fm-view-toggle__btn {
            border: none !important;
            border-radius: 10px !important;
            padding: 0.45rem 0.75rem !important;
            color: #64748b !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .uploaded-files-manager-page .fm-view-toggle__btn:hover {
            color: #334155 !important;
            background: rgba(15, 23, 42, 0.04) !important;
          }
          .uploaded-files-manager-page .fm-view-toggle__btn.is-active {
            background: linear-gradient(135deg, #1e293b, #334155) !important;
            color: #fff !important;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2) !important;
          }
          .uploaded-files-manager-page .fm-path-strip {
            background: linear-gradient(180deg, #fff 0%, #fafaf9 100%);
            border: 1px solid var(--fm-lux-line);
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          }
          .uploaded-files-manager-page .fm-path-strip__label {
            font-size: 0.65rem;
            letter-spacing: 0.08em;
            color: #94a3b8;
          }
          .uploaded-files-manager-page .fm-path-strip__crumbs {
            background: transparent !important;
            font-size: 0.875rem;
          }
          .uploaded-files-manager-page .fm-path-strip__folder-ico {
            color: #c4a035;
          }
          .uploaded-files-manager-page .fm-path-strip__crumb-link a,
          .uploaded-files-manager-page .fm-path-strip__crumb-link {
            color: #475569 !important;
          }
          .uploaded-files-manager-page .fm-folder-summary {
            padding: 0.65rem 1rem;
            border-radius: 12px;
            background: rgba(248, 250, 252, 0.9);
            border: 1px solid var(--fm-lux-line);
          }
          .uploaded-files-manager-page .fm-empty-plate {
            border: 1px dashed rgba(15, 23, 42, 0.12);
            background: linear-gradient(180deg, #fafaf9, #fff);
          }
          .uploaded-files-manager-page .fm-pager-footer {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 1rem 1.5rem;
            border-top: 1px solid var(--fm-lux-line);
          }
          .uploaded-files-manager-page .fm-pager-footer__stats {
            font-size: 0.82rem;
            color: #64748b;
            letter-spacing: 0.01em;
          }
          .uploaded-files-manager-page .fm-pager-footer__num {
            font-weight: 600;
            color: #0f172a;
            font-variant-numeric: tabular-nums;
          }
          .uploaded-files-manager-page .fm-pager-footer__dash {
            margin: 0 0.15em;
            color: #94a3b8;
          }
          .uploaded-files-manager-page .fm-pager-footer__of,
          .uploaded-files-manager-page .fm-pager-footer__tail {
            color: #94a3b8;
          }
          .uploaded-files-manager-page .fm-pager-select {
            border-radius: 12px !important;
            border: 1px solid var(--fm-lux-line) !important;
            padding: 0.4rem 2.25rem 0.4rem 0.85rem !important;
            font-size: 0.82rem !important;
            font-weight: 500;
            color: #334155 !important;
            background-color: #fff !important;
            min-width: 7.5rem;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          }
          .uploaded-files-manager-page .fm-pager-nav__icon {
            width: 2.4rem;
            height: 2.4rem;
            padding: 0 !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px !important;
            border: 1px solid var(--fm-lux-line) !important;
            background: #fff !important;
            color: #475569 !important;
            font-size: 0.75rem;
          }
          .uploaded-files-manager-page .fm-pager-nav__icon:hover:not(:disabled) {
            border-color: rgba(99, 102, 241, 0.35) !important;
            color: #312e81 !important;
            background: #fafaff !important;
          }
          .uploaded-files-manager-page .fm-pager-nav__icon:disabled {
            opacity: 0.38;
          }
          .uploaded-files-manager-page .fm-pager-nav__page {
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            color: #f8fafc;
            border-radius: 10px;
            background: linear-gradient(135deg, #1e293b, #334155);
            border: 1px solid rgba(255, 255, 255, 0.06);
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
            min-height: 2.4rem;
          }
          .fm-grid {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
          @media (min-width: 576px) {
            .fm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (min-width: 768px) {
            .fm-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          @media (min-width: 1200px) {
            .fm-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          }
          .fm-section-title {
            font-size: 0.95rem;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #0f172a;
          }
          .fm-doc-card {
            background: #fff;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, 0.06);
            box-shadow:
              0 1px 2px rgba(15, 23, 42, 0.04),
              0 8px 24px rgba(15, 23, 42, 0.04);
            transition: box-shadow 0.2s ease, transform 0.2s ease;
            overflow: hidden;
          }
          .fm-doc-card:hover {
            box-shadow:
              0 4px 12px rgba(15, 23, 42, 0.08),
              0 16px 40px rgba(99, 102, 241, 0.07);
            transform: translateY(-2px);
          }
          .fm-doc-card--folder { cursor: pointer; }
          .fm-doc-card--file { cursor: default; }
          .fm-doc-card__header {
            padding: 0.75rem 0.75rem 0 1rem;
          }
          .fm-doc-card__type-pill {
            font-size: 0.65rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #6366f1;
            background: rgba(99, 102, 241, 0.1);
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
          }
          .fm-doc-card__type-pill--folder {
            color: #b45309;
            background: rgba(245, 158, 11, 0.12);
          }
          .fm-doc-card__kebab::after {
            display: none !important;
          }
          .fm-doc-card__icon-wrap {
            min-height: 100px;
          }
          .fm-doc-card__folder-icon {
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.08));
          }
          .fm-doc-card__thumb-btn {
            box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
          }
          .fm-doc-card__file-icon-slot {
            min-height: 88px;
          }
          .fm-doc-card__title {
            font-size: 0.9rem;
            line-height: 1.35;
            color: #0f172a;
          }
          .fm-doc-card__meta {
            font-size: 0.78rem;
          }
          .fm-doc-card__footer {
            border-top: 1px solid rgba(15, 23, 42, 0.06);
            padding: 0.5rem 0.75rem;
            margin-top: 0.5rem;
          }
          /* Image preview modal (portaled to body — standalone selectors) */
          .fm-preview-modal__dialog {
            max-width: min(96vw, 1140px);
          }
          .fm-preview-modal__content.modal-content {
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow:
              0 25px 50px -12px rgba(0, 0, 0, 0.45),
              0 0 0 1px rgba(15, 23, 42, 0.2);
          }
          .fm-preview-modal__header.modal-header {
            background: linear-gradient(125deg, #0f172a 0%, #1e293b 38%, #312e81 120%);
            padding: 1.1rem 1.25rem 1.1rem 1.35rem;
            box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.06);
          }
          .fm-preview-modal__header .btn-close {
            filter: invert(1);
            opacity: 0.72;
            padding: 0.65rem;
            margin: -0.35rem -0.35rem -0.35rem auto;
          }
          .fm-preview-modal__header .btn-close:hover {
            opacity: 1;
          }
          .fm-preview-modal__header-icon-wrap {
            width: 2.75rem;
            height: 2.75rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
          }
          .fm-preview-modal__header-icon {
            font-size: 1.25rem;
            color: #c7d2fe;
          }
          .fm-preview-modal__eyebrow {
            font-size: 0.65rem;
            font-weight: 600;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(226, 232, 240, 0.55);
            margin: 0;
          }
          .fm-preview-modal__title {
            font-size: clamp(1rem, 2.2vw, 1.2rem);
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #f8fafc !important;
          }
          .fm-preview-modal__body {
            background: linear-gradient(180deg, #0b1120 0%, #0f172a 45%, #111827 100%);
          }
          .fm-preview-modal__viewer {
            min-height: 280px;
          }
          .fm-preview-modal__rail {
            width: 3.5rem;
          }
          @media (min-width: 576px) {
            .fm-preview-modal__rail {
              width: 4rem;
            }
          }
          .fm-preview-modal__nav-btn {
            width: 3rem;
            height: 3rem;
            padding: 0 !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            border-radius: 14px !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            background: linear-gradient(
              160deg,
              rgba(255, 255, 255, 0.12) 0%,
              rgba(255, 255, 255, 0.03) 100%
            ) !important;
            color: #e2e8f0 !important;
            box-shadow:
              0 4px 16px rgba(0, 0, 0, 0.35),
              inset 0 1px 0 rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
            transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease,
              background 0.2s ease;
          }
          @media (min-width: 576px) {
            .fm-preview-modal__nav-btn {
              width: 3.35rem;
              height: 3.35rem;
            }
          }
          .fm-preview-modal__nav-btn:hover:not(:disabled) {
            color: #fff !important;
            border-color: rgba(165, 180, 252, 0.45) !important;
            background: linear-gradient(
              160deg,
              rgba(99, 102, 241, 0.45) 0%,
              rgba(79, 70, 229, 0.2) 100%
            ) !important;
            box-shadow:
              0 8px 28px rgba(79, 70, 229, 0.35),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
          }
          .fm-preview-modal__nav-btn:active:not(:disabled) {
            transform: translateY(0);
          }
          .fm-preview-modal__nav-btn:disabled {
            opacity: 0.28;
            cursor: not-allowed;
          }
          .fm-preview-modal__stage {
            min-height: 320px;
            max-height: 70vh;
            background: radial-gradient(ellipse 80% 70% at 50% 40%, rgba(30, 41, 59, 0.95) 0%, #020617 72%);
            border: 1px solid rgba(255, 255, 255, 0.06);
            box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.45);
          }
          .fm-preview-modal__stage-shine {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.04) 0%,
              transparent 42%,
              transparent 58%,
              rgba(99, 102, 241, 0.06) 100%
            );
            pointer-events: none;
          }
          .fm-preview-modal__img {
            max-height: min(70vh, 720px);
            width: auto;
            max-width: 100%;
            object-fit: contain;
            z-index: 1;
            filter: drop-shadow(0 12px 40px rgba(0, 0, 0, 0.5));
          }
          .fm-preview-modal__meta-bar {
            border-top: 1px solid rgba(148, 163, 184, 0.12);
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(8px);
          }
          .fm-preview-modal__chip {
            display: inline-flex;
            align-items: center;
            padding: 0.35rem 0.75rem;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            color: #e0e7ff;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(30, 27, 75, 0.6));
            border: 1px solid rgba(129, 140, 248, 0.25);
            font-variant-numeric: tabular-nums;
          }
          .fm-preview-modal__meta-muted {
            color: rgba(148, 163, 184, 0.85);
            letter-spacing: 0.06em;
            text-transform: uppercase;
            font-weight: 600;
            font-size: 0.65rem;
          }
          .fm-preview-modal__meta-size {
            color: #cbd5e1;
            font-weight: 500;
          }
        `}
      </style>
      </div>
    </>
  )
}

export default UploadedFilesManager
