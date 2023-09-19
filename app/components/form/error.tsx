type Props = { name: string, error?: string | undefined | null, type?: string };

export default ({ name, error, type = "error" }: Props) => {
  return (
    error && <p className="mt-2 text-sm text-red-600" id={`${name}-${type}`}>
      {error}
    </p>
  );
};