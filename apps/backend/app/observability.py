import logging
import os

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

LOG_FORMAT = (
    "%(asctime)s %(levelname)s [trace=%(otelTraceID)s span=%(otelSpanID)s] %(name)s - %(message)s"
)


def setup_tracing(app: FastAPI) -> None:
    resource = Resource.create(
        {
            "service.name": os.environ.get("OTEL_SERVICE_NAME", "lumen-backend"),
            "service.version": os.environ.get("OTEL_SERVICE_VERSION", "1.0.0"),
        }
    )

    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)

    otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))

        log_provider = LoggerProvider(resource=resource)
        set_logger_provider(log_provider)
        log_provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter()))
        otel_log_handler = LoggingHandler(level=logging.NOTSET, logger_provider=log_provider)
        otel_log_handler.addFilter(_TraceFieldDefaulter())
        logging.getLogger().addHandler(otel_log_handler)
        LoggingInstrumentor().instrument(
            logger_provider=log_provider,
            set_logging_format=False,
        )
    else:
        LoggingInstrumentor().instrument(set_logging_format=False)

    FastAPIInstrumentor.instrument_app(app)
    AsyncPGInstrumentor().instrument()
    HTTPXClientInstrumentor().instrument()


class _TraceFieldDefaulter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "otelTraceID"):
            record.otelTraceID = "0"
        if not hasattr(record, "otelSpanID"):
            record.otelSpanID = "0"
        return True


def setup_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    handler.addFilter(_TraceFieldDefaulter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True
