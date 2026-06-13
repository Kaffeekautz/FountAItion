interface DisclaimerBoxProps {
  text: string;
}

export function DisclaimerBox({ text }: DisclaimerBoxProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {text}
    </div>
  );
}

