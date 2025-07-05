import type { MergeDeep } from "type-fest";
import type { Database as DatabaseGenerated } from "./database.types";
import type { LocationParams } from "./location";
import type { CategoriaQueryParams } from "./servicios";
import type { WorkerStatusQueryParams } from "./worker";

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Functions: {
        get_servicios_with_online_workers: {
          Args: LocationParams;
        };
        get_servicios_with_worker_status: {
          Args: LocationParams & CategoriaQueryParams;
        };
        count_services_by_status_in_radius: {
          Args: LocationParams & CategoriaQueryParams & WorkerStatusQueryParams;
        };
      };
    };
  }
>;
