import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link to="/landing-problem" className="inline-block">
      <h1 className="text-2xl font-bold hover:text-muted-foreground transition-colors">
        calmer.
      </h1>
    </Link>
  );
}