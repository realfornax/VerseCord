import { route } from "@spacebar/api/middlewares";
import { Request, Response, Router } from "express";
import { Collectibles, Config } from "@spacebar/util";

const router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        responses: {
            200: {
                body: "CollectiblesShopResponse",
            },
            204: {},
        },
    }),
    async (req: Request, res: Response) => {
        if (Config.get().client.shopEnabled === false) return res.sendStatus(204);
        res.json(await Collectibles.shop());
    },
);

export default router;
