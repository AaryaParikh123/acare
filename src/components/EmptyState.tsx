interface Props {
  text?: string;
}

export default function EmptyState({ text = 'No records found.' }: Props) {
  return (
    <div className="text-center py-12 text-gray-400">
      <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-3-3v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm">{text}</p>
    </div>
  );
}
