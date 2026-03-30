/**
 * Shared CORS headers and OPTIONS handler for API routes.
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function withCors(body: object, status = 200, extra?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders, ...extra },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
