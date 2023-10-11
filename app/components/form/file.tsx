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
  const [selectedFile, setSelectedFile] = useState<Blob>();
  const [objectURL, setObjectURL] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedFile) return setObjectURL(undefined);

    const url = URL.createObjectURL(selectedFile)
    setObjectURL(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleSelectFile = (e: any) => {
    if (!e.target.files || e.target.files.length === 0) {
      return setSelectedFile(undefined)
    }
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div className="mb-3 mt-1">
      <label htmlFor={name} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </label>
      {/* @ts-ignore */}
      <div className="mt-2 flex items-center gap-x-3" onClick={() => { fileRef.current?.click() }}>
        <button type="button"
          className="rounded-md bg-white px-2.5 py-1.5 mt-2.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Choose
        </button>
        <span className="ml-2 pt-2 text-sm text-gray-800">{selectedFile?.name}</span>
        <input type="file" ref={fileRef} {...getInputProps({ id: name })}
          onChange={handleSelectFile} accept={accept} className="hidden" />
      </div>
      <ErrorMessage name={name} error={error} />
    </div>
  );
};