export async function onRequestGet(context){
  const { env } = context;
  
  try {
    const result = await env.DB
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all();
    
    return new Response(JSON.stringify({
      ok: true,
      message: "D1 connectée avec succès",
      tables: result.results.map(r => r.name)
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err){
    return new Response(JSON.stringify({
      ok: false,
      error: err.message
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}