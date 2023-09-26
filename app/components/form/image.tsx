import { useRef, useEffect, useState, ReactNode } from "react";
import { useField } from "remix-validated-form";
import ErrorMessage from './error';

type Props = {
  name: string;
  label: string;
  accept?: string;
  Icon?: any;
};

export default function File({ name, label, accept, Icon }: Props) {
  const { error, getInputProps } = useField(name);

  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState<Blob | MediaSource>();
  const [preview, setPreview] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedFile) return setPreview(undefined);

    const objectURL = URL.createObjectURL(selectedFile)
    setPreview(objectURL);

    return () => URL.revokeObjectURL(objectURL);
  }, [selectedFile]);

  const handleSelectFile = (e: any) => {
    if (!e.target.files || e.target.files.length === 0) {
      return setSelectedFile(undefined)
    }
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div className="mb-3">
      <label htmlFor={name} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </label>
      {/* @ts-ignore */}
      <div className="mt-2 flex items-center gap-x-3" onClick={() => { fileRef.current?.click() }}>
        {selectedFile 
          ? <img src={preview} className="h-12 w-12 rounded-lg" />
          : Icon && <Icon className="h-12 w-12 text-indigo-400" aria-hidden="true" />}
        <button type="button"
          className="rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Choose
        </button>
        <input type="file" ref={fileRef} {...getInputProps({ id: name })}
          onChange={handleSelectFile} accept={accept} className="sr-only" />
      </div>
      <ErrorMessage name={name} error={error} />
    </div>
  );
};