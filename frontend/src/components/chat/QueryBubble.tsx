interface Props {
  query: string;
}

export default function QueryBubble({ query }: Props) {
  return (
    <h1
      className="text-xl md:text-2xl font-medium text-text-primary leading-snug"
      style={{ fontFamily: "var(--font-serif)" }}
    >
      {query}
    </h1>
  );
}
