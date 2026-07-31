"""
InCubein Launcher
-----------------
Entry point when running as a standalone .exe.
- Starts the FastAPI/uvicorn server in a background thread on port 8000
- Waits until the server is ready
- Opens http://localhost:8000 in the default browser
- Keeps running until the user closes the window
"""

import sys
import os
import time
import threading
import webbrowser
import socket

# Path setup for PyInstaller
if getattr(sys, "frozen", False):
    BUNDLE_DIR = sys._MEIPASS
    EXE_DIR = os.path.dirname(sys.executable)
    sys.path.insert(0, BUNDLE_DIR)
    os.chdir(EXE_DIR)
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXE_DIR = BUNDLE_DIR
    sys.path.insert(0, os.path.join(BUNDLE_DIR, "backend"))

HOST = "127.0.0.1"
PORT = 8000
URL  = f"http://{HOST}:{PORT}"

def start_server():
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, log_level="warning")

def wait_for_server(timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((HOST, PORT), timeout=1):
                return True
        except OSError:
            time.sleep(0.3)
    return False

def main():
    print("=" * 55)
    print("  InCubein -- RTMNU Business Incubation Platform")
    print("=" * 55)
    print(f"\n  Starting server at {URL} ...")
    print("  Press Ctrl+C or close this window to stop.\n")

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    ready = wait_for_server(timeout=30)
    if not ready:
        print("\n  ERROR: Server failed to start within 30 seconds.")
        print("  Check that port 8000 is not already in use.\n")
        input("  Press Enter to exit...")
        sys.exit(1)

    print(f"  Server ready! Opening {URL} in your browser...\n")
    webbrowser.open(URL)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n  Shutting down InCubein. Goodbye!\n")

if __name__ == "__main__":
    main()
