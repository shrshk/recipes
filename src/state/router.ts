import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "picks" }
  | { name: "recipe"; id: string }
  | { name: "cook"; id: string }
  | { name: "done"; id: string }
  | { name: "settings" };

export function parseRoute(hash: string): Route {
  const [name, arg] = hash.replace(/^#\/?/, "").split("/");
  switch (name) {
    case "picks": return { name: "picks" };
    case "recipe": return arg ? { name: "recipe", id: arg } : { name: "picks" };
    case "cook": return arg ? { name: "cook", id: arg } : { name: "picks" };
    case "done": return arg ? { name: "done", id: arg } : { name: "picks" };
    case "settings": return { name: "settings" };
    default: return { name: "home" };
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case "home": return "#/";
    case "picks": case "settings": return `#/${route.name}`;
    default: return `#/${route.name}/${route.id}`;
  }
}

export function go(route: Route, replace = false): void {
  if (replace) history.replaceState(null, "", href(route));
  else history.pushState(null, "", href(route));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, []);
  return route;
}
