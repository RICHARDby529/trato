import { getUserId, json, error } from '../_utils.js';

export async function onRequestPost(context){
  const { request, env } = context;

  // Vérifier que l'utilisateur est connecté
  const userId = await getUserId(request, env);
  if (!userId){
    return error('Non authentifié', 401);
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files.length){
      return error('Aucune image envoyée', 400);
    }
    if (files.length > 20){
      return error('Maximum 20 images par article', 400);
    }

    const urls = [];

    for (const file of files){
      // Vérifier le type MIME
      if (!file.type.startsWith('image/')){
        return error('Format non supporté (images uniquement)', 400);
      }
      // Vérifier la taille (max 5 MB)
      if (file.size > 5 * 1024 * 1024){
        return error('Fichier trop lourd (max 5 MB)', 400);
      }

      // Générer un nom unique
      const ext = file.name.split('.').pop().toLowerCase();
      const random = Math.random().toString(36).substring(2, 10);
      const key = `listings/${userId}/${Date.now()}-${random}.${ext}`;

      // Uploader dans R2
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      // Construire l'URL publique
      urls.push(`${env.R2_PUBLIC_URL}/${key}`);
    }

    return json({ success: true, urls });

  } catch (err){
    return error('Erreur upload : ' + err.message, 500);
  }
}