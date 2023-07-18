"use strict";
const opentelemetry = require("@opentelemetry/api");
exports.handler = async (event) => {
// for local testing
// const handler = async (event) => {
    const message = "hey girl";
    const tracer = opentelemetry.trace.getTracer("my-tracer");
    const span = tracer.startSpan("hey girl");
    const response = {
        statusCode: 200,
        body: JSON.stringify(message),
    };
    span.setAttribute("message", message);
    console.log(`TraceId: ${span._spanContext.traceId}, SpanId: ${span._spanContext.spanId}`);
    process.stdout.write(message);
    span.end();
    return response;
};
// for local testing
// handler();