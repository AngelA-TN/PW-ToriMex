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

    let currentProductItem = null;

    // 4. Modal de Ficha Técnica Detallada
    window.openProductModal = function(itemId) {
        const allItems = getCatalogItems();
        const item = allItems.find(i => i.id === itemId);
        if (!item) return;
        currentProductItem = item;

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

        detailModal.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    // Botón de Correo en el Modal de Ficha Técnica (Abre selector Gmail / Outlook)
    if (modalMailBtn) {
        modalMailBtn.addEventListener("click", () => {
            if (!currentProductItem) return;
            const autoMsg = (currentProductItem.whatsappText && currentProductItem.whatsappText.trim()) 
                ? currentProductItem.whatsappText 
                : buildAutoContactMessage(currentProductItem.name);

            openEmailClientChoice({
                to: EMAIL_CORP,
                subject: `Consulta sobre: ${currentProductItem.name}`,
                body: autoMsg
            });
        });
    }

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
        if (e.key === "Escape") {
            if (emailChoiceModal && emailChoiceModal.classList.contains("active")) {
                closeEmailChoiceModal();
            } else if (detailModal && detailModal.classList.contains("active")) {
                closeModal();
            }
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

    // ==========================================================================
    // SELECTOR DE CORREO: GMAIL / OUTLOOK / APP PREDETERMINADA
    // ==========================================================================
    let currentEmailData = {
        to: EMAIL_CORP,
        subject: "Solicitud de Información - Industrial ToriMex",
        body: "Hola, buen día. Me gustaría obtener más información sobre. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!"
    };

    const emailChoiceModal = document.getElementById("emailChoiceModal");
    const emailChoiceCloseBtn = document.getElementById("emailChoiceCloseBtn");
    const choiceGmailBtn = document.getElementById("choiceGmailBtn");
    const choiceOutlookBtn = document.getElementById("choiceOutlookBtn");
    const choiceDefaultAppBtn = document.getElementById("choiceDefaultAppBtn");

    function openEmailClientChoice(data) {
        if (data) {
            currentEmailData = {
                to: data.to || EMAIL_CORP,
                subject: data.subject || "Solicitud de Información - Industrial ToriMex",
                body: data.body || "Hola, buen día. Me gustaría obtener más información sobre. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!"
            };
        }
        if (emailChoiceModal) {
            emailChoiceModal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    function closeEmailChoiceModal() {
        if (emailChoiceModal) {
            emailChoiceModal.classList.remove("active");
            if (!detailModal || !detailModal.classList.contains("active")) {
                document.body.style.overflow = "";
            }
        }
    }

    if (choiceGmailBtn) {
        choiceGmailBtn.addEventListener("click", () => {
            const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(currentEmailData.to)}&su=${encodeURIComponent(currentEmailData.subject)}&body=${encodeURIComponent(currentEmailData.body)}`;
            window.open(url, "_blank");
            closeEmailChoiceModal();
        });
    }

    if (choiceOutlookBtn) {
        choiceOutlookBtn.addEventListener("click", () => {
            const url = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(currentEmailData.to)}&subject=${encodeURIComponent(currentEmailData.subject)}&body=${encodeURIComponent(currentEmailData.body)}`;
            window.open(url, "_blank");
            closeEmailChoiceModal();
        });
    }

    if (choiceDefaultAppBtn) {
        choiceDefaultAppBtn.addEventListener("click", () => {
            const url = `mailto:${encodeURIComponent(currentEmailData.to)}?subject=${encodeURIComponent(currentEmailData.subject)}&body=${encodeURIComponent(currentEmailData.body)}`;
            window.location.href = url;
            closeEmailChoiceModal();
        });
    }

    if (emailChoiceCloseBtn) {
        emailChoiceCloseBtn.addEventListener("click", closeEmailChoiceModal);
    }

    if (emailChoiceModal) {
        emailChoiceModal.addEventListener("click", (e) => {
            if (e.target === emailChoiceModal) {
                closeEmailChoiceModal();
            }
        });
    }

    // Conectar botones del panel izquierdo y enlaces
    const btnContactEmailGeneral = document.getElementById("btnContactEmailGeneral");
    if (btnContactEmailGeneral) {
        btnContactEmailGeneral.addEventListener("click", () => {
            openEmailClientChoice({
                to: EMAIL_CORP,
                subject: "Solicitud de Información General - Industrial ToriMex",
                body: "Hola, buen día. Me gustaría obtener más información sobre. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!"
            });
        });
    }

    const linkCorporateMail = document.getElementById("linkCorporateMail");
    if (linkCorporateMail) {
        linkCorporateMail.addEventListener("click", (e) => {
            e.preventDefault();
            openEmailClientChoice({
                to: EMAIL_CORP,
                subject: "Contacto Corporativo - Industrial ToriMex",
                body: "Hola, buen día. Me gustaría obtener más información sobre. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!"
            });
        });
    }

    const linkFooterMail = document.getElementById("linkFooterMail");
    if (linkFooterMail) {
        linkFooterMail.addEventListener("click", (e) => {
            e.preventDefault();
            openEmailClientChoice({
                to: EMAIL_CORP,
                subject: "Contacto - Industrial ToriMex",
                body: "Hola, buen día. Me gustaría obtener más información sobre. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!"
            });
        });
    }

    // ==========================================================================
    // FORMULARIO DE COTIZACIÓN (WHATSAPP Y CORREO GMAIL/OUTLOOK)
    // ==========================================================================
    const contactForm = document.getElementById("contactForm");
    const btnSubmitWhatsApp = document.getElementById("btnSubmitWhatsApp");
    const btnSubmitEmail = document.getElementById("btnSubmitEmail");

    function getFormData() {
        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return null;
        }

        return {
            name: document.getElementById("contactName").value.trim(),
            email: document.getElementById("contactEmail").value.trim(),
            topic: document.getElementById("contactTopic").value,
            message: document.getElementById("contactMessage").value.trim()
        };
    }

    if (btnSubmitWhatsApp) {
        btnSubmitWhatsApp.addEventListener("click", () => {
            const data = getFormData();
            if (!data) return;

            const autoMsg = buildAutoContactMessage(data.topic);
            const fullMessage = `${autoMsg}\n\n*Datos de contacto:*\n*Nombre / Empresa:* ${data.name}\n*Correo:* ${data.email}\n*Detalles adicionales:* ${data.message}`;
            
            window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(fullMessage)}`, "_blank");
            contactForm.reset();
        });
    }

    if (btnSubmitEmail) {
        btnSubmitEmail.addEventListener("click", () => {
            const data = getFormData();
            if (!data) return;

            const autoMsg = buildAutoContactMessage(data.topic);
            const subject = `Solicitud de Información: ${data.topic} - ${data.name}`;
            const body = `${autoMsg}\n\nNombre / Empresa: ${data.name}\nCorreo de contacto: ${data.email}\nDetalles del requerimiento:\n${data.message}`;

            openEmailClientChoice({
                to: EMAIL_CORP,
                subject: subject,
                body: body
            });
            contactForm.reset();
        });
    }

    // 7. Escuchar actualizaciones desde el panel de administración
    window.addEventListener("torimex_catalog_updated", () => {
        renderCatalog();
    });

    // Render inicial local
    renderCatalog();

    // Sincronizar con Google Sheets en segundo plano al cargar
    if (typeof syncCatalogFromCloud === "function") {
        syncCatalogFromCloud().then(cloudItems => {
            if (cloudItems) {
                renderCatalog();
            }
        });
    }
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
