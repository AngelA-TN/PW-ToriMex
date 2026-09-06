/**
 * INDUSTRIAL TORIMEX - Catálogo Inicial de Productos y Servicios
 * Base de datos por defecto (se sincroniza con localStorage).
 */

const DEFAULT_CATALOG = [
    {
        id: "prod-almidon",
        type: "producto",
        name: "Almidón para Industria Papelera",
        category: "papelera",
        categoryLabel: "Industria Papelera",
        shortDesc: "Almidones modificados y nativos de alto rendimiento que incrementan la resistencia mecánica, brillo y acabado en la fabricación de papel.",
        fullDesc: "Nuestros almidones industriales están especialmente formulados para los procesos de preparación de masa (wet-end), prensas encoladoras (size press) y estucado. Brindan una retención superior de cargas y fibras, optimizando los costos de formulación y garantizando un secado uniforme y alta durabilidad del papel.",
        specs: [
            "Excelente compatibilidad con fibras vírgenes y recicladas",
            "Mayor retención de sólidos y disminución de DBO en efluentes",
            "Presentación: Sacos de 25 kg y Supersacos de 1,000 kg",
            "Certificación de pureza y estabilidad reológica"
        ],
        imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
        whatsappText: "Hola, buen día. Me gustaría obtener más información sobre Almidón para Industria Papelera. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!",
        featured: true,
        active: true,
        createdAt: "2026-01-15"
    },
    {
        id: "prod-cuchillas",
        type: "producto",
        name: "Cuchillas para Cortar Papel y Cartón",
        category: "papelera",
        categoryLabel: "Industria Papelera",
        shortDesc: "Cuchillas industriales circulares y rectas de acero de alta velocidad (HSS) y carburo de tungsteno para corte continuo de máxima precisión.",
        fullDesc: "Fabricadas con tolerancias de precisión micrométrica y tratamientos térmicos avanzados. Reducen drásticamente el polvo de corte, evitan rebabas en los bordes y prolongan los intervalos entre afilados, maximizando el tiempo productivo de sus rebobinadoras y cortadoras.",
        specs: [
            "Materiales: Carburo de Tungsteno (TCT) y HSS templado",
            "Bisel pulido espejo para corte ultra limpio y sin desgarros",
            "Compatibilidad universal con maquinaria de corte estándar y a medida",
            "Resistencia extrema al desgaste y a la fatiga mecánica"
        ],
        imageUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
        whatsappText: "Hola, buen día. Me gustaría obtener más información sobre Cuchillas para Cortar Papel y Cartón. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!",
        featured: true,
        active: true,
        createdAt: "2026-01-20"
    },
    {
        id: "prod-epp",
        type: "producto",
        name: "Equipo de Protección de Seguridad (EPP)",
        category: "seguridad",
        categoryLabel: "Seguridad Industrial",
        shortDesc: "Equipos de protección personal normados y certificados para garantizar la integridad física de los operarios en entornos de alto riesgo.",
        fullDesc: "Catálogo completo de EPP diseñado para satisfacer los más estrictos estándares industriales (NOM-STPS, ANSI, OSHA). Incluye protección craneal, auditiva, respiratoria, visual, guantes para corte y calzado dieléctrico ergonómico para largas jornadas operativas.",
        specs: [
            "Cumplimiento con normas oficiales mexicanas NOM-STPS y ANSI",
            "Materiales ergonómicos, transpirables y de alta resistencia al impacto",
            "Guantes anticorte nivel 5 con recubrimiento de nitrilo / poliuretano",
            "Kits personalizados según la matriz de riesgos de tu planta"
        ],
        imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80",
        whatsappText: "Hola, buen día. Me gustaría obtener más información sobre Equipo de Protección de Seguridad (EPP). ¿Podrían proporcionarme detalles, por favor? ¡Gracias!",
        featured: true,
        active: true,
        createdAt: "2026-02-01"
    },
    {
        id: "serv-agua",
        type: "servicio",
        name: "Tratamiento de Agua para Empresas e Industrias",
        category: "ambiental",
        categoryLabel: "Soluciones Ambientales",
        shortDesc: "Ingeniería, diseño, instalación y optimización de plantas y sistemas integrales de tratamiento de agua residual y de proceso.",
        fullDesc: "Acompañamos a su empresa en el cumplimiento de la normatividad ambiental vigente (NOM-001-SEMARNAT) y en la reducción de costos operativos mediante la recirculación y reúso de agua tratada. Diseñamos soluciones químicas, biológicas y fisicoquímicas adaptadas a la carga contaminante específica de su sector.",
        specs: [
            "Plantas de Tratamiento de Aguas Residuales (PTAR) biológicas y fisicoquímicas",
            "Sistemas de filtración multimedia, carbón activado y ósmosis inversa",
            "Dosificación de polímeros, coagulantes y desinfectantes especializados",
            "Monitoreo analítico, pólizas de mantenimiento preventivo y corretaje normativo"
        ],
        imageUrl: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80",
        whatsappText: "Hola, buen día. Me gustaría obtener más información sobre Tratamiento de Agua para Empresas e Industrias. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!",
        featured: true,
        active: true,
        createdAt: "2026-02-10"
    }
];

const STORAGE_KEY = "torimex_catalog_data";

/**
 * Genera el mensaje estándar automatizado para WhatsApp o Correo
 */
function buildAutoContactMessage(itemName) {
    if (itemName && itemName.trim()) {
        return `Hola, buen día. Me gustaría obtener más información sobre ${itemName.trim()}. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!`;
    }
    return "Hola, buen día. Me gustaría obtener más información sobre. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!";
}

/**
 * Obtiene la lista actual de items (desde localStorage o catálogo inicial)
 */
function getCatalogItems() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("No se pudo leer localStorage, cargando catálogo por defecto", e);
    }
    // Guardar por primera vez si no existía
    saveCatalogItems(DEFAULT_CATALOG);
    return DEFAULT_CATALOG;
}

/**
 * Guarda los items en localStorage
 */
function saveCatalogItems(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        // Disparar evento personalizado para actualizar componentes en tiempo real
        window.dispatchEvent(new CustomEvent("torimex_catalog_updated", { detail: items }));
    } catch (e) {
        console.error("Error al guardar en localStorage", e);
    }
}
