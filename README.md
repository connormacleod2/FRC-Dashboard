# Flask Dashboard for FRC
 
 ## Quick start (Raspberry Pi / Raspberry Pi OS)
 1. Create a `.env` file in the project root with:
 
 ```
 TEAM_NUMBER=1234
 DEFAULT_YEAR=2026
 BASE_URL=https://www.thebluealliance.com/api/v3
 API_KEY=YOUR_TBA_KEY
 AUTH_USER=admin
 AUTH_PASS=yourpassword
 ```

 > **Note:** `AUTH_USER` and `AUTH_PASS` are optional. Defaults: `admin` / `frc2026`
 
 2. Run:
  ```bash
 chmod +x ./run_dashboard_pi.sh
 ./run_dashboard_pi.sh
 ```
 
 ## Quick start (Windows)
 1. Create a `.env` file in the project root with the same variables as above.
 
 2. Run:
 ```powershell
 .\run_dashboard.ps1
 ```
 
 The scripts will install dependencies, launch the app, and open `http://127.0.0.1:5000/`.

 ## Docker (Linux container)
 1. Create a `.env` file in the project root with the same variables as above.

 2. Run with Docker Compose:
 ```bash
 docker compose up --build -d
 ```

 3. Open: `http://127.0.0.1:5000/`

 ## Public Access (Cloudflare Tunnel)
 The Docker setup includes a Cloudflare tunnel for public access without port forwarding.

 1. Start the containers:
 ```bash
 docker compose up --build -d
 ```

 2. Get the public URL:
 ```bash
 docker compose logs cloudflared | grep trycloudflare.com
 ```

 Share the `*.trycloudflare.com` URL. Note: URL changes on each restart.

 ### Raspberry Pi emulation notes
 To emulate a Raspberry Pi userspace on a non-ARM machine, build/run the image as `linux/arm64` (or `linux/arm/v7` for 32-bit) using Docker Buildx.

 Build and run as ARM64:
 ```bash
 docker buildx build --platform linux/arm64 -t frc-dashboard:arm64 --load .
 docker run --rm -p 5000:5000 --env-file .env frc-dashboard:arm64
 ```
