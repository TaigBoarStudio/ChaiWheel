export interface Tea {
  id: string;
  name: string;
  type: string; // e.g. "Шу Пуэр", "Улун", "Зеленый"
  origin: string; // Произхождение
  year: number; // Год урожая
  producer: string; // Производитель (например DaoChai, etc.)
  rating: number; // 1-5 звезд
  brewTemp: number; // Температура заваривания
  brewTime: string; // Время заваривания
  flavors: string[]; // List of flavor IDs or names matching the wheel
  notes: string; // Заметки / описание
  dateAdded: string; // Дата дегустации
  author?: string; // Александр / Дмитрий
}

export interface FlavorWheelItem {
  id: string;
  name: string;
}

export interface FlavorWheelCategory {
  id: string;
  name: string;
  color: string;
  items: string[];
}

export interface GoogleSheetsConfig {
  webAppUrl: string; // Google Apps Script Web App URL
  sheetId: string;   // Optional Google Sheet ID
  isConfigured: boolean;
}
