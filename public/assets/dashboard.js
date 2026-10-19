/* ============================================================
   1. CHARGER LES INFOS UTILISATEUR
   ============================================================ */
(function(){
  if (typeof API === "undefined") return;

  var user = API.getUser();
  if (!user) return;

  var fullName = user.name || "Usuario";
  var initials = fullName.split(" ").map(function(n){ return n[0] || ""; }).join("").slice(0,2).toUpperCase();

  document.querySelectorAll(".avatar, .profile-avatar").forEach(function(el){
    el.textContent = initials;
  });

  var userName = document.getElementById("userName");
  var userEmail = document.getElementById("userEmail");
  var profileName = document.getElementById("profileName");
  var profileEmail = document.getElementById("profileEmail");

  if (userName) userName.textContent = fullName;
  if (userEmail) userEmail.textContent = user.email || "";
  if (profileName) profileName.textContent = fullName;
  if (profileEmail) profileEmail.textContent = user.email || "";
})();

/* ============================================================
   2. TOAST
   ============================================================ */
var toastEl = document.getElementById("toast");
var toastTimer;
function showToast(msg, isError){
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.toggle("error", !!isError);
  toastEl.classList.add("show");
  toastTimer = setTimeout(function(){ toastEl.classList.remove("show"); }, 3000);
}

/* ============================================================
   3. NAVIGATION PAR HASH
   ============================================================ */
var VALID_PAGES = ["dashboard","articulos","publicar","mensajes","favoritos","perfil","ajustes"];

function gotoPage(page){
  if (VALID_PAGES.indexOf(page) === -1) page = "dashboard";

  document.querySelectorAll(".page").forEach(function(p){
    p.classList.toggle("active", p.id === "page-" + page);
  });
  document.querySelectorAll(".nav-link").forEach(function(a){
    a.classList.toggle("active", a.dataset.nav === page);
  });
  document.querySelectorAll(".tabbar a").forEach(function(a){
    a.classList.toggle("active", a.dataset.nav === page);
  });
  window.scrollTo({top:0, behavior:"auto"});

  // Charger les articles selon la page
  if (page === "articulos") loadMyItems();
  if (page === "dashboard") loadRecentItems();
}

function handleHash(){
  var hash = (location.hash || "#dashboard").replace("#","");
  gotoPage(hash);
}

window.addEventListener("hashchange", handleHash);
window.addEventListener("DOMContentLoaded", handleHash);

document.querySelectorAll("[data-nav]").forEach(function(a){
  a.addEventListener("click", function(e){
    var target = a.dataset.nav;
    if (VALID_PAGES.indexOf(target) !== -1){
      e.preventDefault();
      if (location.hash === "#" + target){
        handleHash();
      } else {
        location.hash = "#" + target;
      }
    }
  });
});

/* ============================================================
   4. MENU AVATAR
   ============================================================ */
var avatarBtn = document.getElementById("avatarBtn");
var avatarMenu = document.getElementById("avatarMenu");

if (avatarBtn && avatarMenu){
  avatarBtn.addEventListener("click", function(e){
    e.stopPropagation();
    avatarMenu.classList.toggle("open");
  });
  avatarBtn.addEventListener("keydown", function(e){
    if (e.key === "Enter" || e.key === " "){
      e.preventDefault();
      avatarMenu.classList.toggle("open");
    }
  });
  document.addEventListener("click", function(){ avatarMenu.classList.remove("open"); });
  avatarMenu.addEventListener("click", function(e){ e.stopPropagation(); });
}

/* ============================================================
   5. DÉCONNEXION
   ============================================================ */
function handleLogout(e){
  e.preventDefault();
  if (typeof API !== "undefined") API.logout();
  window.location.href = "/login.html";
}

var logoutBtn = document.getElementById("logoutBtn");
var logoutBtnSidebar = document.getElementById("logoutBtnSidebar");
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
if (logoutBtnSidebar) logoutBtnSidebar.addEventListener("click", handleLogout);

/* ============================================================
   6. TOGGLES
   ============================================================ */
document.querySelectorAll(".setting-toggle").forEach(function(tg){
  function toggle(){
    tg.classList.toggle("on");
    tg.setAttribute("aria-checked", tg.classList.contains("on") ? "true" : "false");
  }
  tg.addEventListener("click", toggle);
  tg.addEventListener("keydown", function(e){
    if (e.key === "Enter" || e.key === " "){ e.preventDefault(); toggle(); }
  });
});

/* ============================================================
   7. UPLOAD D'IMAGES
   ============================================================ */
var selectedImages = [];
var MAX_IMAGES = 20;
var MAX_SIZE = 5 * 1024 * 1024; // 5 MB

var uploadZone = document.getElementById("uploadZone");
var imageInput = document.getElementById("imageInput");
var previewGrid = document.getElementById("imagePreviewGrid");

function renderPreviews(){
  if (!previewGrid) return;
  previewGrid.innerHTML = "";

  selectedImages.forEach(function(file, index){
    var url = URL.createObjectURL(file);
    var div = document.createElement("div");
    div.className = "image-preview-item";
    div.innerHTML = '<img src="' + url + '" alt="Preview">' +
                    '<button type="button" class="image-preview-remove" data-index="' + index + '">×</button>';
    previewGrid.appendChild(div);
  });

  previewGrid.querySelectorAll(".image-preview-remove").forEach(function(btn){
    btn.addEventListener("click", function(e){
      e.preventDefault();
      var idx = parseInt(btn.dataset.index, 10);
      selectedImages.splice(idx, 1);
      renderPreviews();
    });
  });
}

function handleFiles(files){
  var filesArr = Array.from(files);

  if (selectedImages.length + filesArr.length > MAX_IMAGES){
    showToast("Máximo " + MAX_IMAGES + " imágenes por artículo", true);
    return;
  }

  var added = 0;

  filesArr.forEach(function(file){
    if (!file.type.startsWith("image/")){
      return;
    }
    if (file.size > MAX_SIZE){
      showToast("La imagen " + file.name + " es demasiado grande (máx 5 MB)", true);
      return;
    }
    selectedImages.push(file);
    added++;
  });

  if (added > 0){
    showToast(added + " imagen(es) añadida(s)");
  }

  renderPreviews();
}

if (imageInput){
  imageInput.addEventListener("change", function(e){
    handleFiles(e.target.files);
    imageInput.value = "";
  });
}

if (uploadZone){
  uploadZone.addEventListener("dragover", function(e){
    e.preventDefault();
    uploadZone.classList.add("dragover");
  });
  uploadZone.addEventListener("dragleave", function(){
    uploadZone.classList.remove("dragover");
  });
  uploadZone.addEventListener("drop", function(e){
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    if (e.dataTransfer.files.length){
      handleFiles(e.dataTransfer.files);
    }
  });
}

/* ============================================================
   8. SÉLECTION VILLE "OTRA"
   ============================================================ */
var citySelect = document.getElementById("citySelect");
var cityOtherInput = document.getElementById("cityOtherInput");

if (citySelect && cityOtherInput){
  citySelect.addEventListener("change", function(){
    if (citySelect.value === "__other__"){
      cityOtherInput.style.display = "block";
      cityOtherInput.focus();
    } else {
      cityOtherInput.style.display = "none";
      cityOtherInput.value = "";
    }
  });
}

/* ============================================================
   9. SOUMISSION DU FORMULAIRE DE PUBLICATION
   ============================================================ */
var publishForm = document.getElementById("publishForm");
var submitBtn = document.getElementById("submitBtn");

if (publishForm && submitBtn){
  publishForm.addEventListener("submit", async function(e){
    e.preventDefault();

    var title = document.getElementById("titleInput").value.trim();
    var description = document.getElementById("descriptionInput").value.trim();
    var price = parseFloat(document.getElementById("priceInput").value);
    var category = document.getElementById("categoryInput").value;
    var city = citySelect.value === "__other__" ? cityOtherInput.value.trim() : citySelect.value;

    if (selectedImages.length === 0){
      return showToast("Añade al menos una foto del artículo", true);
    }
    if (title.length < 3){
      return showToast("El título debe tener al menos 3 caracteres", true);
    }
    if (title.length > 100){
      return showToast("El título es demasiado largo (máx 100)", true);
    }
    if (!price || price <= 0){
      return showToast("Introduce un precio válido", true);
    }
    if (price > 1000000){
      return showToast("El precio es demasiado alto", true);
    }
    if (!city){
      return showToast("Selecciona o escribe tu ciudad", true);
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span><span>Subiendo imágenes…</span>';

    try {
      var uploadResult = await API.uploadImages(selectedImages);

      submitBtn.innerHTML = '<span class="spinner"></span><span>Publicando artículo…</span>';

      await API.createListing({
        title: title,
        description: description,
        price: price,
        category: category || null,
        city: city,
        images: uploadResult.urls
      });

      showToast("¡Artículo publicado con éxito!");

      publishForm.reset();
      selectedImages = [];
      renderPreviews();
      if (cityOtherInput) {
        cityOtherInput.style.display = "none";
        cityOtherInput.value = "";
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Publicar artículo</span><span aria-hidden="true">→</span>';

      setTimeout(function(){
        location.hash = "#articulos";
      }, 800);

    } catch (err){
      showToast(err.message || "Error al publicar", true);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Publicar artículo</span><span aria-hidden="true">→</span>';
    }
  });
}

/* ============================================================
   10. UTILS — extraire proprement les URLs d'images
   ============================================================ */
function extractImageUrls(images){
  if (!images) return [];

  // Cas 1 : c'est une chaîne JSON
  if (typeof images === "string"){
    try {
      var parsed = JSON.parse(images);
      // Si après parsing c'est encore une chaîne (double encodage)
      if (typeof parsed === "string"){
        try { parsed = JSON.parse(parsed); } catch (e){}
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch (e){
      return [];
    }
  }

  // Cas 2 : c'est déjà un tableau
  if (Array.isArray(images)){
    // Vérifier si c'est un tableau à un seul élément qui est une chaîne JSON
    if (images.length === 1 && typeof images[0] === "string" && images[0].startsWith("[")){
      try {
        var inner = JSON.parse(images[0]);
        return Array.isArray(inner) ? inner : [];
      } catch (e){}
    }
    return images;
  }

  return [];
}

/* ============================================================
   11. CHARGER MES ARTICLES
   ============================================================ */
async function loadMyItems(){
  var emptyEl = document.getElementById("myItemsEmpty");
  var gridEl = document.getElementById("myItemsGrid");
  if (!gridEl || !emptyEl) return;

  try {
    var data = await API.request("/api/listings?mine=1");
    var listings = data.listings || [];

    if (listings.length === 0){
      emptyEl.style.display = "block";
      gridEl.style.display = "none";
      return;
    }

    emptyEl.style.display = "none";
    gridEl.style.display = "grid";
    gridEl.innerHTML = "";

    listings.forEach(function(item){
      var urls = extractImageUrls(item.images);
      var imgUrl = urls.length > 0 ? urls[0] : "";
      var price = parseFloat(item.price).toLocaleString("es-MX");
      var card = document.createElement("div");
      card.className = "article-card";
      card.innerHTML =
        (imgUrl ? '<img class="article-card-img" src="' + imgUrl + '" alt="">' : '') +
        '<div class="article-card-body">' +
          '<h3>' + escapeHtml(item.title) + '</h3>' +
          '<p class="article-card-price">$' + price + ' MXN</p>' +
          '<div class="article-card-meta">' +
            (item.category ? '<span class="badge">' + escapeHtml(item.category) + '</span>' : '') +
            '<span>📍 ' + escapeHtml(item.city || "") + '</span>' +
          '</div>' +
        '</div>';
      gridEl.appendChild(card);
    });

    var statItems = document.getElementById("statItems");
    if (statItems) statItems.textContent = listings.length;

  } catch (err){
    console.error("loadMyItems:", err);
  }
}

/* ============================================================
   12. CHARGER ARTICLES RÉCENTS (dashboard)
   ============================================================ */
async function loadRecentItems(){
  var emptyEl = document.getElementById("recentItemsEmpty");
  var gridEl = document.getElementById("recentItemsGrid");
  if (!gridEl || !emptyEl) return;

  try {
    var data = await API.request("/api/listings?mine=1");
    var listings = (data.listings || []).slice(0, 4);

    if (listings.length === 0){
      emptyEl.style.display = "block";
      gridEl.style.display = "none";
      return;
    }

    emptyEl.style.display = "none";
    gridEl.style.display = "grid";
    gridEl.innerHTML = "";

    listings.forEach(function(item){
      var urls = extractImageUrls(item.images);
      var imgUrl = urls.length > 0 ? urls[0] : "";
      var price = parseFloat(item.price).toLocaleString("es-MX");
      var card = document.createElement("div");
      card.className = "article-card";
      card.innerHTML =
        (imgUrl ? '<img class="article-card-img" src="' + imgUrl + '" alt="">' : '') +
        '<div class="article-card-body">' +
          '<h3>' + escapeHtml(item.title) + '</h3>' +
          '<p class="article-card-price">$' + price + ' MXN</p>' +
        '</div>';
      gridEl.appendChild(card);
    });

    var statItems = document.getElementById("statItems");
    if (statItems) statItems.textContent = listings.length;

  } catch (err){
    console.error("loadRecentItems:", err);
  }
}

/* ============================================================
   13. UTILS — échapper HTML
   ============================================================ */
function escapeHtml(str){
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function(c){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
  });
}

/* ============================================================
   14. INIT
   ============================================================ */
window.addEventListener("load", function(){
  loadRecentItems();
});