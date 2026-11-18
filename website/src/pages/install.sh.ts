import type { APIRoute } from "astro";
import { installCommand } from "../config/site";
import { installScript } from "../lib/installScript";

const script = installScript(installCommand);

export const GET: APIRoute = () =>
  new Response(script, { headers: { "Content-Type": "text/x-shellscript; charset=utf-8" } });
