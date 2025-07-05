import os
import json
import time
import csv
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Dict

from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# ── Configuration ─────────────────────────────────────────────────────────────

CSV_FILE         = "aiml2.csv"
CHECKPOINT_FILE  = "checkpoint.json"

MAX_WORKERS      = 25
BATCH_SIZE       = MAX_WORKERS * 3
REQUEST_TIMEOUT  = 60
MAX_RETRIES      = 3
RETRY_DELAY      = 2

# Using your requested model
PRIMARY_MODEL    = "gpt-4.1-nano"
FALLBACK_MODEL   = "gpt-3.5-turbo"

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("ai_content_generator.log")]
)
logger = logging.getLogger(__name__)

# ── OpenAI Client ────────────────────────────────────────────────────────────

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# ── Safety Helpers ────────────────────────────────────────────────────────────



# ── Checkpoint Helpers ────────────────────────────────────────────────────────

def load_checkpoint() -> Dict[str, bool]:
    if Path(CHECKPOINT_FILE).exists():
        try:
            return json.loads(Path(CHECKPOINT_FILE).read_text())
        except json.JSONDecodeError:
            logger.warning("Corrupted checkpoint file. Starting fresh.")
            # back up the corrupted file
            Path(CHECKPOINT_FILE).rename(f"{CHECKPOINT_FILE}.corrupted.{int(time.time())}")
    return {}

def save_checkpoint(cp: Dict[str, bool]) -> None:
    tmp_file = f"{CHECKPOINT_FILE}.tmp"
    with open(tmp_file, 'w') as f:
        json.dump(cp, f, indent=2)
    os.replace(tmp_file, CHECKPOINT_FILE)

def reconcile_checkpoint(
    rows: List[List[str]],
    checkpoint: Dict[str, bool]
) -> None:
    """
    Drop any checkpoint entries whose cells are still empty,
    so they’ll be re-queued on restart.
    """
    to_remove = []
    for key in list(checkpoint.keys()):
        try:
            row_idx, col_idx = map(int, key.split('-'))
        except ValueError:
            continue
        
        # Convert to 0-based indexing (row_idx-2 because row 0 is headers, row 1 is first data row)
        data_row_idx = row_idx - 2
        if data_row_idx < 0 or data_row_idx >= len(rows):
            to_remove.append(key)
            continue
            
        if col_idx < 0 or col_idx >= len(rows[data_row_idx]):
            to_remove.append(key)
            continue
            
        val = rows[data_row_idx][col_idx]
        if val is None or (isinstance(val, str) and not val.strip()):
            to_remove.append(key)

    for key in to_remove:
        checkpoint.pop(key, None)

    if to_remove:
        save_checkpoint(checkpoint)
        logger.info(f"Reconciled checkpoint: removed {len(to_remove)} stale entries")

# ── Prompt & API Call ─────────────────────────────────────────────────────────

def construct_prompt(term: str, section: str) -> str:
    return (
        f'You are an AI/ML educational content assistant. '
        f'For the term "{term}", please write only the content for this section:\n\n'
        f'"{section}"\n\n'
        "Do not include any extra headings or formatting—just the prose, "
        "concise enough to fit in one spreadsheet cell."
    )

def call_openai_api(term: str, section: str, row: int, col: int) -> Optional[str]:
    logger.info(f"Row {row}, Col {col}: '{term}' → '{section}'")
    for attempt in range(MAX_RETRIES + 1):
        model = PRIMARY_MODEL if attempt < MAX_RETRIES else FALLBACK_MODEL
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an AI/ML educational content assistant."},
                    {"role": "user",   "content": construct_prompt(term, section)}
                ],
                timeout=REQUEST_TIMEOUT
            )
            content = resp.choices[0].message.content.strip()
            if content and len(content) > 10:
                logger.info(f"Completed Row {row}, Col {col} ({len(content)} chars)")
                return content
            if attempt < MAX_RETRIES:
                logger.warning(f"[{model}] Row {row}, Col {col}: got too-short content, retrying…")
                continue
            return content
        except Exception as e:
            if attempt < MAX_RETRIES:
                logger.warning(f"[{model}] Row {row}, Col {col}: error {e}, retry {attempt+1}/{MAX_RETRIES}")
                time.sleep(RETRY_DELAY * (attempt+1))
            else:
                logger.error(f"Row {row}, Col {col}: final failure: {e}")
                return None

# ── Sheet & Task Management ───────────────────────────────────────────────────


def find_missing_cells(
    headers: List[str],
    rows: List[List[str]],
    checkpoint: Dict[str, bool],
    bottom_up: bool = False
) -> List[Tuple[int,int,str,str]]:
    tasks = []
    
    for row_idx, row in enumerate(rows):
        # Ensure row has enough columns
        while len(row) < len(headers):
            row.append("")
        
        term = row[0] if row else ""
        if not term:
            continue
            
        for col_idx, header in enumerate(headers[1:], start=1):
            if not header:
                continue
            
            # Use Excel-like row numbering (starting from 2 for first data row)
            excel_row = row_idx + 2  
            key = f"{excel_row}-{col_idx}"
            
            if key in checkpoint or (col_idx < len(row) and row[col_idx]):
                continue
                
            tasks.append((excel_row, col_idx, term, header))

    if tasks:
        sample = tasks[:3]
        info = []
        for r, c, t, _ in sample:
            info.append(f"Row {r}, Col {c} ({t})")
        logger.info(f"Sample to process: {', '.join(info)}{'...' if len(tasks)>3 else ''}")
        logger.info(f"Total cells to process: {len(tasks)}")

    return list(reversed(tasks)) if bottom_up else tasks

def update_csv_data(
    rows: List[List[str]],
    results: List[Tuple[int,int,Optional[str]]]
) -> int:
    updated = 0
    for row, col, text in results:
        if text:
            try:
                # Convert to 0-based indexing
                data_row_idx = row - 2
                if data_row_idx >= 0 and data_row_idx < len(rows):
                    # Ensure row has enough columns
                    while len(rows[data_row_idx]) <= col:
                        rows[data_row_idx].append("")
                    rows[data_row_idx][col] = text
                    updated += 1
            except Exception as e:
                logger.error(f"Failed updating cell {row}-{col}: {e}")
    return updated

def update_checkpoint(
    checkpoint: Dict[str, bool],
    results: List[Tuple[int,int,Optional[str]]]
) -> None:
    dirty = False
    for row, col, text in results:
        if text:
            checkpoint[f"{row}-{col}"] = True
            dirty = True
    if dirty:
        save_checkpoint(checkpoint)

# ── Core Batch Processor ─────────────────────────────────────────────────────

def batch_process_parallel(bottom_up: bool = False):
    logger.info(f"Starting {'bottom-up' if bottom_up else 'top-down'} pass")

    if not Path(CSV_FILE).exists():
        logger.error(f"CSV file {CSV_FILE} not found.")
        return

    headers, rows = load_csv_data(CSV_FILE)
    checkpoint = load_checkpoint()

    # — reconcile checkpoint before scanning for missing cells —
    reconcile_checkpoint(rows, checkpoint)

    tasks = find_missing_cells(headers, rows, checkpoint, bottom_up)
    total = len(tasks)
    if total == 0:
        logger.info("No missing cells found. Exiting.")
        return

    logger.info(f"Found {total} cells to fill")
    progress = tqdm(total=total, desc="Cells", unit="cell")

    for i in range(0, total, BATCH_SIZE):
        batch = tasks[i : i + BATCH_SIZE]
        results = []

        batch_num   = i // BATCH_SIZE + 1
        batch_total = (total - 1) // BATCH_SIZE + 1
        logger.info(f"Processing batch {batch_num}/{batch_total} (cells {i+1}-{min(i+BATCH_SIZE, total)})")

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            futures = {
                pool.submit(call_openai_api, term, section, row, col): (row, col)
                for row, col, term, section in batch
            }
            for fut in as_completed(futures):
                row, col = futures[fut]
                try:
                    text = fut.result()
                except Exception as e:
                    logger.error(f"Thread error at {row}-{col}: {e}")
                    text = None
                results.append((row, col, text))
                progress.update(1)

        updated = update_csv_data(rows, results)
        update_checkpoint(checkpoint, results)
        save_csv_data(CSV_FILE, headers, rows)
        logger.info(f"Batch {batch_num}/{batch_total} saved ({updated}/{len(batch)} updated)")

    progress.close()
    logger.info("All done!")

# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Fill AI/ML terms CSV file")
    parser.add_argument("--mode", choices=["topdown","bottomup"], default="topdown",
                        help="Processing order")
    parser.add_argument("--reset-checkpoint", action="store_true",
                        help="Clear checkpoint and start over")
    parser.add_argument("--workers", type=int, help="Override number of parallel workers")
    parser.add_argument("--batch-size", type=int, help="Override batch size")
    parser.add_argument("--file", type=str, default=CSV_FILE, help="CSV file to process")
    args = parser.parse_args()

    if args.reset_checkpoint and Path(CHECKPOINT_FILE).exists():
        Path(CHECKPOINT_FILE).unlink()
        logger.info("Checkpoint reset")

    if args.workers:
        MAX_WORKERS = args.workers
        logger.info(f"Using {MAX_WORKERS} workers")
    if args.batch_size:
        BATCH_SIZE = args.batch_size
        logger.info(f"Using batch size: {BATCH_SIZE}")
    if args.file and args.file != CSV_FILE:
        CSV_FILE = args.file
        logger.info(f"Processing file: {CSV_FILE}")

    try:
        batch_process_parallel(bottom_up=(args.mode == "bottomup"))
    except KeyboardInterrupt:
        logger.info("Interrupted by user. Progress saved.")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
