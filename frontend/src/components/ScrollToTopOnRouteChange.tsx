import {
  useLayoutEffect,
  useRef,
} from "react";
import {
  useLocation,
  useNavigationType,
} from "react-router-dom";


export function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  const navigationType =
    useNavigationType();

  const previousPathname = useRef(
    pathname,
  );


  useLayoutEffect(() => {
    const previousPath =
      previousPathname.current;

    previousPathname.current = pathname;

    const pathChanged =
      previousPath !== pathname;

    if (
      !pathChanged
      || navigationType === "POP"
    ) {
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [
    navigationType,
    pathname,
  ]);


  return null;
}
