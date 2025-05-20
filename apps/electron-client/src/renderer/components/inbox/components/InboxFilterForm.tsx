import { EmailSearchFilters } from "@/types/emailTypes";

import {
  // queryToSQL,
  queryToShortenedWord,
} from "@utils/getEmailData";

const InboxFilterForm = ({
  name,
  type,
  label,
  placeholder,
  className,
  setSearchQuery,
}: {
  name: keyof EmailSearchFilters;
  type: string;
  label?: string;
  placeholder: string;
  className?: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}) => {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formValues = Object.fromEntries(
      new FormData(form).entries()
    ) as Record<string, string>;
    const searchQuery = formValues[name]?.trim();
    if (!searchQuery) return;

    const part = queryToShortenedWord({ name, searchQuery });
    // const part = queryToSQL({ name, searchQuery });
    if (!part) return;

    // 기존 쿼리가 있으면 한 칸 띄워서, 없으면 그대로
    if (setSearchQuery) {
      setSearchQuery((prev) => (prev ? `${prev} ${part}` : part));
    }

    form.reset(); // 폼 초기화
  }

  return (
    <form
      className="flex justify-between items-center w-full gap-2"
      onSubmit={handleSubmit}
    >
      <label className="font-pre-bold text-xs w-1/4 max-w-1/4 text-text">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className={`w-3/4 h-10 px-2 border-b-2 border-light1 text-sm text-icon ${className}`}
      />
    </form>
  );
};

export default InboxFilterForm;
