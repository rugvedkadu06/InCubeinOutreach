import io
import json
import zipfile

from ..core.database import (
    get_pipeline_logs,
    log_pipeline_step,
    clear_all_tables,
)
from .scraper import run_scraper_pipeline
from .cleaner import run_cleaner_pipeline
from .resolution import run_resolution_pipeline
from .enricher import run_enricher_pipeline
from .graph import (
    generate_csv_exports,
    generate_json_export,
    generate_mongodb_export,
    generate_neo4j_export,
)


def reset_pipeline():
    clear_all_tables()
    log_pipeline_step("SYSTEM", "SUCCESS", "Ecosystem database tables reset successfully.")
    return {"status": "success", "message": "Ecosystem database cleared."}


def run_pipeline(stage: str):
    stage = stage.lower()
    if stage == "scrape":
        return {
            "status": "success",
            "message": "Scraper pipeline run complete.",
            "details": run_scraper_pipeline(),
        }
    elif stage == "clean":
        return {
            "status": "success",
            "message": "Cleaner pipeline run complete.",
            "details": run_cleaner_pipeline(),
        }
    elif stage == "resolve":
        return {
            "status": "success",
            "message": "Entity resolution pipeline run complete.",
            "details": run_resolution_pipeline(),
        }
    elif stage == "enrich":
        return {
            "status": "success",
            "message": "AI enrichment pipeline run complete.",
            "details": run_enricher_pipeline(),
        }
    elif stage == "all":
        return {
            "status": "success",
            "message": "Complete pipeline (Scrape -> Clean -> Resolve -> Enrich) executed successfully.",
            "details": {
                "scrape": run_scraper_pipeline(),
                "clean": run_cleaner_pipeline(),
                "resolve": run_resolution_pipeline(),
                "enrich": run_enricher_pipeline(),
            },
        }
    raise ValueError("Invalid pipeline stage. Select from: scrape, clean, resolve, enrich, all")


def get_logs():
    return get_pipeline_logs()


def export_data(format_type: str):
    """Returns (content, media_type, filename). Raises ValueError for invalid format."""
    format_type = format_type.lower()

    if format_type == "json":
        return json.dumps(generate_json_export(), indent=2), "application/json", "ecosystem_graph.json"

    elif format_type == "mongodb":
        return generate_mongodb_export(), "text/javascript", "import_mongodb.js"

    elif format_type == "neo4j":
        return generate_neo4j_export(), "text/plain", "import_graph.cypher"

    elif format_type == "csv":
        csv_files = generate_csv_exports()
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            for filename, csv_content in csv_files.items():
                zip_file.writestr(filename, csv_content)
        zip_buffer.seek(0)
        return zip_buffer, "application/zip", "ecosystem_csvs.zip"

    raise ValueError("Invalid export format. Select from: json, csv, mongodb, neo4j")
