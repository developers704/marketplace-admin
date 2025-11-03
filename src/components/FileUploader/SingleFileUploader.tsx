// Remove or comment out
// import { Card } from 'react-bootstrap'
import { useState, forwardRef, useImperativeHandle } from 'react'

import Dropzone from 'react-dropzone'

interface FileType extends File {
	preview?: string
}

interface SingleFileUploaderProps {
	onFileUpload?: (file: FileType) => void
	icon?: string
	text?: string
	accept?: string
}

const SingleFileUploader = forwardRef(({
	onFileUpload,
	icon = 'ri-upload-cloud-2-line',
	text = 'Drop files here or click to upload.',
	accept
}: SingleFileUploaderProps, ref: any) => {
	const [file, setFile] = useState<FileType | null>(null) // Store single file
	useImperativeHandle(ref, () => ({
        resetFileInput: () => {
            setFile(null)
        }
    }))
	const handleAcceptedFile = (acceptedFiles: FileType[]) => {
		const uploadedFile = acceptedFiles[0] // Only one file
		uploadedFile.preview = URL.createObjectURL(uploadedFile)
		setFile(uploadedFile)
		if (onFileUpload) {
			onFileUpload(uploadedFile)
		}
	}

	const removeFile = () => {
		setFile(null) // Clear file when removed
	}

	return (
		<Dropzone
			onDrop={(acceptedFiles) => handleAcceptedFile(acceptedFiles)}
			multiple={false} // Allow only one file
			accept={accept ? { [accept.split('/')[1]]: [accept] } : undefined}
		>
			{({ getRootProps, getInputProps }) => (
				<div className="dropzone" {...getRootProps()}>
					<input {...getInputProps()} />
					{/* If file is uploaded, show image preview, otherwise show upload UI */}
					{file ? (
						<div className="uploaded-image-container">
							<img
								src={file.preview}
								alt="Uploaded"
								className="uploaded-image-preview"
							/>
							<button className="remove-image-btn" onClick={removeFile}>
								&times; {/* Cross sign */}
							</button>
						</div>
					) : (
						<div className="dz-message needsclick">
							<i className={`text-muted h1 ${icon}`} />
							<h3>{text}</h3>
						</div>
					)}
				</div>
			)}
		</Dropzone>
	)
})

export { SingleFileUploader }
