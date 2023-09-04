import { useIsSubmitting } from "remix-validated-form";

type Props = {
  text: string;
  submitting: string;
};

export default function Button ({ text, submitting }: Props) {
  const isSubmitting = useIsSubmitting();

  return (
    <button type="submit" disabled={isSubmitting}
      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
      {isSubmitting ? submitting : text}
    </button>
  );
};