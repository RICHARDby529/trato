export async function onRequestGet(context){
  const { env } = context;
  
  try {
    const result = await env.DB
      .prepare("SELECT id, name, email, phone, created_at FROM users ORDER BY id DESC")
      .all();
    
    return new Response(JSON.stringify({
      ok: true,
      count: result.results.length,
      users: result.results
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