/**
 * INDUSTRIAL TORIMEX - Lógica del Catálogo Público
 * Manejo de renderizado reactivo, filtros, búsqueda y modales
 */

document.addEventListener("DOMContentLoaded", () => {
    // Referencias al DOM
    const catalogGrid = document.getElementById("catalogGrid");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const searchInput = document.getElementById("searchInput");
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const navMenu = document.getElementById("navMenu");
    
    // Referencias al Modal de Detalles
    const detailModal = document.getElementById("detailModal");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalImage = document.getElementById("modalImage");
    const modalBadge = document.getElementById("modalBadge");
    const modalTitle = document.getElementById("modalTitle");
    const modalDesc = document.getElementById("modalDesc");
    const modalSpecsList = document.getElementById("modalSpecsList");
    const modalWhatsAppBtn = document.getElementById("modalWhatsAppBtn");
    const modalMailBtn = document.getElementById("modalMailBtn");

    let currentCategory = "todos";
    let searchQuery = "";
    const WHATSAPP_PHONE = "5214424470567";
    const EMAIL_CORP = "atoriz485@gmail.com";

    // 1. Renderizado del Catálogo
    function renderCatalog() {
        const allItems = getCatalogItems();

        // Filtrado por categoría y búsqueda
        const filtered = allItems.filter(item => {
            // Solo mostrar items activos
            if (item.active === false) return false;

            // Filtro por categoría
            const matchesCategory = (currentCategory === "todos") || 
                                    (item.category === currentCategory) || 
                                    (currentCategory === "productos" && item.type === "producto") ||
                                    (currentCategory === "servicios" && item.type === "servicio");

            // Filtro por texto de búsqueda
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = query === "" ||
                                  item.name.toLowerCase().includes(query) ||
                                  item.shortDesc.toLowerCase().includes(query) ||
                                  (item.categoryLabel && item.categoryLabel.toLowerCase().includes(query));

            return matchesCategory && matchesSearch;
        });

        // Si no hay resultados
        if (filtered.length === 0) {
            catalogGrid.innerHTML = `
                <div class="catalog-empty">
                    <h3>No se encontraron productos o servicios</h3>
                    <p>Intenta ajustar tus términos de búsqueda o selecciona otra categoría.</p>
                </div>
            `;
            return;
        }

        // Construir tarjetas
        catalogGrid.innerHTML = filtered.map(item => {
            const isService = item.type === "servicio";
            const typeLabel = isService ? "Servicio" : "Producto";
            const defaultImg = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";
            const imgSrc = item.imageUrl || defaultImg;

            // Mensaje automático personalizado por producto
            const autoMsg = (item.whatsappText && item.whatsappText.trim()) 
                ? item.whatsappText 
                : buildAutoContactMessage(item.name);
            const waLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(autoMsg)}`;

            // Vista previa de especificaciones (primeras 2)
            const specsChips = (item.specs && item.specs.length > 0) 
                ? item.specs.slice(0, 2).map(s => `<span class="specs-chip">${escapeHtml(s)}</span>`).join("")
                : `<span class="specs-chip">Calidad Industrial Garantizada</span>`;

            return `
                <article class="catalog-card" data-id="${item.id}">
                    <div class="card-img-wrap">
                        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='${defaultImg}'">
                        <span class="card-badge">${escapeHtml(item.categoryLabel || "Industrial")}</span>
                        <span class="card-type-tag">${typeLabel}</span>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${escapeHtml(item.name)}</h3>
                        <p class="card-desc">${escapeHtml(item.shortDesc)}</p>
                        
                        <div class="card-specs-preview">
                            <div class="specs-chip-list">
                                ${specsChips}
                            </div>
                        </div>

                        <div class="card-actions">
                            <button class="btn-details" onclick="openProductModal('${item.id}')" title="Ver detalles técnicos">
                                Ver Ficha
                            </button>
                            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-quote" title="Contactar sobre este producto">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/></svg>
                                Contacto
                            </a>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    // 2. Controladores de Filtros de Categoría
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.dataset.category || "todos";
            renderCatalog();
        });
    });

    // 3. Buscador en tiempo real
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderCatalog();
        });
    }

    // 4. Modal de Ficha Técnica Detallada
    window.openProductModal = function(itemId) {
        const allItems = getCatalogItems();
        const item = allItems.find(i => i.id === itemId);
        if (!item) return;

        const defaultImg = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";
        modalImage.src = item.imageUrl || defaultImg;
        modalImage.alt = item.name;
        modalBadge.textContent = item.categoryLabel || (item.type === "servicio" ? "Servicio" : "Producto");
        modalTitle.textContent = item.name;
        modalDesc.textContent = item.fullDesc || item.shortDesc;

        // Lista de especificaciones técnicas
        if (item.specs && item.specs.length > 0) {
            modalSpecsList.innerHTML = item.specs.map(spec => `<li>${escapeHtml(spec)}</li>`).join("");
        } else {
            modalSpecsList.innerHTML = "<li>Especificaciones técnicas disponibles bajo cotización.</li>";
        }

        // Mensaje automatizado específico de este producto
        const autoMsg = (item.whatsappText && item.whatsappText.trim()) 
            ? item.whatsappText 
            : buildAutoContactMessage(item.name);
        
        // Enlace WhatsApp automatizado
        modalWhatsAppBtn.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(autoMsg)}`;

        // Enlace Correo automatizado
        if (modalMailBtn) {
            const mailSubject = encodeURIComponent(`Consulta: ${item.name}`);
            const mailBody = encodeURIComponent(autoMsg);
            modalMailBtn.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL_CORP}&su=${mailSubject}&body=${mailBody}`;
        }

        detailModal.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    function closeModal() {
        detailModal.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", closeModal);
    }

    if (detailModal) {
        detailModal.addEventListener("click", (e) => {
            if (e.target === detailModal) {
                closeModal();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && detailModal && detailModal.classList.contains("active")) {
            closeModal();
        }
    });

    // 5. Menú Móvil
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("open");
        });

        // Cerrar menú al hacer click en enlace
        navMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("open");
            });
        });
    }

    // 6. Formulario de Contacto
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("contactName").value.trim();
            const email = document.getElementById("contactEmail").value.trim();
            const topic = document.getElementById("contactTopic").value;
            const message = document.getElementById("contactMessage").value.trim();

            const autoMsg = buildAutoContactMessage(topic);
            const fullMessage = `${autoMsg}\n\n*Datos de contacto:*\n*Nombre / Empresa:* ${name}\n*Correo:* ${email}\n*Detalles adicionales:* ${message}`;
            
            window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(fullMessage)}`, "_blank");

            contactForm.reset();
            alert("¡Gracias por su mensaje! Lo redirigimos a nuestro WhatsApp corporativo para atención inmediata.");
        });
    }

    // 7. Escuchar actualizaciones desde el panel de administración
    window.addEventListener("torimex_catalog_updated", () => {
        renderCatalog();
    });

    // Render inicial
    renderCatalog();
});

// Función de escape para seguridad en renderizado HTML
function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
