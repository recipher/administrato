const error = (message: string, status: number) => {
  throw new Response(null, { status, statusText: message });
};

export const notFound = (message: string = 'Not found') => error(message, 404);
export const badRequest = (message: string = 'Bad request') => error(message, 400);