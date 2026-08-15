import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-14 border-b border-border bg-bg/90 backdrop-blur">
      <Link to="/" className="flex items-center gap-2 text-text-primary">
        <img
          src="/perplexed-logo.png"
          alt="Perplexed"
          className="w-7 h-7 object-contain"
        />
        <span className="font-semibold text-sm tracking-tight">Perplexed</span>
      </Link>
    </header>
  );
}
