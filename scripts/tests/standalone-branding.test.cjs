const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadModule } = require("./helpers/route-harness.cjs");

test("standalone configuration cannot reactivate federation from legacy settings or refresh overrides", async () => {
    const { FederationConfiguration } = loadModule("src/util/config/types/FederationConfiguration.ts", {});
    const mergeDeep = (target, ...sources) => {
        for (const source of sources) {
            for (const [key, value] of Object.entries(source)) {
                target[key] = value && typeof value === "object" && !Array.isArray(value) ? mergeDeep(target[key] ?? {}, value) : value;
            }
        }
        return target;
    };
    class ConfigValue {
        federation = new FederationConfiguration();
        security = {};
    }
    const legacy = { enabled: true, announce: true, announceStats: true, peers: ["old.example"] };
    const { Config } = loadModule(
        "src/util/util/Config.ts",
        {
            "../imports": { OrmUtils: { mergeDeep } },
            "../config": { ConfigValue },
            "../../database/entities": { ConfigEntity: class {} },
            picocolors: {},
            "../config/types/ClientConfiguration": { DEFAULT_INSTANCE_NAME: "VerseCord" },
            "../config/types/AutomodConfiguration": { AUTOMOD_POLICY_KEYS: [] },
        },
        { process: { env: { CONFIG_JSON: JSON.stringify({ federation: legacy }) } } },
    );
    for (const config of [Config.get(), await Config.refresh(), await Config.refresh({ federation: legacy })]) {
        assert.equal(config.federation.enabled, false);
        assert.equal(config.federation.announce, false);
        assert.equal(config.federation.announceStats, false);
    }
});

test("default web artwork and client spinner share the VerseCord glyph", () => {
    const { ClientConfiguration } = loadModule("src/util/config/types/ClientConfiguration.ts", {});
    const { INSTANCE_ICON_PATH, INSTANCE_SPARK_PATH, wordmarkMarkup } = loadModule("src/util/util/BrandMarkup.ts", {});
    assert.equal(new ClientConfiguration().instanceName, "VerseCord");
    for (const file of ["versecord.svg", "versecord-icon.svg", "versecord-favicon.svg"]) {
        const svg = fs.readFileSync(`assets/public/branding/${file}`, "utf8");
        assert.ok(svg.includes(INSTANCE_ICON_PATH), file);
        assert.ok(svg.includes(INSTANCE_SPARK_PATH), file);
    }
    const spinner = fs.readFileSync("client/plugins/fosscordBranding/art.tsx", "utf8");
    assert.ok(spinner.includes(INSTANCE_ICON_PATH));
    assert.ok(spinner.includes(INSTANCE_SPARK_PATH));
    assert.match(spinner, /prefers-reduced-motion/);
    assert.match(wordmarkMarkup("A local name"), /A local name/);
    const png = fs.readFileSync("assets/icon.png");
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
});
