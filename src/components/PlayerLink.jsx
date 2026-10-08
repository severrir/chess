/**
 * A link to a player, not a button with a click handler.
 *
 * Views are already addressed by hash, so a real anchor gets keyboard
 * support, middle-click and a shareable URL for free — and it can be sized
 * to a proper touch target without nesting one control inside another.
 */
export default function PlayerLink({ id, children, className = "", sub }) {
  return (
    <a
      href={`#/player/${id}`}
      className={`flex min-h-11 flex-col justify-center no-underline ${className}`}
    >
      <span className="block truncate text-ivory">{children}</span>
      {sub && <span className="block text-meta text-ivory-3">{sub}</span>}
    </a>
  );
}
