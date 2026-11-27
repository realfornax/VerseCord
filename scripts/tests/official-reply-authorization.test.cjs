const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function harness({ target = { id: "200", system: true, flags: 8 }, relationships = [], senderGuilds = [], mutualGuilds = [], restricted = [] } = {}) {
    const denied = new Error("Cannot send messages to this user");
    const members = [];
    const imports = {
        typeorm: { In: (value) => value },
        "@spacebar/database": {
            User: {
                findOne: async ({ where }) => (where.id === "100" ? { id: "100", bot: false, system: false, flags: 0 } : target),
            },
            Recipient: { hasSystemRecipient: async () => target.system === true },
            Relationship: { find: async () => relationships },
            Member: {
                find: async ({ where }) => {
                    members.push(where.id);
                    return (where.id === "100" ? senderGuilds : mutualGuilds).map((guild_id) => ({
                        guild_id,
                    }));
                },
            },
            UserSettingsProtos: {
                findOne: async () => ({ userSettings: { privacy: { restrictedGuildIds: restricted } } }),
            },
        },
        "@spacebar/util": { DiscordApiErrors: { CANNOT_MESSAGE_USER: denied } },
        "@spacebar/schemas": {
            ChannelType: { DM: 1, GROUP_DM: 3 },
            RelationshipType: { BLOCKED: 2, FRIEND: 1 },
            UserFlags: { FLAGS: { SYSTEM: 8 } },
        },
    };
    const module = { exports: {} };
    vm.runInNewContext(
        ts.transpileModule(fs.readFileSync("src/api/util/handlers/DirectMessage.ts", "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
        { module, exports: module.exports, require: (name) => imports[name] },
    );
    return {
        check: module.exports.assertCanSendDirectMessage,
        denied,
        members,
    };
}
const channel = (other = "200", recipients) => ({
    type: 1,
    guild_id: null,
    recipients: recipients || [{ user_id: "100" }, { user_id: other }],
});
test("existing Official DMs refuse messages even from friends", async () => {
    const h = harness({ relationships: [{ type: 1 }] });
    await assert.rejects(h.check(channel(), "100"), (error) => error === h.denied);
    assert.equal(h.members.length, 0);
});
test("legacy group DMs with Official refuse messages, and ordinary group DMs still work", async () => {
    const group = { ...channel(), id: "300", type: 3 };
    const h = harness();
    await assert.rejects(h.check(group, "100"), (error) => error === h.denied);
    assert.equal((await harness({ target: { system: false, bot: false } }).check(group, "100")).length, 0);
});
test("other managed identities still refuse direct messages", async () => {
    const h = harness({ target: { id: "201", system: false, bot: true, flags: 8 } });
    await assert.rejects(h.check(channel("201"), "100"), (error) => error === h.denied);
});
test("ordinary username spoof without SYSTEM follows normal DM privacy", async () => {
    const h = harness({
        target: { id: "201", username: "official", system: false, flags: 0, bot: false },
    });
    await assert.rejects(h.check(channel("201"), "100"), (error) => error === h.denied);
});
test("ordinary blocked and no-mutual-guild DMs remain denied", async () => {
    for (const relationships of [[], [{ type: 2 }]]) {
        const h = harness({ target: { id: "201", system: false, bot: false }, relationships });
        await assert.rejects(h.check(channel("201"), "100"), (error) => error === h.denied);
    }
});
test("ordinary mutual-guild privacy still filters restrictions", async () => {
    const h = harness({
        target: { id: "201", system: false, bot: false },
        senderGuilds: ["10", "11"],
        mutualGuilds: ["10", "11"],
        restricted: ["10"],
    });
    assert.deepEqual(Array.from(await h.check(channel("201"), "100")), ["11"]);
    const closed = harness({
        target: { id: "201", system: false, bot: false },
        senderGuilds: ["10"],
        mutualGuilds: ["10"],
        restricted: ["10"],
    });
    await assert.rejects(closed.check(channel("201"), "100"), (error) => error === closed.denied);
});
