const { test } = require("node:test");
const assert = require("node:assert/strict");
const { StubError, loadRoutes, response } = require("./helpers/route-harness.cjs");

const paths = {
    settings: "src/api/routes/admin/system/collectibles.ts",
    shop: "src/api/routes/collectibles-shop.ts",
    categories: "src/api/routes/collectibles-categories/index.ts",
    categoriesV2: "src/api/routes/collectibles-categories/v2.ts",
    search: "src/api/routes/shop/search.ts",
    claim: "src/api/routes/users/@me/claim-premium-collectibles-product.ts",
    purchases: "src/api/routes/users/@me/collectibles-purchases.ts",
};

function setup() {
    const config = { client: { shopEnabled: true, instanceName: "Local name" }, cdn: { storageQuota: {} } };
    const writes = [];
    const calls = [];
    const grants = async () => {
        calls.push("grant");
        return [{ sku_id: "123" }];
    };
    const routes = (file) =>
        loadRoutes(file, {
            "@spacebar/database": { getDatabase: () => null },
            "@spacebar/util": {
                Config: {
                    get: () => config,
                    set: async (value) => {
                        writes.push(value);
                        Object.assign(config, value);
                    },
                },
                Collectibles: {
                    status: async () => ({}),
                    shop: async () => {
                        calls.push("shop");
                        return { shop_blocks: ["active"] };
                    },
                    categories: async () => {
                        calls.push("categories");
                        return ["active"];
                    },
                    search: async () => {
                        calls.push("search");
                        return { skus: ["123"] };
                    },
                },
            },
            "@spacebar/api/util": { grantCollectible: grants, listCollectiblePurchases: async () => [{ sku_id: "123" }] },
            "lambert-server/HTTPError": { HTTPError: StubError },
        });
    return { routes, calls, writes, config };
}

test("operator setting rejects non-booleans and preserves client branding", async () => {
    const { routes, writes, config } = setup();
    const router = routes(paths.settings);
    await assert.rejects(router["PATCH /"]({ body: { enabled: "false" } }, response()), { code: 400 });
    assert.equal(writes.length, 0);
    const off = response();
    await router["PATCH /"]({ body: { enabled: false } }, off);
    assert.equal(off.body.shop_enabled, false);
    assert.equal(config.client.instanceName, "Local name");
    const on = response();
    await router["PATCH /"]({ body: { enabled: true } }, on);
    assert.equal(on.body.shop_enabled, true);
});

test("turning off the Shop disables listing and claims without resolving the catalogue", async () => {
    const { routes, calls } = setup();
    await routes(paths.settings)["PATCH /"]({ body: { enabled: false } }, response());
    const shop = response();
    await routes(paths.shop)["GET /"]({}, shop);
    assert.equal(shop.statusCode, 204);

    const categories = response();
    const categoriesV2 = response();
    const search = response();
    await routes(paths.categories)["GET /"]({}, categories);
    await routes(paths.categoriesV2)["GET /"]({}, categoriesV2);
    await routes(paths.search)["GET /"]({ query: {} }, search);
    assert.equal(categories.body.length, 0);
    assert.equal(categoriesV2.body.categories.length, 0);
    assert.equal(search.body.skus.length, 0);
    assert.equal(search.body.pagination.total, 0);
    await assert.rejects(routes(paths.claim)["PUT /"]({ body: { sku_id: "123" } }, response()), { code: 403 });
    assert.deepEqual(calls, []);
    const owned = response();
    await routes(paths.purchases)["GET /"]({ user_id: "local-user" }, owned);
    assert.equal(owned.body[0].sku_id, "123");

    await routes(paths.settings)["PATCH /"]({ body: { enabled: true } }, response());
    await routes(paths.shop)["GET /"]({}, response());
    await routes(paths.claim)["PUT /"]({ body: { sku_id: "123" } }, response());
    assert.deepEqual(calls, ["shop", "grant"]);
});
