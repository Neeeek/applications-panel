import { useEffect, useState } from "react";
import { fetchApplications } from "../api/applicationsAdapter";
import type { LoadMode } from "../types";
import type { RequestState } from "../App.types";

export function useApplications(loadMode: LoadMode): RequestState {
  const [requestState, setRequestState] = useState<RequestState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setRequestState({ status: "loading" });
    fetchApplications(loadMode)
      .then((data) => {
        if (!cancelled) setRequestState({ status: "success", data });
      })
      .catch((error: Error) => {
        if (!cancelled) setRequestState({ status: "error", message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [loadMode]);

  return requestState;
}
