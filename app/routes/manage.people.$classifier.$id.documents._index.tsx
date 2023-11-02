import { useRef } from 'react';
import { ActionArgs, json, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { notFound, badRequest } from '~/utility/errors';

import PersonService from '~/services/manage/people.server';
import DocumentService, { type Document } from '~/services/manage/documents.server';

import { requireUser } from '~/auth/auth.server';

import { setFlashMessage, storage } from '~/utility/flash.server';
import { Filter } from '~/components/header/advanced';
import Alert, { Level } from '~/components/alert';
import Tabs from '~/components/tabs';
import Pagination from '~/components/pagination';
import { Layout, Heading } from '~/components/info/info';
import { List, ListItem } from '~/components/list';

import { manage } from '~/auth/permissions';

import toNumber from '~/helpers/to-number';
import { Image } from '~/components';

const LIMIT = 10;

const Icons = new Map<string, string>([
  [ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'excel' ],
  [ 'application/vnd.ms-excel', 'excel' ],
  [ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'word' ],
  [ 'application/msword', 'word' ],
  [ 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'powerpoint' ],
  [ 'application/vnd.ms-powerpoint', 'powerpoint' ],
  [ 'application/pdf', 'pdf' ],
]);

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

  if (intent === 'audit-document-download') 
    await service.triggerDownloadAudit({ documentId: id });

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
  const { t } = useTranslation();
  const submit = useSubmit();

  const { person, documents, folders, folder, count, offset, limit, search, sort } = useLoaderData();

  const tabs: Array<{ name: string, icon: any; value: string, selectable?: boolean }> = 
    folders.map((folder: string) => ({ name: folder, value: folder }));

  tabs.unshift({ name: 'all', icon: XMarkIcon, value: '', selectable: false });

  const getIcon = (contentType: string) => Icons.get(contentType);

  const navigate = useNavigate();
  const [ searchParams ] = useSearchParams();

  const handleClick = (folder: string ) => {
    searchParams.set("folder", folder);
    navigate(`?${searchParams.toString()}`);
  };

  const actions = [
    { name: "remove", confirm: () => 'Archive this document', 
      permission: manage.edit.person,
      onClick: (document: Document) => {
        submit({ intent: "archive-document", 
                 document: { id: document.id, identifier: document.identifier } },
               { method: "post", encType: "application/json" });
      },
    },
    { name: "download", permission: manage.read.person,
      className: "text-indigo-500 hover:text-indigo-400",
      href: (document: Document) => `/document/${document.id}`,
      download: (document: Document) => document.identifier,
      onClick: (document: Document) => {
        submit({ intent: "audit-document-download", document: { id: document.id }}, 
               { method: "post", encType: "application/json" });
        return true;
      },
    },
  ];

  const Item = (document: Document) => 
    <ListItem data={document.identifier} image={<Image src={`/_static/icons/${getIcon(document.contentType)}.png`} className="h-6 w-6" />} className="font-medium" />;

  return (
    <Layout>
      <Heading heading={t('documents')} explanation={`Manage ${person.firstName}'s documents.`} />
      {folders.length > 0 && <Tabs tabs={tabs} selected={folder} onClick={handleClick} />}

      <Filter className="pt-6" filterTitle='Search documents' filterParam='q' allowSort={true} sort={sort} filter={search} />

      {count <= 0 && <Alert title={`No documents found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}
      <List data={documents} renderItem={Item} actions={actions} />

      <Pagination entity='document' totalItems={count} offset={offset} limit={limit} />
    </Layout>
  );
};

export default Documents;
