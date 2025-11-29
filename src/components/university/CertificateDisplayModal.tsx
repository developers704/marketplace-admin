import React, { useRef, useState } from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'

interface CertificateDisplayModalProps {
    show: boolean
    onHide: () => void
    certificateData: {
        userName: string
        userSignaturePath: string
        presidentSignaturePath: string
        certificateId?: string
        course: {
            name: string
        }
    } | null
    baseApiUrl: string
}

const CertificateDisplayModal: React.FC<CertificateDisplayModalProps> = ({
    show,
    onHide,
    certificateData,
    baseApiUrl
}) => {
    const [usernamePosition, setUsernamePosition] = useState('300px')
    const [downloading, setDownloading] = useState(false)
    const [imageError, setImageError] = useState<{ [key: string]: boolean }>({})
    const certificateRef = useRef<HTMLDivElement>(null)

    if (!certificateData) return null

    const downloadPDF = async () => {
        setDownloading(true)
        setUsernamePosition('270px')

        try {
            if (certificateRef.current) {
                // Dynamically import html2pdf
                // @ts-ignore
                const html2pdf = (await import('html2pdf.js')).default

                const opt = {
                    margin: 0,
                    filename: `certificate-${certificateData?.certificateId || 'download'}.pdf`,
                    image: { type: 'jpeg', quality: 1 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                    },
                    jsPDF: {
                        unit: 'px',
                        format: [1122, 793],
                        orientation: 'landscape',
                    },
                }

                await html2pdf()
                    .set(opt)
                    .from(certificateRef?.current)
                    .save()
            }
        } catch (error) {
            console.error('Error downloading PDF:', error)
        } finally {
            setUsernamePosition('300px')
            setDownloading(false)
        }
    }

    const handleImageError = (imageType: string) => {
        setImageError(prev => ({ ...prev, [imageType]: true }))
    }

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-award me-2"></i>
                    Certificate Preview
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-0">
                <div className="bg-white">
                    <div
                        ref={certificateRef}
                        style={{
                            width: '100%',
                            maxWidth: '1122px',
                            height: 'auto',
                            aspectRatio: '1122/793',
                            position: 'relative',
                            backgroundImage: 'url(/Certificate.jpg)',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            margin: '0 auto'
                        }}
                    >
                        {/* Name Position */}
                        <div
                            style={{
                                position: 'absolute',
                                top: usernamePosition,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: 'clamp(30px, 6.7vw, 75px)',
                                letterSpacing: '8px',
                                fontWeight: 'bold',
                                color: '#A8772B',
                                textTransform: 'capitalize',
                                textAlign: 'center',
                                width: '80%'
                            }}
                        >
                            {certificateData.userName}
                        </div>

                        {/* Student Signature Position */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '200px',
                                right: '200px',
                                textAlign: 'center',
                            }}
                        >
                            {certificateData?.userSignaturePath && !imageError?.userSignature ? (
                                <img
                                    src={`${baseApiUrl}/${certificateData?.userSignaturePath}`}
                                    alt="Student Signature"
                                    style={{
                                        height: '80px',
                                        maxWidth: '200px',
                                        objectFit: 'contain'
                                    }}
                                    onError={() => handleImageError('userSignature')}
                                />
                            ) : (
                                <div style={{
                                    height: '80px',
                                    width: '200px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px dashed #ccc',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    Student Signature
                                </div>
                            )}
                        </div>

                        {/* President Signature Position */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '200px',
                                left: '200px',
                                textAlign: 'center',
                            }}
                        >
                            {certificateData?.presidentSignaturePath && !imageError?.presidentSignature ? (
                                <img
                                    src={`${baseApiUrl}/${certificateData?.presidentSignaturePath}`}
                                    alt="President Signature"
                                    style={{
                                        height: '80px',
                                        maxWidth: '200px',
                                        objectFit: 'contain'
                                    }}
                                    onError={() => handleImageError('presidentSignature')}
                                />
                            ) : (
                                <div style={{
                                    height: '80px',
                                    width: '200px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px dashed #ccc',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    President Signature
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                <Button
                    variant="success"
                    onClick={downloadPDF}
                    disabled={downloading}
                    className="d-flex align-items-center"
                >
                    {downloading ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Downloading...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-download me-2"></i>
                            Download PDF
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default CertificateDisplayModal
