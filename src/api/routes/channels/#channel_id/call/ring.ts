import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { DiscordApiErrors } from "@spacebar/util";
import { PrivateCalls, Recipient } from "@spacebar/database";
import { assertRecipient, ringRecipients } from "./index";

const router: Router = Router({ mergeParams: true });

router.post("/", route({ responses: { 204: {}, 404: {} } }), async (req: Request, res: Response) => {
    await assertRecipient(req);
    if (await Recipient.hasSystemRecipient(req.params.channel_id as string, req.user_id)) throw DiscordApiErrors.CANNOT_MESSAGE_USER;
    const recipients = ringRecipients(req);
    await PrivateCalls.ring(req.params.channel_id as string, req.user_id, recipients);
    res.sendStatus(204);
});

export default router;
