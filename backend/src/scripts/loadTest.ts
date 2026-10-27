import http from 'http';
import app from '../server';

interface BenchmarkResult {
  concurrency: number;
  totalRequests: number;
  durationSeconds: number;
  rps: number;
  errorRatePercent: number;
  minMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  avgMs: number;
}

const runConcurrentBenchmark = async (
  port: number,
  path: string,
  concurrency: number,
  totalRequests: number
): Promise<BenchmarkResult> => {
  const latencies: number[] = [];
  let successful = 0;
  let errors = 0;
  let requestsSent = 0;

  const startTotalTime = performance.now();

  const makeRequest = (): Promise<void> => {
    return new Promise((resolve) => {
      const startReq = performance.now();
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port,
          path,
          agent: false, // Don't use keep-alive pooling to test raw connection handling
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            const duration = performance.now() - startReq;
            latencies.push(duration);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
              successful++;
            } else {
              errors++;
            }
            resolve();
          });
        }
      );

      req.on('error', () => {
        const duration = performance.now() - startReq;
        latencies.push(duration);
        errors++;
        resolve();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        const duration = performance.now() - startReq;
        latencies.push(duration);
        errors++;
        resolve();
      });
    });
  };

  // Worker loop for concurrency pool
  const worker = async () => {
    while (requestsSent < totalRequests) {
      requestsSent++;
      await makeRequest();
    }
  };

  // Launch 'concurrency' number of parallel workers
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationSeconds = (performance.now() - startTotalTime) / 1000;
  latencies.sort((a, b) => a - b);

  const getPercentile = (p: number): number => {
    if (latencies.length === 0) return 0;
    const index = Math.min(Math.floor((p / 100) * latencies.length), latencies.length - 1);
    return Math.round(latencies[index] * 100) / 100;
  };

  const avgMs =
    latencies.length > 0
      ? Math.round((latencies.reduce((sum, val) => sum + val, 0) / latencies.length) * 100) / 100
      : 0;

  return {
    concurrency,
    totalRequests,
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    rps: Math.round((totalRequests / durationSeconds) * 10) / 10,
    errorRatePercent: Math.round((errors / totalRequests) * 1000) / 10,
    minMs: Math.round((latencies[0] || 0) * 100) / 100,
    p50Ms: getPercentile(50),
    p90Ms: getPercentile(90),
    p95Ms: getPercentile(95),
    p99Ms: getPercentile(99),
    maxMs: Math.round((latencies[latencies.length - 1] || 0) * 100) / 100,
    avgMs,
  };
};

const main = async () => {
  console.log('================================================================');
  console.log('ANVESHANA CLUB PRODUCTION LOAD & SCALABILITY BENCHMARK SUITE');
  console.log('================================================================');

  const startMem = process.memoryUsage();
  console.log(`Initial RSS: ${(startMem.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Initial Heap Used: ${(startMem.heapUsed / 1024 / 1024).toFixed(2)} MB\n`);

  // Start app on random available port
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5000;

  console.log(`Benchmark server running on 127.0.0.1:${port}`);

  const concurrencyTiers = [10, 25, 50, 100, 200];
  const results: BenchmarkResult[] = [];

  for (const concurrency of concurrencyTiers) {
    const totalRequests = concurrency >= 100 ? 500 : 300;
    process.stdout.write(`Executing Tier: Concurrency=${concurrency}, Requests=${totalRequests}... `);
    const result = await runConcurrentBenchmark(port, '/api/health', concurrency, totalRequests);
    console.log(`Done! RPS: ${result.rps}, p50: ${result.p50Ms}ms, p95: ${result.p95Ms}ms, p99: ${result.p99Ms}ms, Errors: ${result.errorRatePercent}%`);
    results.push(result);
  }

  // Also test /api/v1 baseline endpoint under 50 concurrency
  console.log(`\nTesting /api/v1 endpoint under Concurrency=50 (300 requests)...`);
  const apiV1Result = await runConcurrentBenchmark(port, '/api/v1', 50, 300);
  console.log(`Done! RPS: ${apiV1Result.rps}, p50: ${apiV1Result.p50Ms}ms, p95: ${apiV1Result.p95Ms}ms, p99: ${apiV1Result.p99Ms}ms, Errors: ${apiV1Result.errorRatePercent}%`);

  const endMem = process.memoryUsage();
  console.log('\n================================================================');
  console.log('BENCHMARK RESULTS SUMMARY TABLE');
  console.log('================================================================');
  console.table(results);

  console.log('\nResource Utilization:');
  console.log(`Final RSS: ${(endMem.rss / 1024 / 1024).toFixed(2)} MB (Delta: ${((endMem.rss - startMem.rss) / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Final Heap Used: ${(endMem.heapUsed / 1024 / 1024).toFixed(2)} MB (Delta: ${((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024).toFixed(2)} MB)`);

  server.close(() => {
    console.log('\nBenchmark server shutdown cleanly.');
    process.exit(0);
  });
};

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
