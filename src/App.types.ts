import type { ApplicationsPayload } from "./api/applicationsAdapter";

export type RequestState =
  | { status: "loading" }
  | { status: "success"; data: ApplicationsPayload }
  | { status: "error"; message: string };
