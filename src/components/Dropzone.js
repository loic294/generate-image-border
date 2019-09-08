import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

function MyDropzone(props) {
  const onDrop = useCallback(async acceptedFiles => {
		await acceptedFiles.forEach(async file => await new FileReader().readAsBinaryString(file))
		
		props.onDrop(acceptedFiles)
	}, [props])
	
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div className="dropzone" {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drag 'n' drop some files here, or click to select files</p>
    </div>
  )
}

export default MyDropzone