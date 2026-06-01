# quode-runner — VPS deploy (167.86.90.235, Contabo Ubuntu 24.04)

Single-host setup. Piston (port 2000) keeps running for any future
non-interactive use; quode-runner runs on **port 2001** behind Caddy on
**443** at `167-86-90-235.sslip.io` (free Let's Encrypt cert, no domain
purchase needed).

The frontend on Vercel connects to `wss://167-86-90-235.sslip.io/ws/run`.

## 1. SSH in & install deps

```bash
ssh root@167.86.90.235

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs build-essential python3 python3-pip

# .NET SDK + dotnet-script (for C# phase 2)
apt-get install -y dotnet-sdk-8.0
sudo -u quode-runner -H bash -c 'dotnet tool install -g dotnet-script'
# Make ~/.dotnet/tools available to the service:
echo 'Environment=PATH=/home/quode-runner/.dotnet/tools:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' \
  >> /etc/systemd/system/quode-runner.service.d/path.conf  # create dir first if needed

# node-pty needs build tools (already covered by build-essential).

# Caddy (TLS reverse proxy)
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  > /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy
```

## 2. Create the runner user (low priv, no shell login)

```bash
useradd --system --create-home --shell /usr/sbin/nologin quode-runner
```

## 3. Drop the code

```bash
mkdir -p /opt/quode-runner
# from your laptop:
#   rsync -avz infra/quode-runner/ root@167.86.90.235:/opt/quode-runner/
chown -R quode-runner:quode-runner /opt/quode-runner
sudo -u quode-runner -H bash -c 'cd /opt/quode-runner && npm install --omit=dev'
```

## 4. systemd unit

`/etc/systemd/system/quode-runner.service`:

```ini
[Unit]
Description=Quode interactive runner (WebSocket + node-pty)
After=network.target

[Service]
Type=simple
User=quode-runner
Group=quode-runner
WorkingDirectory=/opt/quode-runner
Environment=NODE_ENV=production
Environment=PORT=2001
Environment=HOST=127.0.0.1
Environment=MAX_PER_IP=2
# Tighten this once the Vercel project URL is known.
# Example: https://quode.vercel.app,https://quode.app
Environment=ALLOWED_ORIGINS=https://quode.vercel.app
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=2

# Sandbox the service itself (orthogonal to per-run isolation).
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/tmp
LimitNPROC=128
LimitNOFILE=1024
LimitCPU=60

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now quode-runner
systemctl status quode-runner
```

## 5. Caddy — TLS for `167-86-90-235.sslip.io`

`/etc/caddy/Caddyfile`:

```
167-86-90-235.sslip.io {
    encode zstd gzip
    reverse_proxy 127.0.0.1:2001
}
```

```bash
systemctl reload caddy
# Watch the cert get issued:
journalctl -u caddy -f
```

## 6. Firewall

```bash
# Allow 80 (ACME), 443 (wss), keep 22 (ssh) and 2000 (piston) as-is.
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save
```

## 7. Smoke test

```bash
curl https://167-86-90-235.sslip.io/health
# {"ok":true,"active":0}
```

Then from the Quode frontend set:

```
NEXT_PUBLIC_RUNNER_WS_URL=wss://167-86-90-235.sslip.io/ws/run
```

## Per-run sandboxing — next pass

Today: relies on the unprivileged `quode-runner` user + 30s wall clock +
`PrivateTmp`. Code that wants to fork-bomb is bounded by `LimitNPROC=128`.

When we need stronger isolation (network egress block, FS denylist beyond
`/tmp`), wrap the spawn in `bwrap` (bubblewrap) or move each run into a
short-lived Docker container. Tracked separately.
