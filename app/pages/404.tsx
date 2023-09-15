import Error from './error';

type Props = {
  message?: string;
};

export default function NotFound({ message = "Page not found" }: Props) {
  return (
    <Error code={404} message={message} error="Sorry, we couldn’t find what you’re looking for" />
  );
}
