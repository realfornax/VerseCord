import { route } from "@spacebar/api/middlewares";
import { Collectibles, Config } from "@spacebar/util";
import { Request, Response, Router } from "express";

const router = Router({ mergeParams: true });

router.get("/", route({}), async (req: Request, res: Response) => {
    res.json({ categories: Config.get().client.shopEnabled === false ? [] : await Collectibles.categories(), collections: [] });
});

export default router;
