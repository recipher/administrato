import { useIsSubmitting } from "remix-validated-form";
import { useUser } from "~/hooks";

import classnames from "~/helpers/classnames";

type Props = {
  text: string;
  submitting: string;
  permission?: string;
};

export default function Submit ({ text, submitting, permission }: Props) {
  const isSubmitting = useIsSubmitting();
  const user = useUser();

  const disabled = permission === undefined 
    ? isSubmitting
    : isSubmitting || user.permissions.includes(permission) === false;

  return (
    <button type="submit" disabled={disabled}
      className={classnames(disabled ? "bg-gray-200 text-gray-400" : "bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
        "rounded-md  px-3 py-2 text-sm font-semibold shadow-sm"
      )}
      >
      {isSubmitting ? submitting : text}
    </button>
  );
};