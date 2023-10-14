import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory();

export default (entity?: any) => ({ id: ulid(), ...entity });