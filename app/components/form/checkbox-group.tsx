import { useField } from "remix-validated-form";

import classnames from '~/helpers/classnames';

type Item = {
  value: number | string;
  label: string;
  explanation?: string | undefined;
  checked: boolean;
}
type Props = {
  name: string;
  items: Array<Item>;
  onChange?: Function;
};

export default function CheckboxGroup({ name, items, onChange }: Props) {
  const { error, getInputProps } = useField(name);

  return (
    <fieldset>
      <div className="space-y-3">
        {items.map((item: Item, index) =>
          <div key={index} className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                aria-describedby={`${name}-description`}
                id={`${name}[${item.value}]`}
                name={`${name}[${item.value}]`}
                defaultChecked={item.checked}  
                onChange={() => onChange && onChange(item)}
                type="checkbox"
                className={classnames(
                  error ? "border-red-900 text-red-600 focus:ring-red-600" : "border-gray-300 text-indigo-600",
                  "h-4 w-4 rounded focus:ring-indigo-600")}
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor={`${name}[${item.value}]`} 
                className={classnames(error ? "text-red-600" : "text-gray-900", "font-medium")}>
                {item.label}
              </label>{' '}
              <span id="comments-description" className="text-gray-500">
                <span className="sr-only">{item.label} </span>{item.explanation}
              </span>
            </div>
          </div>
        )}
      </div>
    </fieldset>
  );
}
