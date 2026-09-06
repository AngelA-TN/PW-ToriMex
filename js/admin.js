/**
 * INDUSTRIAL TORIMEX - Lógica del Panel Administrativo
 * Manejo de autenticación con hash SHA-256, protección contra fuerza bruta,
 * y operaciones CRUD completas con soporte de imágenes.
 */

const SALT = "TORIMEX_SECURE_SALT_2026_";
const DEFAULT_PASSWORD = "ToriMex2026!";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueo

// Generar hash SHA-256 usando Web Crypto API
async function sha256(str) {
    const buffer = new TextEncoder().encode(SALT + str);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Inicializar hash por defecto si no existe
async function initDefaultPassword() {
    if (!localStorage.getItem("torimex_admin_pwd_hash")) {
        const defaultHash = await sha256(DEFAULT_PASSWORD);
        localStorage.setItem("torimex_admin_pwd_hash", defaultHash);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await initDefaultPassword();

    // Referencias del DOM - Autenticación
    const loginScreen = document.getElementById("loginScreen");
    const adminLayout = document.getElementById("adminLayout");
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("adminPasswordInput");
    const togglePwdBtn = document.getElementById("togglePwdBtn");
    const lockoutAlert = document.getElementById("lockoutAlert");
    const logoutBtn = document.getElementById("logoutBtn");

    // Referencias del DOM - Catálogo y Estadísticas
    const catalogTableBody = document.getElementById("catalogTableBody");
    const statTotal = document.getElementById("statTotal");
    const statProducts = document.getElementById("statProducts");
    const statServices = document.getElementById("statServices");
    const filterType = document.getElementById("filterType");
    const searchInput = document.getElementById("searchAdmin");

    // Referencias del DOM - Modales
    const itemModal = document.getElementById("itemModal");
    const itemForm = document.getElementById("itemForm");
    const modalTitle = document.getElementById("modalTitle");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const cancelItemBtn = document.getElementById("cancelItemBtn");
    const newItemBtn = document.getElementById("newItemBtn");
    
    // Inputs del Modal de Producto/Servicio
    const itemIdInput = document.getElementById("itemId");
    const itemTypeInput = document.getElementById("itemType");
    const itemNameInput = document.getElementById("itemName");
    const itemCategoryInput = document.getElementById("itemCategory");
    const itemShortDescInput = document.getElementById("itemShortDesc");
    const itemFullDescInput = document.getElementById("itemFullDesc");
    const itemSpecsInput = document.getElementById("itemSpecs");
    const itemImageFileInput = document.getElementById("itemImageFile");
    const itemImageUrlInput = document.getElementById("itemImageUrl");
    const imagePreview = document.getElementById("imagePreview");
    const itemWhatsappInput = document.getElementById("itemWhatsapp");
    const itemActiveInput = document.getElementById("itemActive");

    // Modal de Cambio de Contraseña
    const changePwdModal = document.getElementById("changePwdModal");
    const openChangePwdBtn = document.getElementById("openChangePwdBtn");
    const closePwdModalBtn = document.getElementById("closePwdModalBtn");
    const cancelPwdBtn = document.getElementById("cancelPwdBtn");
    const changePwdForm = document.getElementById("changePwdForm");

    // Botones de Importación y Exportación
    const exportBtn = document.getElementById("exportBtn");
    const importInput = document.getElementById("importInput");

    let editingImageBase64 = "";

    // 1. Verificación de Bloqueo por Fuerza Bruta
    function checkLockout() {
        const lockoutUntil = parseInt(localStorage.getItem("torimex_lockout_until") || "0", 10);
        const now = Date.now();
        if (now < lockoutUntil) {
            const minutesLeft = Math.ceil((lockoutUntil - now) / 60000);
            lockoutAlert.style.display = "block";
            lockoutAlert.textContent = `Demasiados intentos fallidos. Panel bloqueado por seguridad. Intente nuevamente en ${minutesLeft} minuto(s).`;
            passwordInput.disabled = true;
            return true;
        } else {
            lockoutAlert.style.display = "none";
            passwordInput.disabled = false;
            return false;
        }
    }

    // 2. Comprobar Sesión Actual
    if (sessionStorage.getItem("torimex_admin_session") === "active") {
        showDashboard();
    } else {
        checkLockout();
    }

    // 3. Procesar Inicio de Sesión
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (checkLockout()) return;

            const inputPassword = passwordInput.value.trim();
            const inputHash = await sha256(inputPassword);
            const storedHash = localStorage.getItem("torimex_admin_pwd_hash");

            if (inputHash === storedHash) {
                // Éxito: Limpiar contador de intentos e iniciar sesión
                localStorage.removeItem("torimex_failed_attempts");
                localStorage.removeItem("torimex_lockout_until");
                sessionStorage.setItem("torimex_admin_session", "active");
                passwordInput.value = "";
                showDashboard();
                showToast("¡Acceso concedido! Bienvenido al panel.", "success");
            } else {
                // Error: Incrementar intentos
                let attempts = parseInt(localStorage.getItem("torimex_failed_attempts") || "0", 10) + 1;
                localStorage.setItem("torimex_failed_attempts", attempts.toString());

                if (attempts >= MAX_ATTEMPTS) {
                    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
                    localStorage.setItem("torimex_lockout_until", lockUntil.toString());
                    checkLockout();
                    showToast("Límite de intentos superado. Bloqueo temporal activado.", "error");
                } else {
                    const remaining = MAX_ATTEMPTS - attempts;
                    showToast(`Contraseña incorrecta. Te quedan ${remaining} intento(s).`, "error");
                }
            }
        });
    }

    // Toggle para ver/ocultar contraseña
    if (togglePwdBtn) {
        togglePwdBtn.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
        });
    }

    // Cerrar Sesión
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("torimex_admin_session");
            adminLayout.style.display = "none";
            loginScreen.style.display = "flex";
            showToast("Sesión cerrada de forma segura.", "info");
        });
    }

    function showDashboard() {
        loginScreen.style.display = "none";
        adminLayout.style.display = "flex";
        renderAdminTable();
    }

    // ==========================================
    // RENDERIZADO DE LA TABLA Y ESTADÍSTICAS
    // ==========================================
    function renderAdminTable() {
        const items = getCatalogItems();

        // Actualizar estadísticas
        statTotal.textContent = items.length;
        statProducts.textContent = items.filter(i => i.type === "producto").length;
        statServices.textContent = items.filter(i => i.type === "servicio").length;

        // Filtrar items
        const selectedType = filterType ? filterType.value : "todos";
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const filtered = items.filter(item => {
            const matchesType = (selectedType === "todos") || (item.type === selectedType);
            const matchesQuery = !query || 
                                 item.name.toLowerCase().includes(query) ||
                                 (item.categoryLabel && item.categoryLabel.toLowerCase().includes(query));
            return matchesType && matchesQuery;
        });

        if (filtered.length === 0) {
            catalogTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2.5rem; color: #94A3B8;">
                        No se encontraron registros. Haz clic en "+ Nuevo Item" para comenzar.
                    </td>
                </tr>
            `;
            return;
        }

        catalogTableBody.innerHTML = filtered.map(item => {
            const defaultImg = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80";
            const imgSrc = item.imageUrl || defaultImg;
            const isProd = item.type === "producto";
            const typeBadge = isProd 
                ? `<span class="table-badge badge-producto">Producto</span>`
                : `<span class="table-badge badge-servicio">Servicio</span>`;
            
            const statusClass = item.active !== false ? "status-active" : "status-inactive";
            const statusLabel = item.active !== false ? "Activo" : "Inactivo";

            return `
                <tr>
                    <td>
                        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.name)}" class="item-thumb" onerror="this.src='${defaultImg}'">
                    </td>
                    <td>
                        <div class="item-title-wrap">
                            <strong>${escapeHtml(item.name)}</strong>
                            <small>${escapeHtml(item.categoryLabel || item.category || "General")}</small>
                        </div>
                    </td>
                    <td>${typeBadge}</td>
                    <td>
                        <span class="status-indicator ${statusClass}">
                            <span class="status-dot"></span>
                            ${statusLabel}
                        </span>
                    </td>
                    <td>
                        <small style="color: #64748B;">${escapeHtml(item.whatsappText || "Cotización estándar")}</small>
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-action-icon" title="Editar" onclick="openEditModal('${item.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-action-icon btn-delete" title="Eliminar" onclick="deleteItem('${item.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    if (filterType) filterType.addEventListener("change", renderAdminTable);
    if (searchInput) searchInput.addEventListener("input", renderAdminTable);

    // ==========================================
    // AGREGAR / EDITAR PRODUCTO O SERVICIO
    // ==========================================
    if (newItemBtn) {
        newItemBtn.addEventListener("click", () => {
            modalTitle.textContent = "Agregar Nuevo Producto o Servicio";
            itemForm.reset();
            itemIdInput.value = "";
            editingImageBase64 = "";
            imagePreview.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80";
            itemActiveInput.checked = true;
            itemModal.classList.add("active");
        });
    }

    window.openEditModal = function(id) {
        const items = getCatalogItems();
        const item = items.find(i => i.id === id);
        if (!item) return;

        modalTitle.textContent = "Editar: " + item.name;
        itemIdInput.value = item.id;
        itemTypeInput.value = item.type || "producto";
        itemNameInput.value = item.name || "";
        itemCategoryInput.value = item.category || "papelera";
        itemShortDescInput.value = item.shortDesc || "";
        itemFullDescInput.value = item.fullDesc || "";
        itemSpecsInput.value = (item.specs && item.specs.length > 0) ? item.specs.join("\n") : "";
        itemImageUrlInput.value = item.imageUrl || "";
        editingImageBase64 = item.imageUrl || "";
        imagePreview.src = item.imageUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80";
        itemWhatsappInput.value = item.whatsappText || "";
        itemActiveInput.checked = item.active !== false;

        itemModal.classList.add("active");
    };

    function closeItemModal() {
        itemModal.classList.remove("active");
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeItemModal);
    if (cancelItemBtn) cancelItemBtn.addEventListener("click", closeItemModal);

    // Cargar imagen local desde la computadora (FileReader a DataURL)
    if (itemImageFileInput) {
        itemImageFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    alert("La imagen es un poco pesada (máx 2MB recomendado). Puede afectar la velocidad.");
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    editingImageBase64 = event.target.result;
                    imagePreview.src = editingImageBase64;
                    itemImageUrlInput.value = ""; // Limpiar campo de URL
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Si escribe una URL de imagen, previsualizarla
    if (itemImageUrlInput) {
        itemImageUrlInput.addEventListener("input", (e) => {
            if (e.target.value.trim()) {
                editingImageBase64 = e.target.value.trim();
                imagePreview.src = editingImageBase64;
            }
        });
    }

    // Guardar item (Crear o Actualizar)
    if (itemForm) {
        itemForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const items = getCatalogItems();
            const id = itemIdInput.value.trim();
            const type = itemTypeInput.value;
            const name = itemNameInput.value.trim();
            const category = itemCategoryInput.value;
            const categoryLabel = itemCategoryInput.options[itemCategoryInput.selectedIndex].text;
            const shortDesc = itemShortDescInput.value.trim();
            const fullDesc = itemFullDescInput.value.trim() || shortDesc;
            const specs = itemSpecsInput.value.split("\n").map(s => s.trim()).filter(s => s.length > 0);
            const imageUrl = editingImageBase64 || itemImageUrlInput.value.trim() || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";
            const whatsappText = itemWhatsappInput.value.trim() || buildAutoContactMessage(name);
            const active = itemActiveInput.checked;

            if (id) {
                // Edición
                const index = items.findIndex(i => i.id === id);
                if (index !== -1) {
                    items[index] = {
                        ...items[index],
                        type,
                        name,
                        category,
                        categoryLabel,
                        shortDesc,
                        fullDesc,
                        specs,
                        imageUrl,
                        whatsappText,
                        active,
                        updatedAt: new Date().toISOString().split("T")[0]
                    };
                    showToast("Producto/Servicio actualizado correctamente.", "success");
                }
            } else {
                // Nuevo
                const newItem = {
                    id: "item-" + Date.now(),
                    type,
                    name,
                    category,
                    categoryLabel,
                    shortDesc,
                    fullDesc,
                    specs,
                    imageUrl,
                    whatsappText,
                    featured: false,
                    active,
                    createdAt: new Date().toISOString().split("T")[0]
                };
                items.unshift(newItem);
                showToast("¡Nuevo elemento agregado exitosamente!", "success");
            }

            saveCatalogItems(items);
            renderAdminTable();
            closeItemModal();
        });
    }

    // Eliminar item
    window.deleteItem = function(id) {
        const items = getCatalogItems();
        const item = items.find(i => i.id === id);
        if (!item) return;

        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${item.name}"?`)) {
            const updated = items.filter(i => i.id !== id);
            saveCatalogItems(updated);
            renderAdminTable();
            showToast(`"${item.name}" fue eliminado del catálogo.`, "warning");
        }
    };

    // ==========================================
    // EXPORTAR E IMPORTAR CATÁLOGO (RESPALDO JSON)
    // ==========================================
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const items = getCatalogItems();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
            const downloadAnchor = document.createElement("a");
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `catalogo-torimex-backup-${new Date().toISOString().split("T")[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("Catálogo descargado como archivo JSON.", "success");
        });
    }

    if (importInput) {
        importInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (Array.isArray(parsed)) {
                        if (confirm(`Se encontraron ${parsed.length} elementos en el archivo. ¿Deseas reemplazar el catálogo actual?`)) {
                            saveCatalogItems(parsed);
                            renderAdminTable();
                            showToast("Catálogo restaurado exitosamente.", "success");
                        }
                    } else {
                        alert("El archivo no tiene el formato de catálogo esperado.");
                    }
                } catch (err) {
                    alert("Error al leer el archivo JSON: " + err.message);
                }
            };
            reader.readAsText(file);
        });
    }

    // ==========================================
    // SEGURIDAD: CAMBIO DE CONTRASEÑA MAESTRA
    // ==========================================
    if (openChangePwdBtn) {
        openChangePwdBtn.addEventListener("click", () => {
            changePwdForm.reset();
            changePwdModal.classList.add("active");
        });
    }

    function closePwdModal() {
        changePwdModal.classList.remove("active");
    }

    if (closePwdModalBtn) closePwdModalBtn.addEventListener("click", closePwdModal);
    if (cancelPwdBtn) cancelPwdBtn.addEventListener("click", closePwdModal);

    if (changePwdForm) {
        changePwdForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const currentPwd = document.getElementById("currPassword").value.trim();
            const newPwd = document.getElementById("newPassword").value.trim();
            const confirmPwd = document.getElementById("confirmPassword").value.trim();

            const currentHash = await sha256(currentPwd);
            const storedHash = localStorage.getItem("torimex_admin_pwd_hash");

            if (currentHash !== storedHash) {
                alert("La contraseña actual no es correcta.");
                return;
            }

            if (newPwd.length < 8) {
                alert("Por seguridad, la nueva contraseña debe tener al menos 8 caracteres.");
                return;
            }

            if (newPwd !== confirmPwd) {
                alert("Las nuevas contraseñas no coinciden.");
                return;
            }

            const newHash = await sha256(newPwd);
            localStorage.setItem("torimex_admin_pwd_hash", newHash);
            closePwdModal();
            showToast("Contraseña maestra actualizada con éxito.", "success");
        });
    }
});

// Helper de notificaciones Toast
function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

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
