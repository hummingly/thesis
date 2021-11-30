import {
    test as base,
    CDPSession,
    TestInfo,
    PlaywrightTestArgs,
    PlaywrightTestOptions,
    PlaywrightWorkerOptions,
    PlaywrightWorkerArgs,
} from "@playwright/test";
import fs from "fs";
import { spawn } from "child_process";
import TraceLib, { CountersValuesTimestamp } from "tracelib";

export const TRACE_PATH = "trace.json";
export const PERF_USAGE_PATH = "usage.json";

export type TestFixture = {
    tracer: Tracer;
};

export class Tracer {
    private client: CDPSession;
    private isRunning = false;
    private cpuUsage: number[] = [];
    private gpuMemoryMB: number = 0;
    private gpuUsage: number = 0;
    private _callbacks: Promise<any> | undefined = undefined;

    constructor(client: CDPSession) {
        this.client = client;
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        await this.client.send("HeapProfiler.collectGarbage", {});
        await this.client.send("Tracing.start", {
            categories:
                "-*,devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,v8.execute,disabled-by-default-v8.compile,blink.console,blink.user_timing,loading,latencyInfo,disabled-by-default-v8.cpu_profiler,disabled-by-default-devtools.timeline.stack,disabled-by-default-devtools.screenshot",
            options: "",
            transferMode: "ReportEvents",
        });

        const gpuUsage = spawn("powershell.exe", [
            '$GpuUseTotal = (((Get-Counter "\\GPU Engine(*engtype_3D)\\Utilization Percentage").CounterSamples | where CookedValue).CookedValue | measure -sum).sum\nWrite-Output "$($GpuUseTotal)"',
        ]);
        const gpuMemory = spawn("powershell.exe", [
            '$GpuMemTotal = (((Get-Counter "\\GPU Process Memory(*)\\Local Usage").CounterSamples | where CookedValue).CookedValue | measure -sum).sum\nWrite-Output "$($GpuMemTotal/1MB)"',
        ]);
        const cpuUsage = spawn("powershell.exe", [
            '((Get-Counter -Counter "\\Prozessor(_total)\\Prozessorzeit (%)" -MaxSamples 10).CounterSamples | where CookedValue).CookedValue',
        ]);

        this._callbacks = Promise.all([
            new Promise((resolve) => {
                gpuUsage.stdout.on("data", (chunk) => {
                    this.gpuUsage = Number.parseFloat(chunk.toString().trim().replace(",", "."));
                    resolve(undefined);
                });
            }),
            new Promise((resolve) => {
                gpuMemory.stdout.on("data", (chunk) => {
                    this.gpuMemoryMB = Number.parseFloat(chunk.toString().trim().replace(",", "."));
                });
                resolve(undefined);
            }),
            new Promise((resolve) => {
                cpuUsage.stdout.on("data", (chunk) => {
                    const data = chunk.toString().split("\n") as string[];
                    for (const c of data) {
                        const value = Number.parseFloat(c.trim().replace(",", "."));
                        if (!isNaN(value)) {
                            this.cpuUsage.push(value);
                        }
                    }
                    resolve(undefined);
                });
            }),
        ]);
    }

    async end(tracePath: string, resourcePath: string): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        const client = this.client;
        await client.send("Tracing.end", {});
        await new Promise((resolve) => {
            const output: any[] = [];
            client.on("Tracing.dataCollected", (payload) => output.push(...payload.value));
            client.on("Tracing.tracingComplete", () => resolve(writeJSON(tracePath, output)));
        });
        await this._callbacks;
        const resources: ResourceStats = {
            cpuUsage: computeMean(this.cpuUsage),
            gpuMemoryMB: this.gpuMemoryMB,
            gpuUsage: this.gpuUsage,
        };
        await writeJSON(resourcePath, resources);
        this.isRunning = false;
    }
}

const MAX_ITERATION = 5;

export const PORT = 5000;

export const trace = base.extend<TestFixture>({
    tracer: (async (
        { page }: PlaywrightTestArgs & PlaywrightWorkerOptions,
        use: any,
        testInfo: TestInfo
    ) => {
        const tracer = new Tracer(await page.context().newCDPSession(page));
        await use(tracer);
        await tracer.end(testInfo.outputPath(TRACE_PATH), testInfo.outputPath(PERF_USAGE_PATH));
    }) as any,
});

const MB_IN_BYTES = 1000000;

export const perf = (
    title: string,
    bench: (
        args: PlaywrightTestArgs &
            PlaywrightTestOptions &
            TestFixture &
            PlaywrightWorkerArgs &
            PlaywrightWorkerOptions,
        testInfo: TestInfo
    ) => void | Promise<any>
) => {
    trace.describe(title, () => {
        trace.use({ viewport: { width: 1280, height: 720 } });
        trace.skip(({ browserName }) => browserName !== "chromium");
        trace.slow();

        const traces: string[] = [];
        const usages: string[] = [];
        trace.afterEach(({}, testInfo) => {
            traces.push(testInfo.outputPath(TRACE_PATH));
            usages.push(testInfo.outputPath(PERF_USAGE_PATH));
        });

        trace.afterAll(async ({}, testInfo) => {
            const [traceStats, usageStats] = (await Promise.all([
                Promise.all(traces.map((t) => readJSON(t))),
                Promise.all(usages.map((u) => readJSON(u))),
            ])) as [any[], ResourceStats[]];
            const results: TraceStats[] = [];
            for (const stat of traceStats) {
                const trace = new TraceLib(stat);
                const memory = trace.getMemoryCounters();
                const fps = trace.getFPS();
                const heap = memory.jsHeapSizeUsed.values;
                results.push({
                    fps:
                        fps.values.length < 1
                            ? undefined
                            : {
                                  stats: computeStats(fps.values),
                                  deviation: computeFPSDeviation(fps),
                              },
                    heap: heap.length < 1 ? undefined : computeStats(heap),
                });
            }

            const fps = Array.from(filter(map(results, (r: TraceStats) => r.fps)));
            const heap = Array.from(filter(map(results, (r) => r.heap)));
            const cpuUsage = computeMean(Array.from(map(usageStats, (u) => u.cpuUsage)));
            const gpuMemoryMB = computeMean(Array.from(map(usageStats, (u) => u.gpuMemoryMB)));
            const gpuUsage = computeMean(Array.from(map(usageStats, (u) => u.gpuUsage)));

            await writeJSON(testInfo.outputPath("results.json"), {
                fps:
                    fps.length < 1
                        ? undefined
                        : {
                              stats: computeFinalStats(map(fps, (v) => v.stats)),
                              deviation: computeFinalStats(map(fps, (v) => v.deviation)),
                          },
                heapMB: heap.length < 1 ? undefined : computeHeapStats(heap),
                cpuUsage: round(cpuUsage),
                gpuMemoryMB: round(gpuMemoryMB),
                gpuUsage: round(gpuUsage),
            });
        });

        for (let i = 0; i < MAX_ITERATION; i++) {
            trace(`Iteration ${i + 1}`, bench);
        }
    });
};

function* map<T, U>(array: Iterable<T>, mapper: (value: T) => U): Generator<U> {
    for (const object of array) {
        yield mapper(object);
    }
}

function* filter<T>(array: Generator<T | undefined>): Generator<T> {
    for (const object of array) {
        if (object !== undefined) {
            yield object;
        }
    }
}

function computeHeapStats(stats: Iterable<Stats>): Stats {
    const { min, max, mean, median, mode } = computeFinalStats(stats);
    return {
        min: round(min / MB_IN_BYTES),
        max: round(max / MB_IN_BYTES),
        mean: round(mean / MB_IN_BYTES),
        median: round(median / MB_IN_BYTES),
        mode: round(mode / MB_IN_BYTES),
    };
}

interface ResourceStats {
    cpuUsage: number;
    gpuMemoryMB: number;
    gpuUsage: number;
}

interface TraceStats {
    heap: Readonly<MemoryStats> | undefined;
    fps:
        | {
              stats: Stats;
              deviation: Stats;
          }
        | undefined;
}

interface Stats {
    min: number;
    max: number;
    mean: number;
    median: number;
    mode: number;
}

type MemoryStats = Stats;

function computeFinalStats(stats: Iterable<Stats>): Stats {
    const min = [];
    const max = [];
    const mean = [];
    const median = [];
    const mode = [];

    for (const stat of stats) {
        min.push(stat.min);
        max.push(stat.max);
        mean.push(stat.mean);
        median.push(stat.median);
        mode.push(stat.mode);
    }

    return {
        min: round(computeMean(min)),
        max: round(computeMean(max)),
        mean: round(computeMean(mean)),
        median: round(computeMean(median)),
        mode: round(computeMean(mode)),
    };
}

function computeFPSDeviation(rawFPS: CountersValuesTimestamp) {
    function* zip<T, U>(array1: T[], array2: U[]): Generator<[T, U]> {
        const minLen = Math.min(array1.length, array2.length);
        for (let i = 0; i < minLen; i++) {
            yield [array1[i], array2[i]];
        }
    }

    function* windows<T>(array: T[], size: number): Generator<T[]> {
        const iterations = array.length - size;
        for (let i = 0; i <= iterations; i++) {
            yield array.slice(i, i + size);
        }
    }
    // Order of values is not guaranted to be from beginning to end
    const sortedFPS = Array.from(zip(rawFPS.times, rawFPS.values)).sort(
        ([t1, _v1], [t2, _v2]) => t1 - t2
    );
    const differences = Array.from(windows(sortedFPS, 2), ([[_t1, v1], [_t2, v2]]) =>
        Math.abs(v1 - v2)
    );
    return computeStats(differences);
}

export function computeStats(values: number[]): Readonly<Stats> {
    const n = values.length;
    // number => count
    const counters = new Map<number, number>();
    let mean = 0;
    for (const value of values) {
        mean += value;
        const count = (counters.get(value) ?? 0) + 1;
        counters.set(value, count);
    }

    // [number, count]
    const histogram = Array.from(counters.entries()).sort((a, b) => a[0] - b[0]);
    const first = histogram[0];
    const min = first[0];
    let maxCount = first[1];
    let index = first[1];
    const medianIndex = (n + 1) / 2;
    let median = min;
    let mode = min;

    for (const [value, count] of histogram.slice(1)) {
        if (maxCount < count) {
            maxCount = count;
            mode = value;
        }

        if (index <= medianIndex) {
            median = value;
            index += count;
        }
    }

    return {
        min,
        max: histogram[histogram.length - 1][0],
        mean: mean / n,
        median,
        mode,
    };
}

function computeMean(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }
    let mean = 0;
    for (const v of values) {
        mean += v;
    }
    return mean / values.length;
}

export function writeJSON(path: string, json: any): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, JSON.stringify(json), { encoding: "utf8", flag: "w" }, (err) => {
            if (err !== null) {
                reject(err);
            } else {
                resolve(undefined);
            }
        });
    });
}

function readJSON(path: string): Promise<object> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, { encoding: "utf8" }, (err, data) => {
            if (err !== null) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

function round(value: number, digits: number = 5): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
}
