import { verifyPassword, signJWT, json, error } from '../../_utils.js';

export async function onRequestPost(context){
  const { request, env } = context;
  
  try {
    const { email, password } = await request.json();
    
    if (!email || !password){
      return error('Email et mot de passe requis', 400);
    }
    
    // Chercher l'utilisateur
    const user = await env.DB
      .prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();
    
    if (!user){
      return error('Email ou mot de passe incorrect', 401);
    }
    
    // Vérifier le mot de passe
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid){
      return error('Email ou mot de passe incorrect', 401);
    }
    
    // Token JWT
    const token = await signJWT({ userId: user.id }, env.JWT_SECRET, 7);
    
    return json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (err){
    return error('Erreur serveur : ' + err.message, 500);
  }
}