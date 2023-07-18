const process = require('process');
const { AwsLambdaInstrumentation } = require('@opentelemetry/instrumentation-aws-lambda');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { Metadata, credentials } = require('@grpc/grpc-js');

// const opentelemetry = require("@opentelemetry/api");
// const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");

// opentelemetry.diag.setLogger(
//   new opentelemetry.DiagConsoleLogger(),
//   opentelemetry.DiagLogLevel.DEBUG
// );

// Honeycomb
const HONEYCOMB_API_KEY = process.env.HONEYCOMB_API_KEY || '';
const SERVICE_NAME = process.env.SERVICE_NAME || 'heygirl-lambda';
const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'api.honeycomb.io:443';

const metadata = new Metadata();
metadata.set('x-honeycomb-team', HONEYCOMB_API_KEY);

const traceExporter = new OTLPTraceExporter({
  url: OTEL_EXPORTER_OTLP_ENDPOINT,
  credentials: credentials.createSsl(),
  metadata,
});

// const consoleExporter = new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
  }),
  traceExporter,
  // traceExporter: consoleExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
    new AwsLambdaInstrumentation({
      // By default, this instrumentation will try to read the context from the _X_AMZN_TRACE_ID environment variable set by Lambda,
      // set this to true or set the environment variable OTEL_LAMBDA_DISABLE_AWS_CONTEXT_PROPAGATION=true to disable this behavior
      disableAwsContextPropagation: true,
      requestHook: (span, { event, context }) => {
        span.setAttribute('faas.name', context.functionName);
      },
      responseHook: (span, { err, res }) => {
        if (err instanceof Error) span.setAttribute('faas.error', err.message);
        if (res) span.setAttribute('faas.res', res);
      },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
