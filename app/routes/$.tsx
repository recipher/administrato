import { notFound } from '~/utility/errors';

export const loader = async () => notFound("Page not found");

export default () => null;