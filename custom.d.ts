declare module "tracelib" {
    export interface CountersValuesTimestamp {
        times: number[];
        values: number[];
    }
    export interface CountersData {
        [key: string]: CountersValuesTimestamp;
    }
    export interface StatsObject {
        [key: string]: number;
    }
    export class Event {}
    export default class Tracelib {
        public tracelog: object;
        constructor(tracing: object);
        getMainTrackEvents(): Event[];
        getFPS(): CountersValuesTimestamp;
        getSummany(): StatsObject;
        getWarningCounts(): StatsObject;
        getMemoryCounters(): CountersData;
        getDetailsStats(): CountersData;
    }
}
