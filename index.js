"use strict";
const opentelemetry = require("@opentelemetry/api");
exports.handler = async (event) => {
    const message = "hey girl";
    const span = opentelemetry.trace.getTracer("default").startSpan("hey girl");
    const response = {
        statusCode: 200,
        body: JSON.stringify(message),
    };
    span.setAttribute("message", message);
    process.stdout.write(message);
    span.end();
    return response;
};
