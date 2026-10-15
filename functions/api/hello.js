export async function onRequestGet(){
  return new Response(JSON.stringify({ 
    message: 'TRATO API opérationnelle',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}