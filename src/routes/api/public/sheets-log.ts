// Public endpoint: append a signup row to the Konnect "Konnect Live Signups" sheet.
// Non-blocking from the client — failures are tolerated.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  session_id: z.string().min(1).max(200),
  name: z.string().min(1).max(60),
  age: z.union([z.number(), z.null()]).optional(),
  gender: z.string().max(40).nullable().optional(),
  email: z.string().email().max(160),
  mode: z.string().max(80),
  event_type: z.string().max(60).nullable().optional(),
  event_name: z.string().max(80).nullable().optional(),
  interests: z.array(z.string()).max(20).optional().default([]),
  skills: z.string().max(120).nullable().optional(),
  social: z.string().max(160).nullable().optional(),
  ttl_hours: z.number().int().min(1).max(48),
  lat: z.number(),
  lng: z.number(),
  accuracy_m: z.number().nullable().optional(),
  address: z.string().max(300).nullable().optional(),
});

export const Route = createFileRoute("/api/public/sheets-log")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
      POST: async ({ request }) => {
        const cors = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        };
        try {
          const parsed = Schema.safeParse(await request.json());
          if (!parsed.success) {
            return new Response(JSON.stringify({ ok: false, error: "invalid input" }), { status: 400, headers: cors });
          }
          const d = parsed.data;

          const scriptUrl = "https://script.google.com/macros/s/AKfycbzJRvYQBTjsNijZ1pGw4_wL6s8NFRdO4YuHO15M7eWNHtQxmPZ370PylabaZtwKG3TM/exec";

          const r = await fetch(scriptUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              session_id: d.session_id,
              name: d.name,
              age: d.age ?? "",
              gender: d.gender ?? "",
              email: d.email,
              mode: d.mode,
              event_type: d.event_type ?? "",
              event_name: d.event_name ?? "",
              interests: (d.interests ?? []).join(", "),
              skills: d.skills ?? "",
              social: d.social ?? "",
              ttl_hours: d.ttl_hours,
              lat: d.lat,
              lng: d.lng,
              accuracy_m: d.accuracy_m ?? "",
              address: d.address ?? "",
            }),
          });

          if (!r.ok) {
            const t = await r.text();
            return new Response(JSON.stringify({ ok: false, error: `AppsScript ${r.status}: ${t.slice(0, 200)}` }), { status: 502, headers: cors });
          }

          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: e?.message ?? "error" }), { status: 500, headers: cors });
        }
      },
    },
  },
});
