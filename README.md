# Getting Started

The very first step is to install all dependencies.

```
npm install
```

## Development

The project uses vite.js that means the first time it will re-compile your dependencies. Afterwards, everything should work quickly.

```
npm run dev
```

If you want to build a release build, you need to use this command.

```
npm run build
```

Serving the build be tested too.

```
npm run serve
```

## Tests

For tests playwright is used. Before you can use you must install first.

```
npx playwright install
```

The tests are only run on the production build, so the project must be build and served before testing.

```
npm run build
npm run serve
```

Afterwards, tests can be run with the following script.

```
<!-- in another terminal from the serving one -->
npm run test
```

For quick debugging having a headded browser is more convenient.

```
npm run test:dev
```

## Benchmark

The tests are only run on the production build, so the project must be build and served before testing.

```
npm run build
npm run serve
```

The benchmark script executes the tests and the performance test.

```
<!-- in another terminal from the serving one -->
npm run bench
```

If you only need to test the performance use the following command.

```
<!-- in another terminal from the serving one -->
npm run perf
```
