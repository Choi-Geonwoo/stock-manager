import { useEffect, useRef, useState } from "react";

export function useImageUpload({ setFile, setPreview, fileName = "", open = true }) {
  const [selectedFileName, setSelectedFileName] = useState(fileName || "");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSelectedFileName(fileName || "");
  }, [fileName, open]);

  const selectFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    setSelectedFileName(file.name);
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const dragHandlers = {
    onDragEnter: (event) => {
      event.preventDefault();
      setIsDragging(true);
    },
    onDragOver: (event) => event.preventDefault(),
    onDragLeave: () => setIsDragging(false),
    onDrop: (event) => {
      event.preventDefault();
      setIsDragging(false);
      selectFile(event.dataTransfer.files?.[0]);
    },
  };

  return {
    fileInputRef,
    selectedFileName,
    isDragging,
    selectFile,
    dragHandlers,
  };
}