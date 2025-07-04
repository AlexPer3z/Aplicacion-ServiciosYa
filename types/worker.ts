import type { Enums } from "./database.types";

export type WorkerStatus = Enums<"worker_status">;

export type WorkerStatusLabels = {
  [P in WorkerStatus]: string;
};

export type WorkerStatusQueryParams = {
  worker_status_filter: WorkerStatus[] | null;
};
