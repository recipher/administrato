import { Link } from "@remix-run/react";
import { useIsSubmitting } from "remix-validated-form";

type Props = {
  text?: string;
  to?: string;
};

export default function Button ({ text = "Cancel", to = ".." }: Props) {
  const isSubmitting = useIsSubmitting();

  return (
    <Link to={to}>
      <button type="button" className="text-sm leading-6 text-gray-900">
        {text}
      </button>
    </Link>
  );
};
