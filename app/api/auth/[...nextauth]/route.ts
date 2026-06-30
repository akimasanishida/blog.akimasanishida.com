// next-auth v5 の API ルート。/api/auth/* （session・csrf・callback/credentials 等）を
// マウントする。Credentials のサインインは /api/auth/callback/credentials を叩くため必須。
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
