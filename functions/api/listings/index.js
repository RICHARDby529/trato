import { getUserId, json, error } from '../../_utils.js';

// GET /api/listings → tous les articles (public)
// POST /api/listings → créer un article (protégé)

export async function onRequestGet(context){
  const { env } = context;

  try {
    const listings = await env.DB
      .prepare(`
        SELECT 
          l.id, l.title, l.description, l.price, l.category, l.city, l.status, l.created_at,
          l.user_id,
          u.name AS seller_name,
          (SELECT json_group_array(url) FROM listing_images WHERE listing_id = l.id) AS images
        FROM listings l
        JOIN users u ON u.id = l.user_id
        WHERE l.status = 'active'
        ORDER BY l.created_at DESC
        LIMIT 50
      `)
      .all();

    return json({ success: true, listings: listings.results });

  } catch (err){
    return error('Erreur : ' + err.message, 500);
  }
}

export async function onRequestPost(context){
  const { request, env } = context;

  // Vérifier l'authentification
  const userId = await getUserId(request, env);
  if (!userId){
    return error('Non authentifié', 401);
  }

  try {
    const body = await request.json();
    const { title, description, price, category, city, images } = body;

    // Validations
    if (!title || typeof title !== 'string' || title.length < 3){
      return error('Titre invalide (min 3 caractères)', 400);
    }
    if (title.length > 100){
      return error('Titre trop long (max 100)', 400);
    }
    if (typeof price !== 'number' || price <= 0 || price > 1000000){
      return error('Prix invalide', 400);
    }

    // Insérer l'article
    const result = await env.DB
      .prepare(`
        INSERT INTO listings (user_id, title, description, price, category, city)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        title.trim(),
        description || '',
        price,
        category || null,
        city || null
      )
      .run();

    const listingId = result.meta.last_row_id;

    // Insérer les images
    if (Array.isArray(images) && images.length){
      for (let i = 0; i < images.length; i++){
        await env.DB
          .prepare('INSERT INTO listing_images (listing_id, url, position) VALUES (?, ?, ?)')
          .bind(listingId, images[i], i)
          .run();
      }
    }

    return json({ success: true, id: listingId }, 201);

  } catch (err){
    return error('Erreur : ' + err.message, 500);
  }
}