/**
 * ==========================================================================
 * INDUSTRIAL TORIMEX - BACKEND GOOGLE APPS SCRIPT
 * Base de datos en la nube conectada con Google Sheets
 * ==========================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu hoja de cálculo en Google Sheets (o crea una nueva llamada "Industrial ToriMex BD").
 * 2. En el menú superior, ve a: Extensiones > Apps Script.
 * 3. Borra todo el código que aparezca en el editor (ej. myFunction).
 * 4. Pega TODO este código en el editor y guarda (Ctrl+S).
 * 5. Haz clic en el botón azul superior: "Implementar" (Deploy) > "Administrar implementaciones" o "Nueva implementación".
 * 6. Selecciona tipo: "Aplicación web" (Web app).
 * 7. Configuración CRÍTICA:
 *    - Ejecutar como (Execute as): "Yo" (Tu cuenta de Google).
 *    - Quién tiene acceso (Who has access): "Cualquier persona" (Anyone).
 * 8. Haz clic en "Implementar" y autoriza los permisos cuando te lo solicite Google.
 * 9. La URL es la misma que ya configuramos en la web.
 */

const SHEET_NAME = "Catalogo";

/**
 * Maneja peticiones GET: Lee los productos de Google Sheets y los devuelve en formato JSON
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const items = readCatalogFromSheet(sheet);
    
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
 * Maneja peticiones POST: Recibe los productos desde el panel de administración y actualiza la hoja
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "";
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "No se recibieron datos en la petición" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(rawData);
    const sheet = getOrCreateSheet();

    if (payload.action === "save_catalog" && Array.isArray(payload.items)) {
      saveCatalogToSheet(sheet, payload.items);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Catálogo sincronizado exitosamente en Google Sheets", 
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

/**
 * Obtiene la pestaña 'Catalogo' o la crea con sus encabezados si no existe
 */
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

/**
 * Lee todas las filas de la hoja y las convierte al arreglo de objetos del catálogo
 */
function readCatalogFromSheet(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return []; // Solo tiene encabezados o está vacía

  const values = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
  const items = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[2]) continue; // Omitir filas vacías

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

/**
 * Sobrescribe el catálogo en Google Sheets con la lista actualizada
 */
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
