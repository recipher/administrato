import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';
import arc from '@architect/functions';

import { default as create } from '../id.server';
export { default as create } from '../id.server';

import { TxOrPool, type IdProp, type QueryOptions, Count, ASC, DESC } from '../types';
import { type User } from '../access/users.server';

export type Document = s.documents.Selectable;

type SearchOptions = { 
  entityId: string;
  search?: string | null; 
  folder?: string | null;
  isArchived?: boolean;
};

const Service = (u: User) => {
  const addDocument = async (document: s.documents.Insertable, txOrPool: TxOrPool = pool) => {
    return db.insert('documents', { ...document, createdBy: u }).run(txOrPool);
  };

  const updateDocument = async ({ id, ...update }: s.documents.Updatable, txOrPool: TxOrPool = pool) => {
    return db.update('documents', { ...update, updatedBy: u }, { id: id as string }).run(txOrPool);
  };

  const getDocument = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.selectExactlyOne('documents', { id }).run(txOrPool);
  };

  const archiveDocument = async ({ id }: IdProp, txOrPool: TxOrPool = pool) => {
    return db.update('documents', { isArchived: true, updatedBy: u }, { id }).run(txOrPool);
  };

  const listDocumentsByEntityId = async ({ entityId, isArchived = false }: { entityId: string, isArchived?: boolean }, txOrPool: TxOrPool = pool) => {
    return db.select('documents', { entityId, isArchived }).run(txOrPool);
  };

  const searchQuery = ({ entityId, search, folder, isArchived = false }: SearchOptions) => {
    let query = db.sql<db.SQL>`${{entityId}} AND ${{isArchived}}`;
    if (folder !== null && folder !== "") query = db.sql<db.SQL>`${query} AND LOWER(${'folder'}) = LOWER(${db.param(folder)})`;
    return search == null 
      ? query 
      : db.sql<db.SQL>`${query} AND LOWER(${'documents'}.${'identifier'}) LIKE LOWER(${db.param(`${search}%`)})`;
  };

  const countDocumentsForEntityId = async (search: SearchOptions) => {
    const [ item ] = await db.sql<s.documents.SQL, s.documents.Selectable[]>`
      SELECT COUNT(${'documents'}.${'id'}) AS count FROM ${'documents'}
      WHERE ${searchQuery(search)}
    `.run(pool);

    const { count } = item as unknown as Count;
    return count;
  };

  const searchDocumentsForEntityId = async (search: SearchOptions, { offset = 0, limit = 8, sortDirection = ASC }: QueryOptions, txOrPool: TxOrPool = pool) => {
    if (sortDirection == null || (sortDirection !== ASC && sortDirection !== DESC)) sortDirection = ASC;

    const documents = await db.sql<s.documents.SQL , s.documents.Selectable[]>`
      SELECT ${'documents'}.* FROM ${'documents'}
      WHERE ${searchQuery(search)}
      ORDER BY ${'documents'}.${'identifier'} ${db.raw(sortDirection)}
      OFFSET ${db.param(offset)}
      LIMIT ${db.param(limit)}
      `.run(pool);
    const count = await countDocumentsForEntityId(search);

    return { documents, metadata: { count }};
  };

  const listFoldersByEntityId = async ({ entityId }: { entityId: string }, txOrPool: TxOrPool = pool) => {
    const folders = await db.select('documents', { entityId }, { columns: [ "folder" ]})
      .run(txOrPool);
      
    return folders
      .map(({ folder }) => folder?.toLowerCase())
      .reduce((folders: Array<string | undefined>, folder) =>
        folders.includes(folder as string) || !folder ? folders : [ ...folders, folder ]
      , []);
  };

  const getDocumentByIdentifierForEntityId = ({ identifier, entityId, isArchived = false }: { identifier: string, entityId: string, isArchived?: boolean }, txOrPool: TxOrPool = pool) => {
    return db.selectOne('documents', 
      db.sql<s.documents.SQL>`${{ entityId }} AND ${{ isArchived }} AND LOWER(${'identifier'}) = ${db.param(identifier.toLowerCase())}`
    ).run(txOrPool);
  };

  const recordAuditRecord = ({ documentId, action }: { documentId: string, action: string }, txOrPool: TxOrPool = pool) => {
    return db.insert('documentAudits', create({ documentId, user: u, action })).run(txOrPool);
  };

  const recordDownload = ({ documentId }: { documentId: string }, txOrPool: TxOrPool = pool) =>
    recordAuditRecord({ documentId, action: 'download' }, txOrPool);

  const triggerDownloadAudit = ({ documentId }: { documentId: string }) => 
    arc.queues.publish({ name: 'document-downloaded', payload: { documentId, meta: { user : u }}});
  
    return {
    addDocument,
    updateDocument,
    archiveDocument,
    getDocument,
    getDocumentByIdentifierForEntityId,
    listFoldersByEntityId,
    listDocumentsByEntityId,
    searchDocumentsForEntityId,
    recordAuditRecord,
    recordDownload,
    triggerDownloadAudit,
  };
};

export default Service;
