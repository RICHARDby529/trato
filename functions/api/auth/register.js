import { hashPassword, signJWT, json, error } from '../../_utils.js';

export async function onRequestPost(context){
  const { request, env } = context;
  
  try {
    const { name, email, phone, password } = await request.json();
    
    // Validation
    if (!name || !email || !password){
      return error('Champs manquants : name, email, password', 400);
    }
    if (typeof name !== 'string' || name.length < 2 || name.length > 100){
      return error('Nom invalide (2 à 100 caractères)', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      return error('Email invalide', 400);
    }
    if (password.length < 8){
      return error('Mot de passe trop court (min 8 caractères)', 400);
    }
    
    // Email déjà pris ?
    const existing = await env.DB
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();
    if (existing){
      return error('Cet email est déjà utilisé', 409);
    }
    
    // Hash du mot de passe
    const passwordHash = await hashPassword(password);
    
    // Insertion
    const result = await env.DB
      .prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
      .bind(name, email.toLowerCase(), phone || null, passwordHash)
      .run();
    
    const userId = result.meta.last_row_id;
    
    // Token JWT
    const token = await signJWT({ userId }, env.JWT_SECRET, 7);
    
    return json({
      success: true,
      token,
      user: {
        id: userId,
        name,
        email: email.toLowerCase()
      }
    }, 201);
    
  } catch (err){
    return error('Erreur serveur : ' + err.message, 500);
  }
}