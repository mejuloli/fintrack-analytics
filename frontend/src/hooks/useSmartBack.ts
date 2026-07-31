import { useCallback } from "react";
import { useNavigate } from "react-router-dom";


interface BrowserHistoryState {
  idx?: number;
}


export function useSmartBack(
  fallbackPath: string,
) {
  const navigate = useNavigate();

  return useCallback(() => {
    const historyState:
      BrowserHistoryState | null =
        window.history.state;

    const canGoBack =
      typeof historyState?.idx === "number"
      && historyState.idx > 0;

    if (canGoBack) {
      navigate(-1);
      return;
    }

    navigate(
      fallbackPath,
      {
        replace: true,
      },
    );
  }, [
    fallbackPath,
    navigate,
  ]);
}
