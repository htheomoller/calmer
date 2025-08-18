import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link to="/" className="text-2xl font-semibold tracking-tight hover:opacity-80 transition-opacity">
      calmer.
    </Link>
  );
}