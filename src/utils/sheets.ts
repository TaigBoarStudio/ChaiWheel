import { Tea, GoogleSheetsConfig } from "../types";

// The Google Apps Script template code that the user can copy & paste in their Google Drive Script editor.
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script для "Колеса Ароматов Чая"
 * Позволяет читать и записывать записи дегустаций чая.
 * Опубликуйте этот скрипт как Веб-приложение с доступом "Все" (Anyone).
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var teas = [];
  
  if (rows.length > 1) {
    var headers = rows[0];
    for (var i = 1; i < rows.length; i++) {
       var row = rows[i];
       var tea = {
         id: String(row[0] || ''),
         name: String(row[1] || ''),
         type: String(row[2] || ''),
         origin: String(row[3] || ''),
         year: Number(row[4] || 0),
         producer: String(row[5] || ''),
         rating: Number(row[6] || 5),
         brewTemp: Number(row[7] || 90),
         brewTime: String(row[8] || ''),
         flavors: row[9] ? String(row[9]).split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
         notes: String(row[10] || ''),
         dateAdded: String(row[11] || ''),
         author: String(row[12] || '')
       };
       teas.push(tea);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: teas }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Если таблица пустая, запишем заголовки
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID", "Название", "Категория", "Происхождение", "Год урожая", 
        "Производитель", "Оценка (1-5)", "Температура", "Время", 
        "Вкусы (через запятую)", "Заметки", "Дата добавления", "Дегустатор"
      ]);
    }
    
    // Генерируем уникальный ID если пустой
    var id = postData.id || ("tea_" + new Date().getTime());
    var flavorsStr = Array.isArray(postData.flavors) ? postData.flavors.join(",") : "";
    
    // Добавляем строку
    sheet.appendRow([
      id,
      postData.name || "",
      postData.type || "",
      postData.origin || "",
      Number(postData.year || 2026),
      postData.producer || "",
      Number(postData.rating || 5),
      Number(postData.brewTemp || 90),
      postData.brewTime || "",
      flavorsStr,
      postData.notes || "",
      postData.dateAdded || new Date().toISOString(),
      postData.author || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", id: id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

// Load key configurations from local storage
export const getSheetsConfig = (): GoogleSheetsConfig => {
  const saved = localStorage.getItem("tea_sheets_config");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (_) {
      // Ignored
    }
  }
  return { webAppUrl: "", sheetId: "", isConfigured: false };
};

// Save key configuration to local storage
export const saveSheetsConfig = (config: GoogleSheetsConfig) => {
  localStorage.setItem("tea_sheets_config", JSON.stringify(config));
};

// Clear sheets config
export const clearSheetsConfig = () => {
  localStorage.removeItem("tea_sheets_config");
};

// Fetch list of teas from either Google Sheet or localStorage
export const fetchTeas = async (config: GoogleSheetsConfig, fallbackTeas: Tea[]): Promise<{ teas: Tea[]; fromSheets: boolean }> => {
  if (config.isConfigured && config.webAppUrl) {
    try {
      // Fetch with timeout to prevent blocking
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(config.webAppUrl, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (response.ok) {
        const json = await response.json();
        if (json && json.status === "success" && Array.isArray(json.data)) {
          // If sheets is empty, save local teas to sheets or just return empty/sheets data
          return { teas: json.data, fromSheets: true };
        }
      }
    } catch (err) {
      console.warn("Failed to fetch from Google Sheet, falling back to local storage.", err);
    }
  }

  // Local storage fallback
  const localTeas = localStorage.getItem("local_tasting_teas");
  if (localTeas) {
    try {
      const parsed = JSON.parse(localTeas);
      if (Array.isArray(parsed)) {
        // Filter out preset/mock teas so they do not show up and mislead the user
        const filtered = parsed.filter((t: Tea) => !["tea_1", "tea_2", "tea_3", "tea_4", "tea_5", "tea_6", "tea_7"].includes(t.id));
        return { teas: filtered, fromSheets: false };
      }
    } catch (_) {
      // Ignored
    }
  }

  // Default to START_TEAS seed on very first run
  localStorage.setItem("local_tasting_teas", JSON.stringify(fallbackTeas));
  return { teas: fallbackTeas, fromSheets: false };
};

// Add tea
export const addTea = async (config: GoogleSheetsConfig, newTea: Tea, currentTeas: Tea[]): Promise<{ success: boolean; tea: Tea; fromSheets: boolean }> => {
  let savedToSheet = false;
  
  if (config.isConfigured && config.webAppUrl) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000); // 10s write timeout

      // Apps Script Web Apps require POSTing or GETing. For simplest write, we post JSON string
      const response = await fetch(config.webAppUrl, {
        method: "POST",
        mode: "no-cors", // Crucial for static sites invoking Web Apps without triggers issues, though JSON is ideal
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newTea),
        signal: controller.signal
      });
      clearTimeout(id);
      
      // Note: "no-cors" fetch returns an opaque response, which has response.ok = false or empty body, 
      // but it does hit the script successfully. Let me explain this in the UI!
      // To ensure maximum reliability, we always save it locally as well.
      savedToSheet = true;
    } catch (err) {
      console.error("Failed writing to Google Sheet:", err);
    }
  }

  // Always update local storage too! This ensures offline usability and a fallback state
  const updatedTeas = [newTea, ...currentTeas];
  localStorage.setItem("local_tasting_teas", JSON.stringify(updatedTeas));

  return { success: true, tea: newTea, fromSheets: savedToSheet };
};

// Check if a Web App URL compiles and is accessible
export const testSheetsConnection = async (webAppUrl: string): Promise<boolean> => {
  if (!webAppUrl) return false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(webAppUrl, { method: "GET", signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const json = await res.json();
      return json && json.status === "success";
    }
    return false;
  } catch (e) {
    console.error("Connection test failed:", e);
    return false;
  }
};
