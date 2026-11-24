import { route } from "@spacebar/api/middlewares";
import { grantCollectible } from "@spacebar/api/util";
import { Config, DiscordApiErrors } from "@spacebar/util";
import { Request, Response, Router } from "express";
import { HTTPError } from "lambert-server/HTTPError";

const router = Router({ mergeParams: true });

router.put("/", route({}), async (req: Request, res: Response) => {
    if (Config.get().client.shopEnabled === false) throw new HTTPError("The Shop is disabled on this instance", 403);
    const { sku_id } = (req.body ?? {}) as { sku_id?: string };
    if (typeof sku_id !== "string") throw DiscordApiErrors.UNKNOWN_SKU;
    res.json(await grantCollectible(req.user_id, sku_id));
});

export default router;
