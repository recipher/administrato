import { useEffect, useRef, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { Spinner, Image } from '~/components';

import classnames from '~/helpers/classnames';

type Props = { 
  image: string | null;
  name: string;
  Icon: any;
  intent: string; 
  action?: string;
};

export default ({ image, name, Icon, intent, action = "." }: Props) => {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const fileRef = useRef(null);
  const [_, setSelectedFile] = useState<Blob>();
  const [preview, setPreview] = useState<string | null>(image);
  
  useEffect(() => {
    if (fetcher.data?.[name]) {
      setPreview(fetcher.data[name]);
      setSelectedFile(undefined);
    }
  }, [fetcher.data]);

  const handleSelectFile = (e: any) => {
    if (!e.target.files || e.target.files.length === 0) {
      return setSelectedFile(undefined)
    }
    setSelectedFile(e.target.files[0]);
    fetcher.submit(e.currentTarget.form);
  };

  return (
    <>
      {/* @ts-ignore */}
      <div className="group relative cursor-pointer" onClick={() => { fileRef.current?.click() }}>
        <span className={classnames(fetcher.state === "submitting" ? "" : "hidden",
          "absolute group-hover:inline text-xs text-gray-900 left-3 top-4")}>
          {fetcher.state === "submitting" ? <Spinner /> : t('edit')}
        </span>
        {!preview
          ? <Icon className={classnames(fetcher.state === "submitting" ? "opacity-50" : "",
            "h-12 w-12 text-indigo-300 hover:opacity-50")} aria-hidden="true" />
          : <Image src={preview} className={classnames(fetcher.state === "submitting" ? "opacity-50" : "",
              "h-12 w-12 rounded-full hover:opacity-50")} />}
        <fetcher.Form encType="multipart/form-data" method="POST" action={action}>  
          <input type="hidden" name="intent" value={intent} />   
          <input type="file" ref={fileRef} name={name}
            onChange={handleSelectFile} accept="image/*" className="hidden" />
        </fetcher.Form>
      </div>
    </>
  );
};
