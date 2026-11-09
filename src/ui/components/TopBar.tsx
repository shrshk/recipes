import type { ReactNode } from "react";
import { go, type Route } from "../../state/router";

export function TopBar({ back, children }: { back?: Route; children?: ReactNode }) {
  return (
    <header className="topbar">
      {back ? (
        <button className="icon-btn" aria-label="Back" onClick={() => (history.length > 1 ? history.back() : go(back))}>
          ←
        </button>
      ) : (
        <a className="brand" href="#/" style={{ color: "inherit", textDecoration: "none" }}>🧑‍🍳 Highchair Chef</a>
      )}
      <div className="spacer" />
      {children}
    </header>
  );
}
