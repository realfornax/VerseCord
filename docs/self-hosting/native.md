# Native Linux hosting

This guide runs the server and the voice SFU under systemd on Debian or Ubuntu, without Docker, as a non-login `versecord` user that can write state and caches but not the application files. Don't give that user sudo or the `docker` group. The environment variables, voice, optional content and SQLite sections of [setup.md](setup.md) apply here too.

## Prerequisites

```sh
sudo apt update
sudo apt install ca-certificates curl unzip git rsync openssl build-essential python3 pkg-config libssl-dev ffmpeg postgresql postgresql-client
sudo systemctl enable --now postgresql
```

As your normal user, install [Bun 1.4](https://bun.sh/docs/installation), Go at the version in `extra/pion-sfu/go.mod` and Node.js for Equicord's build. Then copy Bun to the path the service uses:

```sh
sudo install -o root -g root -m 0755 "$(command -v bun)" /usr/local/bin/bun
```

Point a DNS name such as `chat.example.com` at the host, and open SSH and the ports in [setup.md](setup.md#requirements).

**The server listens on all interfaces and can't bind to loopback only, so block 3001/tcp and 5432/tcp from outside on IPv4 and IPv6, and check from another machine.** Keep PostgreSQL's `listen_addresses` on localhost.

## Service account and directories

```sh
sudo useradd --system --user-group --home-dir /var/lib/versecord --no-create-home --shell /usr/sbin/nologin versecord
sudo install -d -o root -g versecord -m 0750 /opt/versecord /opt/versecord/assets /etc/versecord
sudo install -d -o versecord -g versecord -m 0700 /var/lib/versecord /var/lib/versecord/storage /var/cache/versecord
```

| Path | Contents |
| --- | --- |
| `/opt/versecord` | The server, dependencies, scripts and static assets, read-only for the service. |
| `/etc/versecord/versecord.env` | The runtime environment with the database password, mode `0640`. |
| `/var/lib/versecord` | Configuration, keys and uploads. |
| `/var/cache/versecord` | The cached client, the cache miss log and the detectable games list. |
| `/run/versecord` | The SFU socket, created by systemd. |

## PostgreSQL

```sh
sudo -u postgres createuser --no-superuser --no-createdb --no-createrole --pwprompt versecord
sudo -u postgres createdb --owner=versecord versecord
psql -h 127.0.0.1 -U versecord -d versecord -W -c 'SELECT 1'
```

Use a password from `openssl rand -hex 24`. If the last command fails, add `host versecord versecord 127.0.0.1/32 scram-sha-256` to `pg_hba.conf` above any rule that matches first and reload PostgreSQL.

## Build and install

Build as your normal user, in a separate checkout:

```sh
git clone https://github.com/realfornax/VerseCord.git versecord-build
cd versecord-build
bun install --frozen-lockfile
bun run build:src
bun run generate:client
(cd extra/pion-sfu && go build -trimpath -o pion-sfu .)
```

`generate:client` downloads about 300 MB of Discord's client. Never commit or redistribute it. Install the runtime files:

```sh
for directory in dist node_modules scripts client; do
    sudo rsync -a --delete "$directory/" "/opt/versecord/$directory/"
done
sudo install -o root -g versecord -m 0640 package.json /opt/versecord/package.json
sudo rsync -a --delete --exclude=/cache --exclude=/cache_compressed --exclude=/cacheMisses --exclude=/detectable.json assets/ /opt/versecord/assets/
sudo install -o root -g versecord -m 0750 extra/pion-sfu/pion-sfu /opt/versecord/pion-sfu
sudo chown -hR root:versecord /opt/versecord
sudo chmod -R u=rwX,g=rX,o= /opt/versecord
sudo rsync -a --delete assets/cache/ /var/cache/versecord/cache/
sudo rsync -a --delete assets/cache_compressed/ /var/cache/versecord/cache_compressed/
sudo touch /var/cache/versecord/cacheMisses
sudo sh -c 'test -f /var/cache/versecord/detectable.json || printf "[]\n" > /var/cache/versecord/detectable.json'
sudo chown -R versecord:versecord /var/cache/versecord
sudo chmod -R u=rwX,go= /var/cache/versecord
sudo ln -s /var/cache/versecord/cache /opt/versecord/assets/cache
sudo ln -s /var/cache/versecord/cache_compressed /opt/versecord/assets/cache_compressed
sudo ln -s /var/cache/versecord/cacheMisses /opt/versecord/assets/cacheMisses
sudo ln -s /var/cache/versecord/detectable.json /opt/versecord/assets/detectable.json
```

The four symlinks are only needed on the first install.

## Runtime configuration

Create `/etc/versecord/versecord.env` as root with group `versecord` and mode `0640`, with your password, domain and public IPv4 address and literal values only, because systemd doesn't expand `$VARIABLE`:

```ini
NODE_ENV=production
PORT=3001
DATABASE=postgres://versecord:REPLACE_WITH_HEX_PASSWORD@127.0.0.1:5432/versecord
CONFIG_PATH=/var/lib/versecord/config.json
STORAGE_LOCATION=/var/lib/versecord/storage
BUN_RUNTIME_TRANSPILER_CACHE_PATH=/var/cache/versecord/bun
DOMAIN=chat.example.com
TRUSTED_PROXIES=loopback
WRTC_LIBRARY=pion
PION_SFU_BIN=/opt/versecord/pion-sfu
PION_SFU_IPC=/run/versecord/sfu.sock
WRTC_PUBLIC_IP=203.0.113.10
WRTC_PORT_MIN=50000
WRTC_PORT_MAX=50000
TURN_SECRET=<openssl rand -hex 32>
LOG_REQUESTS=500,501
PUBLIC_FETCH_PROXY=socks5://127.0.0.1:1080
```

Before each start the service runs `scripts/docker-configure.js`, which writes the public URLs into `config.json` and reads the optional variables from [setup.md](setup.md#environment). Leave `THREADS` and `WRTC_WS_PORT` unset, so one process serves everything on port 3001 and starts the SFU itself.

`PUBLIC_FETCH_PROXY` needs a SOCKS5 proxy, or link previews, the media proxy, webhook avatars and voice in servers on other instances fail. Run Cloudflare WARP with `warp-cli mode proxy` and `warp-cli proxy port 1080`, or the `warp` container from `docker-compose.yml` with port 1080 published on `127.0.0.1`. See [external-services.md](external-services.md#hiding-the-servers-address).

## systemd service

Save this as `/etc/systemd/system/versecord.service`:

```ini
[Unit]
Description=VerseCord server
Wants=network-online.target
After=network-online.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=versecord
Group=versecord
WorkingDirectory=/var/lib/versecord
EnvironmentFile=/etc/versecord/versecord.env
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStartPre=/usr/local/bin/bun /opt/versecord/scripts/client-release.js --check
ExecStartPre=/usr/local/bin/bun /opt/versecord/scripts/e2ee-anchors.js
ExecStartPre=/usr/local/bin/bun /opt/versecord/scripts/docker-configure.js
ExecStart=/usr/local/bin/bun /opt/versecord/dist/bundle/start.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=35
KillSignal=SIGTERM
KillMode=mixed
UMask=0077
RuntimeDirectory=versecord
RuntimeDirectoryMode=0700
NoNewPrivileges=true
CapabilityBoundingSet=
AmbientCapabilities=
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/versecord /var/cache/versecord /run/versecord
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6 AF_NETLINK

[Install]
WantedBy=multi-user.target
```

Don't add `MemoryDenyWriteExecute=true`, because Bun needs executable memory.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now versecord
curl --fail http://127.0.0.1:3001/readyz
curl --fail http://127.0.0.1:3001/api/ping
```

## HTTPS and the operator account

[Install Caddy](https://caddyserver.com/docs/install), put this in `/etc/caddy/Caddyfile` and reload it:

```caddyfile
chat.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3001
}
```

A proxy on another host needs its address in `TRUSTED_PROXIES` and must be the only host that can reach port 3001. Register at `https://chat.example.com/register` and grant your account the operator right, see [setup.md](setup.md#operator-account):

```sh
sudo -u versecord /usr/local/bin/bun --env-file=/etc/versecord/versecord.env /opt/versecord/scripts/ops/operator.mjs grant ACCOUNT_ID
```

## Backups and restore

Run these in Bash:

```sh
set -o pipefail
sudo systemctl stop versecord
backup_dir="/var/backups/versecord/$(date -u +%Y%m%dT%H%M%SZ)"
sudo install -d -o root -g root -m 0700 "$backup_dir"
sudo -u postgres pg_dump -Fc versecord | sudo tee "$backup_dir/database.dump" > /dev/null
sudo tar -czf "$backup_dir/state.tar.gz" -C / etc/versecord var/lib/versecord
sudo tar -czf "$backup_dir/client.tar.gz" -C / var/cache/versecord
sudo chmod 0600 "$backup_dir/database.dump" "$backup_dir/state.tar.gz" "$backup_dir/client.tar.gz"
sudo systemctl start versecord
```

Note the installed commit with each backup, encrypt it and copy it off the host. The state archive holds the database password and every key, and an existing instance must never get a new recovery key.

To restore, restore the three directories into a fresh install of the same commit, recreate the symlinks, ownership and modes above, and load the dump into a fresh database with `pg_restore --no-owner --role=versecord`.

## Updates

In the build checkout, check out the new revision and run `bun install --frozen-lockfile`, `bun run build:src`, `bun run build:equicord` and the SFU build. When `client/release.json` changed, also run `bun run generate:client`. A fresh checkout needs a copy of `/var/cache/versecord/cache` first, because the install commands copy the checkout's cache over the installed one.

Back up, keep a copy of `/opt/versecord`, rerun the install commands without the symlinks, restart the service and repeat the health checks. A rollback restores the database, state, release and client together, because the new release has already migrated the database. `scripts/auto-update.sh` only works with Compose.
