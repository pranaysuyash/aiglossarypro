#!/usr/bin/env python3
import os
import time

# Look for the most recent log file that might be created by our processor
log_files = []

print("Current time:", time.strftime("%Y-%m-%d %H:%M:%S"))
print("\nChecking memory usage of the Python process:")
os.system("ps -o pid,ppid,cmd,%mem,%cpu,vsz,rss -p 6623")

print("\nChecking processing status...")
os.system("tail -10 /tmp/excel_processor.log 2>/dev/null || echo 'No log file found'")

print("\nWaiting for the completion of the processing job...")
