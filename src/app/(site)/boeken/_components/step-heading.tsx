export function StepHeading({ title, text }: { title: string; text?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">{title}</h1>
      {text && <p className="mt-2 text-base text-navy-600">{text}</p>}
    </header>
  );
}
