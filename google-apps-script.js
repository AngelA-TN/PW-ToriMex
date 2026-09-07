/**
 * ==========================================================================
 * INDUSTRIAL TORIMEX - BACKEND GOOGLE APPS SCRIPT
 * Conexión directa entre Google Sheets y la página web
 * ==========================================================================
 * 
 * INSTRUCCIONES:
 * 1. En Google Sheets, ve a: Extensiones > Apps Script.
 * 2. BORRA todo el código que tengas ahí.
 * 3. PEGA este código completo.
 * 4. Guarda con Ctrl + S.
 * 5. Clic en: Implementar (Deploy) > Administrar implementaciones > Editar (Lápiz) > Versión: "Nueva versión" > Implementar.
 */

const SHEET_NAME = "Catalogo";

// Catálogo predeterminado inicial (se carga automáticamente si la hoja está vacía)
const INITIAL_PRODUCTS = [
  {
    id: "prod-almidon",
    type: "producto",
    name: "Almidón para Industria Papelera",
    category: "papelera",
    categoryLabel: "Industria Papelera",
    shortDesc: "Almidón catiónico de alta retención para procesos papeleros.",
    fullDesc: "Almidón catiónico y modificado para la preparación de masa y acabado en plantas papeleras.",
    specs: ["Presentación: Saco de 25 kg", "Resistencia superior"],
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
    shortDesc: "Cuchillas industriales de alta durabilidad para corte continuo.",
    fullDesc: "Cuchillas circulares y rectas de acero de alta precisión para cortadoras y rebobinadoras.",
    specs: ["Material: Acero templado", "Alta precisión de corte"],
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
    shortDesc: "Equipamiento certificado para protección personal en planta.",
    fullDesc: "Equipos de protección certificados (NOM-STPS, ANSI) para seguridad operativa integral.",
    specs: ["Certificación industrial", "Ergonómico y seguro"],
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
    shortDesc: "Sistemas integrales y químicos para optimización de agua industrial.",
    fullDesc: "Diseño, monitoreo y reactivos químicos para plantas de tratamiento y recirculación de agua.",
    specs: ["Análisis de calidad", "Soporte especializado"],
    imageUrl: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80",
    whatsappText: "Hola, buen día. Me gustaría obtener más información sobre Tratamiento de Agua para Empresas e Industrias. ¿Podrían proporcionarme detalles, por favor? ¡Gracias!",
    featured: true,
    active: true,
    createdAt: "2026-02-10"
  }
];

/**
 * Función obligatoria de Google Apps Script: Responde a la lectura de datos de la página
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    let items = readCatalogFromSheet(sheet);
    
    // Si la hoja está vacía, poblamos con los productos base
    if (items.length === 0) {
      saveCatalogToSheet(sheet, INITIAL_PRODUCTS);
      items = INITIAL_PRODUCTS;
    }

    return ContentService.createTextOutput(JSON.stringify(items))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: true, 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función obligatoria de Google Apps Script: Guarda productos desde el panel de administración
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "";
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Sin datos recibidos" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(rawData);
    const sheet = getOrCreateSheet();

    if (payload.action === "save_catalog" && Array.isArray(payload.items)) {
      saveCatalogToSheet(sheet, payload.items);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        count: payload.items.length,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Acción no reconocida" 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "ID", "Tipo", "Nombre", "Categoría", "Etiqueta Categoría",
      "Descripción Corta", "Descripción Completa", "Especificaciones",
      "URL Imagen", "Texto WhatsApp", "Destacado", "Activo", "Fecha Creación"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0284C7")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readCatalogFromSheet(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
  const items = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[2]) continue;

    let specs = [];
    if (row[7]) {
      try {
        const parsed = JSON.parse(row[7]);
        specs = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (e) {
        specs = String(row[7]).split("\n").map(function(s) { return s.trim(); }).filter(Boolean);
      }
    }

    items.push({
      id: String(row[0] || ("item-" + (i + 1))),
      type: String(row[1] || "producto"),
      name: String(row[2] || ""),
      category: String(row[3] || "papelera"),
      categoryLabel: String(row[4] || "Industria"),
      shortDesc: String(row[5] || ""),
      fullDesc: String(row[6] || row[5] || ""),
      specs: specs,
      imageUrl: String(row[8] || ""),
      whatsappText: String(row[9] || ""),
      featured: row[10] === true || String(row[10]).toLowerCase() === "true",
      active: row[11] !== false && String(row[11]).toLowerCase() !== "false",
      createdAt: String(row[12] || "")
    });
  }
  return items;
}

function saveCatalogToSheet(sheet, items) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 13).clearContent();
  }

  if (!items || items.length === 0) return;

  const rows = items.map(function(item) {
    return [
      item.id || "",
      item.type || "producto",
      item.name || "",
      item.category || "",
      item.categoryLabel || "",
      item.shortDesc || "",
      item.fullDesc || "",
      JSON.stringify(item.specs || []),
      item.imageUrl || "",
      item.whatsappText || "",
      item.featured ? true : false,
      item.active !== false,
      item.createdAt || new Date().toISOString().split("T")[0]
    ];
  });

  sheet.getRange(2, 1, rows.length, 13).setValues(rows);
}
