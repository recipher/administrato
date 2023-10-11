import { useRef, useState } from 'react';
import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { notFound, badRequest } from '~/utility/errors';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import DocumentService, { type Document } from '~/services/manage/documents.server';

import { requireUser } from '~/auth/auth.server';
import { useUser } from '~/hooks';

import { setFlashMessage, storage } from '~/utility/flash.server';

import { Breadcrumb, type BreadcrumbProps } from "~/layout/breadcrumbs";
import { Filter } from '~/components/header/advanced';
import Alert, { Level } from '~/components/alert';
import Tabs from '~/components/tabs';
import Pagination from '~/components/pagination';
import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";
import { Layout, Heading } from '~/components/info/info';

import { manage } from '~/auth/permissions';

import toNumber from '~/helpers/to-number';

const LIMIT = 10;

export const handle = {
  name: "documents",
  breadcrumb: ({ person, classifier, current, name }: { person: Person, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${person?.id}/documents`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const limit = toNumber(url.searchParams.get("limit") as string) || LIMIT;
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");
  const folder = url.searchParams.get("folder");

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });

  if (person === undefined) return notFound('Person not found');

  const documentService = DocumentService(u);
  const { documents, metadata: { count } } = await documentService.searchDocumentsForEntityId({ entityId: id, search, folder }, { offset, limit, sortDirection: sort });
  const folders = await documentService.listFoldersByEntityId({ entityId: id });
  
  return json({ person, classifier, documents, folders, folder, count, offset, limit, search, sort });
};

export async function action({ request }: ActionArgs) {
  const u = await requireUser(request);

  let message = "", level = Level.Success;
  const { intent, document: { id, identifier } } = await request.json();

  const service = DocumentService(u);

  if (intent === 'archive-document') {
    try {
      await service.archiveDocument({ id });
      message = `Document Archived:Document ${identifier} has been archived.`;
    } catch(e: any) {
      message = `Document Archive Error:${e.message}.`;
      level = Level.Error;
    };
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(".", { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

const Documents = () => {
  const u = useUser();
  const { t } = useTranslation();
  const submit = useSubmit();
  const [ document, setDocument ] = useState<Document>();
  const confirm = useRef<RefConfirmModal>(null);

  const { person, documents, folders, folder, count, offset, limit, search, sort } = useLoaderData();
  const name = `${person.firstName} ${person.lastName}`;

  const tabs: Array<{ name: string, icon: any; value: string, selectable?: boolean }> = 
    folders.map((folder: string) => ({ name: folder, value: folder }));

  tabs.unshift({ name: 'all', icon: XMarkIcon, value: '', selectable: false });

  const hasPermission = (p: string) => u.permissions.includes(p);

  const handleArchive = (document: Document) => {
    setDocument(document);
    confirm.current?.show(
      "Archive Document?", 
      "Yes, Archive", "Cancel", 
      `Are you sure you want to archive this document?`);
  };

  const onConfirmArchive = () => {
    if (document === undefined) return;
    submit({ intent: "archive-document", 
      document: { id: document.id, identifier: document.identifier } },
      { method: "post", encType: "application/json" });
  };

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const handleClick = (folder: string ) => {
    searchParams.set("folder", folder);
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <Layout>
      <Heading heading={t('documents')} explanation={`Manage ${name}'s documents.`} />
      {folders.length > 0 && <Tabs tabs={tabs} selected={folder} onClick={handleClick} />}

      <Filter className="pt-6" filterTitle='Search documents' filterParam='q' allowSort={true} sort={sort} filter={search} />

      {count <= 0 && <Alert title={`No documents found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <ul role="list" className="mt-6 divide-y divide-gray-100 border-t border-gray-200 text-md leading-6">
        {documents.map((document: Document) => (
          <li key={document.id} className="group flex justify-between gap-x-6 py-4 cursor-pointer">
            <div>
              {/* <a href={document.document} target="_blank" download={document.identifier} className="font-medium text-md text-gray-900 pr-3">
                {document.identifier}
              </a> */}
              <a href={`/document/${document.id}`} download={document.identifier} className="font-medium text-md text-gray-900 pr-3">
                {document.identifier}
              </a>
            </div>
            {hasPermission(manage.edit.worker) && <div className="hidden group-hover:block">
              <button onClick={() => handleArchive(document)}
                type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                {t('archive')}
              </button>
            </div>}
          </li>
        ))}
      </ul>

      <Pagination entity='document' totalItems={count} offset={offset} limit={limit} />
      <ConfirmModal ref={confirm} onYes={onConfirmArchive} />
    </Layout>
  );
};

export default Documents;
