import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  Plus, 
  AlertTriangle, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Warehouse,
  Store,
  Wine,
  ShieldAlert,
  CheckCircle2,
  Printer,
  Lock,
  RefreshCcw,
  Pencil,
  Trash2,
  X,
  Search,
  History
} from 'lucide-react';

const AREAS = ['CAVA', 'DOS SUCRES', 'MINDALA'];
const SUBCATEGORIAS = ['Espumosos', 'Blancos', 'Naranjos', 'Tintos', 'Rosados', 'Licores', 'Cervezas', 'Insumos', 'Menaje', 'Otros'];
const STORAGE_KEY = 'inventario-bar-state-v1';

// ---------- Conversión de volumen (botellas/tragos <-> ml/oz) ----------
// Botella estándar de licor = 750 ml. El tamaño de trago es configurable
// por el usuario porque varía según el bar (1 oz, 1.5 oz, etc.).
const ML_PER_BOTTLE = 750;
const ML_PER_OZ = 29.5735;
const mlToOz = (ml) => ml / ML_PER_OZ;

// ---------- FIX: generador de IDs seguro contra colisiones ----------
// Antes se usaba Date.now() (y Date.now() + Math.random() en algún punto),
// lo que puede repetirse si dos acciones ocurren en el mismo milisegundo,
// corrompiendo referencias itemId -> transacción. crypto.randomUUID() es
// único de forma práctica y está disponible en cualquier navegador moderno.
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// ---------- FIX: validación numérica real (no solo atributos HTML) ----------
// min/step en un <input> son solo sugerencias visuales; no impiden que
// llegue NaN, negativos o texto vacío al estado. Esta función centraliza
// el parseo seguro.
const toSafeNumber = (value, { min = -Infinity, fallback = null } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return fallback;
  return n;
};

const initialItems = [
  // Espumosos
  { id: 1, name: 'Lambrusco Dulce Rosato', subcategory: 'Espumosos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 2, name: 'Cava Vilarnau Brut Nature', subcategory: 'Espumosos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 3, name: 'Von Winning Extra Brut Riesling', subcategory: 'Espumosos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 4, name: 'Congliano Valdobbiadenne Prosecco DOCG', subcategory: 'Espumosos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 5, name: 'Raventos De Nit Rose Extra Brut', subcategory: 'Espumosos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 6, name: 'Cava Albert Vilarnau', subcategory: 'Espumosos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 7, name: 'Taittinger Champagne', subcategory: 'Espumosos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },

  // Blancos
  { id: 10, name: 'Vicente Gandia Bobal Blanco', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 11, name: 'Domaine de Misele Colombard Gros Manseng', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 12, name: "L'Orso Pecorino Abruzzo DOC", subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 13, name: 'Von Winning QBA Riesling', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 14, name: 'Altarr Uco Edad Moderna Sauv. Blanc', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 15, name: 'Southern Ocean S. Blanc', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 16, name: 'Longheri Pinot Grigio', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 17, name: 'Mito Fumé Blanc', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 18, name: 'Neethlingshof Estate Chenin Blanc', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 19, name: 'Habla del Mar Blanco Submarino', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 20, name: 'El Enemigo Semillon', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 21, name: 'Alain Chavy Borgogne Chardonnay', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 22, name: 'Charly Nicolle Chablis', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 23, name: 'Altar Uco, Edad Media Sauv. Chardo.', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 24, name: "L'Insolite Chenin Blanc", subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 25, name: 'Marqués de Murrieta Capellania', subcategory: 'Blancos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },

  // Naranjos
  { id: 30, name: 'El Vampiro del Pueblo Verdejo Sauv. Orange', subcategory: 'Naranjos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 31, name: 'Landron Chartier Pinot Gris Aussi, Orange', subcategory: 'Naranjos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },

  // Rosados
  { id: 40, name: 'Vicente Gandia Bobal Rosado', subcategory: 'Rosados', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 41, name: 'Domaine de Misele Syrah Rose', subcategory: 'Rosados', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 42, name: 'Von Winning Pinot Noir Rosado', subcategory: 'Rosados', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 43, name: 'Avanzi Chiaretto', subcategory: 'Rosados', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 44, name: 'Dominio del Pidio Tempranillo', subcategory: 'Rosados', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 45, name: 'Domaine de Misselle Syrah (Copa)', subcategory: 'Rosados', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },

  // Tintos
  { id: 50, name: 'Unexpected Garnacha', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 51, name: 'Cap Royal Bordeaux Superior', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 52, name: 'NAT - COOL Baga', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 53, name: 'Lionel Osmin Coeur de Malbec', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 54, name: 'Carmelo Rodero 9 Meses Tempranillo', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 55, name: 'Tre Saggi Montepulciano', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 56, name: 'Altar Uco, Edad Moderna Cab. Sauv.', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 57, name: 'Landron Gamay Tout Jours', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 58, name: 'Can Sumoi Garnatxa', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 59, name: 'Beronia Reserva Tempranillo', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 60, name: 'Rhapsody', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 61, name: 'Moncloa', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 62, name: 'Château Du Cartillon Haut-Medoc', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 63, name: 'Matsu Recio Tempranillo de Toro', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 64, name: 'Domain des Roches Neuves Cab. Franc', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 65, name: 'Château Tessendey Fronsac Merlot-Cab. Franc', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 66, name: 'Almirante Cabernet-Malbec', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 67, name: 'El Enemigo Bonarda', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 68, name: 'Marqués de Murrieta Reserva Tempranillo', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 69, name: 'Viña Alberdi Tempranillo', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 70, name: 'Vajra Dolcetto DAlba', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 71, name: 'Mosquita Muerta Malbec', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 72, name: 'Château Masserau Graves Bordeaux', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 73, name: 'Verzier Madone St. Joseph Syrah', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 74, name: 'Picaro del Águila Ribera del Duero', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 75, name: 'Castillo Ygay 2012 Rioja', subcategory: 'Tintos', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },

  // Licores y Destilados (Fraccionables por tragos)
  { id: 101, name: 'Glenlivet Founders (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 3, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 102, name: 'Glenlivet 15 (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 103, name: 'Glenfiddich 18 (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 104, name: 'Glenmorangie Original (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 105, name: 'Chivas 15 (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 106, name: 'Macallan 12 (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 107, name: 'Jameson (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 108, name: 'Royal Salute (Whisky)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 1, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 109, name: 'Belvedere (Vodka)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 110, name: 'Absolut (Vodka)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 111, name: 'Stoli (Vodka)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 112, name: 'Cihuatan Nikte (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 113, name: 'Cihuatan Cinabrio (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 114, name: 'Abuelo 12 (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 115, name: 'Abuelo Three Angels (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 116, name: 'Flor de Caña 12 años (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 117, name: 'Flor de Caña 18 años (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 118, name: 'Botran 12 (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 119, name: 'Botran 15 (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 120, name: 'Botran 18 (Ron)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 121, name: 'Canuto Ron', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 122, name: 'Bottega Bacur (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 123, name: 'Fifty Pounds (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 124, name: 'The Botanist (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 125, name: 'Nordés (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 126, name: 'Williams Elegant (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 127, name: 'Tanqueray Ten (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 128, name: 'London Dry Gin NO3', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 129, name: 'The London NO1 (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 130, name: 'Beefeater 24 (Gin)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 131, name: 'Corralejo Blanco (Tequila)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 132, name: 'Corralejo Reposado (Tequila)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 133, name: 'Corralejo Añejo (Tequila)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 134, name: 'Herradura Reposado (Tequila)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 2, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 135, name: 'Gran Reserva Lepanto (Brandy/Cognac)', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 1, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 136, name: 'Brandy Torres 10', subcategory: 'Licores', isFractional: true, shotsPerBottle: 20, minStock: { CAVA: 1, 'DOS SUCRES': 1, MINDALA: 1 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },

  // Cervezas Artesanales Jodoco
  { id: 150, name: 'Cerveza Jodoco Calentico (Especies/Miel)', subcategory: 'Cervezas', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 12, 'DOS SUCRES': 6, MINDALA: 6 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 151, name: 'Cerveza Jodoco Funky Sour', subcategory: 'Cervezas', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 12, 'DOS SUCRES': 6, MINDALA: 6 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 152, name: 'Cerveza Jodoco Saison', subcategory: 'Cervezas', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 12, 'DOS SUCRES': 6, MINDALA: 6 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } },
  { id: 153, name: 'Cerveza Jodoco Tripel', subcategory: 'Cervezas', isFractional: false, shotsPerBottle: 1, minStock: { CAVA: 12, 'DOS SUCRES': 6, MINDALA: 6 }, currentStock: { CAVA: 0, 'DOS SUCRES': 0, MINDALA: 0 } }
].map(item => ({ ...item, id: String(item.id) })); // FIX: normalizamos a string porque los nuevos IDs (crypto.randomUUID) son string; mezclar number/string rompía comparaciones item.id === newTransaction.itemId

export default function InventarioApp() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [managerName, setManagerName] = useState('Jefe de Operaciones / Cava');
  const [items, setItems] = useState(initialItems);
  const [transactions, setTransactions] = useState([]);
  const [writeOffs, setWriteOffs] = useState([]);

  // ---------- FIX: trazabilidad de responsable por movimiento ----------
  // Antes no existía forma de saber QUIÉN registró cada entrada/salida/baja;
  // solo un campo de texto libre "Responsable" editable por cualquiera.
  // Ahora se pide un nombre de operador al iniciar sesión de trabajo y se
  // adjunta a cada transacción. Esto NO es autenticación real (no hay
  // backend ni contraseña verificable), es una app 100% cliente — solo
  // mejora el registro de auditoría dentro de esa limitación.
  const [operatorName, setOperatorName] = useState('');
  const [operatorInput, setOperatorInput] = useState('');

  const [newItem, setNewItem] = useState({ 
    name: '', 
    subcategory: 'Licores', 
    isFractional: true,
    shotsPerBottle: 20,
    minStockCava: 2, minStockDos: 1, minStockMindala: 1, 
    stockCava: 0, stockDos: 0, stockMindala: 0 
  });
  
  const [newTransaction, setNewTransaction] = useState({ 
    itemId: '', 
    fromArea: 'CAVA',
    toArea: 'DOS SUCRES',
    type: 'IN',
    quantity: 1, 
    isShotMode: false, 
    shotsCount: 1,
    note: '' 
  });

  const [newWriteOff, setNewWriteOff] = useState({
    itemId: '',
    area: 'DOS SUCRES',
    quantity: 1,
    reason: 'Rotura accidental en barra'
  });

  const [selectedAreaFilter, setSelectedAreaFilter] = useState('TODAS');

  // ---------- Editar o eliminar un movimiento del Kardex (corrección de errores de digitación) ----------
  const [editingTx, setEditingTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState(null);
  const [editTxItemSearch, setEditTxItemSearch] = useState('');

  // ---------- Historial de Kardex por producto (con exportación a PDF) ----------
  const [historyItem, setHistoryItem] = useState(null); // producto cuyo historial se está viendo (null = cerrado)

  // ---------- Tabla de conversión ml/oz ----------
  const [volumeUnit, setVolumeUnit] = useState('ml'); // 'ml' | 'oz'
  const [shotSizeMl, setShotSizeMl] = useState(45); // tamaño de trago configurable (45ml ≈ 1.5oz por defecto)

  // ---------- Búsqueda de productos ----------
  const [productSearch, setProductSearch] = useState('');
  const [transactionItemSearch, setTransactionItemSearch] = useState('');
  const [writeOffItemSearch, setWriteOffItemSearch] = useState('');

  // ---------- Edición y eliminación de productos ----------
  const [editingItem, setEditingItem] = useState(null); // producto que se está editando (null = modal cerrado)
  const [editForm, setEditForm] = useState(null);        // valores del formulario de edición
  const [auditMode, setAuditMode] = useState(false);
  const [auditCounts, setAuditCounts] = useState({});

  // ---------- Persistencia con localStorage ----------
  // Guarda el estado en el navegador del dispositivo que lo usa. Esto NO
  // sincroniza entre dispositivos ni usuarios distintos — cada celular/PC
  // tendrá su propia copia. Si varias áreas (Cava, Dos Sucres, Mindala)
  // necesitan ver el mismo inventario en tiempo real, este es el punto
  // donde luego se conecta un backend (ej. Supabase) en vez de localStorage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items) setItems(parsed.items);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.writeOffs) setWriteOffs(parsed.writeOffs);
        if (parsed.managerName) setManagerName(parsed.managerName);
      }
    } catch (err) {
      console.warn('No se pudo cargar estado guardado:', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return; // evita sobrescribir el storage con datos iniciales antes de cargar
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, transactions, writeOffs, managerName }));
    } catch (err) {
      console.error('Error guardando estado:', err);
    }
  }, [items, transactions, writeOffs, managerName, loaded]);

  const getItemTotalStock = (item) => {
    return Number(((item.currentStock.CAVA || 0) + (item.currentStock['DOS SUCRES'] || 0) + (item.currentStock.MINDALA || 0)).toFixed(2));
  };

  // Convierte una cantidad de botellas a la unidad de volumen elegida (ml u oz)
  const formatBottlesAsVolume = (bottles) => {
    const totalMl = bottles * ML_PER_BOTTLE;
    if (volumeUnit === 'oz') return `${mlToOz(totalMl).toFixed(1)} oz`;
    return `${totalMl.toFixed(0)} ml`;
  };

  // Convierte una cantidad de tragos a la unidad de volumen elegida, según el tamaño de trago configurado
  const formatShotsAsVolume = (shots) => {
    const totalMl = shots * shotSizeMl;
    if (volumeUnit === 'oz') return `${mlToOz(totalMl).toFixed(1)} oz`;
    return `${totalMl.toFixed(0)} ml`;
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    // FIX: validar cada número explícitamente en vez de confiar en Number(x) || 0,
    // que silenciosamente convierte texto inválido en 0 sin avisar al usuario.
    const shotsPerBottle = newItem.isFractional ? toSafeNumber(newItem.shotsPerBottle, { min: 1 }) : 1;
    const minStockCava = toSafeNumber(newItem.minStockCava, { min: 0 });
    const minStockDos = toSafeNumber(newItem.minStockDos, { min: 0 });
    const minStockMindala = toSafeNumber(newItem.minStockMindala, { min: 0 });
    const stockCava = toSafeNumber(newItem.stockCava, { min: 0 });
    const stockDos = toSafeNumber(newItem.stockDos, { min: 0 });
    const stockMindala = toSafeNumber(newItem.stockMindala, { min: 0 });

    if ([shotsPerBottle, minStockCava, minStockDos, minStockMindala, stockCava, stockDos, stockMindala].some(v => v === null)) {
      alert('Revisa los campos numéricos: hay valores inválidos o negativos.');
      return;
    }

    const newId = generateId();
    const itemToAdd = {
      id: newId,
      name: newItem.name.trim(),
      subcategory: newItem.subcategory,
      isFractional: newItem.isFractional,
      shotsPerBottle,
      minStock: { CAVA: minStockCava, 'DOS SUCRES': minStockDos, MINDALA: minStockMindala },
      currentStock: { CAVA: stockCava, 'DOS SUCRES': stockDos, MINDALA: stockMindala }
    };
    
    setItems(prev => [...prev, itemToAdd]);
    
    const newTxs = [];
    AREAS.forEach(area => {
      const qty = itemToAdd.currentStock[area];
      if (qty > 0) {
        newTxs.push({
          id: generateId(),
          itemId: newId,
          area,
          type: 'IN',
          quantity: qty,
          date: new Date().toISOString(),
          user: operatorName,
          note: `Inventario inicial en ${area}`
        });
      }
    });

    if (newTxs.length > 0) {
      setTransactions(prev => [...newTxs, ...prev]);
    }
    
    setNewItem({ 
      name: '', 
      subcategory: 'Licores', 
      isFractional: true,
      shotsPerBottle: 20,
      minStockCava: 2, minStockDos: 1, minStockMindala: 1, 
      stockCava: 0, stockDos: 0, stockMindala: 0 
    });
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!newTransaction.itemId) return;

    const item = items.find(i => i.id === newTransaction.itemId);
    if (!item) return;

    let qty = 0;
    let notePrefix = '';

    if (newTransaction.isShotMode && item.isFractional) {
      const shots = toSafeNumber(newTransaction.shotsCount, { min: 0.01 });
      if (shots === null) { alert('Cantidad de tragos inválida.'); return; }
      qty = Number((shots / item.shotsPerBottle).toFixed(4));
      notePrefix = `${shots} tragos (${qty} botellas)`;
    } else {
      const q = toSafeNumber(newTransaction.quantity, { min: 0.01 });
      if (q === null) { alert('Cantidad inválida.'); return; }
      qty = q;
      notePrefix = `${qty} botellas/unidades`;
    }

    const updatedItems = [...items];
    const itemIndex = updatedItems.findIndex(i => i.id === item.id);
    const targetArea = newTransaction.type === 'IN' ? newTransaction.fromArea : newTransaction.toArea;

    if (newTransaction.type === 'IN') {
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        currentStock: {
          ...updatedItems[itemIndex].currentStock,
          [targetArea]: Number(((updatedItems[itemIndex].currentStock[targetArea] || 0) + qty).toFixed(2))
        }
      };
    } else {
      const currentAreaStock = updatedItems[itemIndex].currentStock[targetArea] || 0;
      if (currentAreaStock < qty) {
        alert(`Stock insuficiente en ${targetArea} para retirar ${qty} botellas. Stock actual: ${currentAreaStock}`);
        return;
      }
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        currentStock: {
          ...updatedItems[itemIndex].currentStock,
          [targetArea]: Number(Math.max(0, currentAreaStock - qty).toFixed(2))
        }
      };
    }

    setItems(updatedItems);
    setTransactions(prev => [{
      id: generateId(),
      itemId: item.id,
      area: targetArea,
      type: newTransaction.type,
      quantity: qty,
      isShotMode: newTransaction.isShotMode && item.isFractional,
      shotsCount: newTransaction.isShotMode ? toSafeNumber(newTransaction.shotsCount, { min: 0 }) : null,
      date: new Date().toISOString(),
      user: operatorName,
      note: newTransaction.note ? `${notePrefix} - ${newTransaction.note}` : `${newTransaction.type === 'IN' ? 'Recepción de Proveedor a' : 'Salida hacia'} ${targetArea}: ${notePrefix}`
    }, ...prev]);

    setNewTransaction({ itemId: '', fromArea: 'CAVA', toArea: 'DOS SUCRES', type: 'IN', quantity: 1, isShotMode: false, shotsCount: 1, note: '' });
  };

  const handleAddWriteOff = (e) => {
    e.preventDefault();
    if (!newWriteOff.itemId) return;

    const item = items.find(i => i.id === newWriteOff.itemId);
    if (!item) return;

    const qty = toSafeNumber(newWriteOff.quantity, { min: 0.01 });
    if (qty === null) { alert('Cantidad inválida.'); return; }

    const area = newWriteOff.area;
    const currentStock = item.currentStock[area] || 0;
    if (currentStock < qty) {
      alert(`No se pueden dar de baja ${qty} botellas en ${area}. Stock actual: ${currentStock}`);
      return;
    }

    const updatedItems = [...items];
    const itemIndex = updatedItems.findIndex(i => i.id === item.id);
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      currentStock: { ...updatedItems[itemIndex].currentStock, [area]: Number(Math.max(0, currentStock - qty).toFixed(2)) }
    };
    setItems(updatedItems);

    const writeOffRecord = {
      id: generateId(),
      itemId: item.id,
      area,
      quantity: qty,
      reason: newWriteOff.reason,
      date: new Date().toISOString(),
      user: operatorName
    };
    setWriteOffs(prev => [writeOffRecord, ...prev]);

    setTransactions(prev => [{
      id: generateId(),
      itemId: item.id,
      area,
      type: 'OUT',
      quantity: qty,
      date: new Date().toISOString(),
      user: operatorName,
      note: `BAJA POR ACCIDENTE/ROTURA: ${newWriteOff.reason}`
    }, ...prev]);

    setNewWriteOff({ itemId: '', area: 'DOS SUCRES', quantity: 1, reason: 'Rotura accidental en barra' });
  };

  // ---------- FIX: la auditoría calculaba diferencias pero nunca las aplicaba ----------
  // Antes "Conteo Físico Real" solo mostraba una diferencia visual (auditCounts)
  // que se perdía al cerrar el modo auditoría — el stock del sistema nunca se
  // corregía con el conteo físico real. Ahora hay un botón que aplica los
  // ajustes: escribe el stock real en `items` y deja un registro de auditoría
  // en el kardex por cada diferencia distinta de cero.
  const handleApplyAudit = () => {
    const diffs = [];
    const updatedItems = items.map(item => ({ ...item, currentStock: { ...item.currentStock } }));

    updatedItems.forEach(item => {
      AREAS.forEach(area => {
        const key = `${item.id}-${area}`;
        if (auditCounts[key] === undefined) return;
        const sysQty = item.currentStock[area] || 0;
        const realQty = toSafeNumber(auditCounts[key], { min: 0 });
        if (realQty === null) return;
        const diff = Number((realQty - sysQty).toFixed(2));
        if (diff !== 0) {
          item.currentStock[area] = realQty;
          diffs.push({ itemId: item.id, area, diff, realQty });
        }
      });
    });

    if (diffs.length === 0) {
      alert('No hay diferencias para aplicar.');
      return;
    }

    if (!window.confirm(`Se aplicarán ${diffs.length} ajuste(s) de stock según el conteo físico. ¿Confirmar?`)) return;

    setItems(updatedItems);
    setTransactions(prev => [
      ...diffs.map(d => ({
        id: generateId(),
        itemId: d.itemId,
        area: d.area,
        type: d.diff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(d.diff),
        date: new Date().toISOString(),
        user: operatorName,
        note: `AJUSTE POR AUDITORÍA FÍSICA (conteo real: ${d.realQty})`
      })),
      ...prev
    ]);
    setAuditCounts({});
    setAuditMode(false);
  };

  // ---------- Editar producto existente ----------
  const openEditItem = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      subcategory: item.subcategory,
      isFractional: item.isFractional,
      shotsPerBottle: item.shotsPerBottle,
      minStockCava: item.minStock.CAVA,
      minStockDos: item.minStock['DOS SUCRES'],
      minStockMindala: item.minStock.MINDALA,
      stockCava: item.currentStock.CAVA,
      stockDos: item.currentStock['DOS SUCRES'],
      stockMindala: item.currentStock.MINDALA
    });
  };

  const closeEditItem = () => {
    setEditingItem(null);
    setEditForm(null);
  };

  const handleSaveEditItem = (e) => {
    e.preventDefault();
    if (!editingItem || !editForm) return;
    if (!editForm.name.trim()) { alert('El nombre no puede estar vacío.'); return; }

    const shotsPerBottle = editForm.isFractional ? toSafeNumber(editForm.shotsPerBottle, { min: 1 }) : 1;
    const minStockCava = toSafeNumber(editForm.minStockCava, { min: 0 });
    const minStockDos = toSafeNumber(editForm.minStockDos, { min: 0 });
    const minStockMindala = toSafeNumber(editForm.minStockMindala, { min: 0 });
    const stockCava = toSafeNumber(editForm.stockCava, { min: 0 });
    const stockDos = toSafeNumber(editForm.stockDos, { min: 0 });
    const stockMindala = toSafeNumber(editForm.stockMindala, { min: 0 });

    if ([shotsPerBottle, minStockCava, minStockDos, minStockMindala, stockCava, stockDos, stockMindala].some(v => v === null)) {
      alert('Revisa los campos numéricos: hay valores inválidos o negativos.');
      return;
    }

    const before = editingItem;
    const updatedItem = {
      ...before,
      name: editForm.name.trim(),
      subcategory: editForm.subcategory,
      isFractional: editForm.isFractional,
      shotsPerBottle,
      minStock: { CAVA: minStockCava, 'DOS SUCRES': minStockDos, MINDALA: minStockMindala },
      currentStock: { CAVA: stockCava, 'DOS SUCRES': stockDos, MINDALA: stockMindala }
    };

    setItems(prev => prev.map(i => i.id === before.id ? updatedItem : i));

    // Si el stock manual cambió (ajuste directo desde edición), lo dejamos como
    // movimiento de auditoría en el Kardex para no perder trazabilidad.
    const adjustTxs = [];
    AREAS.forEach(area => {
      const oldQty = before.currentStock[area] || 0;
      const newQty = updatedItem.currentStock[area] || 0;
      const diff = Number((newQty - oldQty).toFixed(2));
      if (diff !== 0) {
        adjustTxs.push({
          id: generateId(),
          itemId: before.id,
          area,
          type: diff > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(diff),
          date: new Date().toISOString(),
          user: operatorName,
          note: `AJUSTE MANUAL DESDE EDICIÓN DE PRODUCTO (${oldQty} → ${newQty})`
        });
      }
    });
    if (adjustTxs.length > 0) {
      setTransactions(prev => [...adjustTxs, ...prev]);
    }

    closeEditItem();
  };

  const handleDeleteItem = (item) => {
    const totalStock = getItemTotalStock(item);
    const confirmMsg = totalStock > 0
      ? `"${item.name}" todavía tiene ${totalStock} botellas en stock. ¿Seguro que quieres eliminarlo del catálogo? Esta acción no se puede deshacer (el historial de Kardex se conserva).`
      : `¿Eliminar "${item.name}" del catálogo? Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMsg)) return;

    setItems(prev => prev.filter(i => i.id !== item.id));
    if (editingItem && editingItem.id === item.id) closeEditItem();
  };

  // ---------- Corregir un movimiento del Kardex por error de digitación ----------
  // Editar un movimiento pasado implica "deshacer" su efecto original sobre el
  // stock y luego "reaplicar" el efecto con los valores corregidos. Se hace
  // sobre una copia del stock para poder validar (evitar negativos) antes de
  // confirmar el cambio.
  const openEditTx = (tx) => {
    setEditingTx(tx);
    setEditTxForm({ itemId: tx.itemId, area: tx.area, type: tx.type, quantity: tx.quantity, note: tx.note || '' });
    setEditTxItemSearch('');
  };

  const closeEditTx = () => {
    setEditingTx(null);
    setEditTxForm(null);
  };

  const handleSaveEditTx = (e) => {
    e.preventDefault();
    if (!editingTx || !editTxForm) return;

    const newQty = toSafeNumber(editTxForm.quantity, { min: 0.01 });
    if (newQty === null) { alert('Cantidad inválida.'); return; }
    if (!editTxForm.itemId) { alert('Selecciona un producto.'); return; }

    const updatedItems = items.map(i => ({ ...i, currentStock: { ...i.currentStock } }));

    // 1) Revertir el efecto del movimiento original
    const oldItemIdx = updatedItems.findIndex(i => i.id === editingTx.itemId);
    if (oldItemIdx !== -1) {
      const reverseDelta = editingTx.type === 'IN' ? -editingTx.quantity : editingTx.quantity;
      updatedItems[oldItemIdx].currentStock[editingTx.area] = Number(((updatedItems[oldItemIdx].currentStock[editingTx.area] || 0) + reverseDelta).toFixed(2));
    }

    // 2) Aplicar el efecto del movimiento corregido
    const newItemIdx = updatedItems.findIndex(i => i.id === editTxForm.itemId);
    if (newItemIdx === -1) { alert('El producto seleccionado ya no existe en el catálogo.'); return; }
    const applyDelta = editTxForm.type === 'IN' ? newQty : -newQty;
    const resultStock = Number(((updatedItems[newItemIdx].currentStock[editTxForm.area] || 0) + applyDelta).toFixed(2));
    if (resultStock < 0) {
      alert(`Esta corrección dejaría el stock en negativo en ${editTxForm.area} (resultaría en ${resultStock}). Ajusta la cantidad o el tipo de movimiento.`);
      return;
    }
    updatedItems[newItemIdx].currentStock[editTxForm.area] = Math.max(0, resultStock);

    setItems(updatedItems);
    setTransactions(prev => prev.map(t => t.id === editingTx.id ? {
      ...t,
      itemId: editTxForm.itemId,
      area: editTxForm.area,
      type: editTxForm.type,
      quantity: newQty,
      isShotMode: false,
      shotsCount: null,
      note: `${editTxForm.note ? editTxForm.note : t.note} [Editado por ${operatorName} — corrección de digitación, ${new Date().toLocaleString('es-ES')}]`
    } : t));

    closeEditTx();
  };

  const handleDeleteTx = (tx) => {
    if (!window.confirm('¿Eliminar este movimiento del Kardex? Se revertirá su efecto sobre el stock. Esta acción no se puede deshacer.')) return;

    const updatedItems = items.map(i => ({ ...i, currentStock: { ...i.currentStock } }));
    const itemIdx = updatedItems.findIndex(i => i.id === tx.itemId);
    if (itemIdx !== -1) {
      const reverseDelta = tx.type === 'IN' ? -tx.quantity : tx.quantity;
      const resultStock = Number(((updatedItems[itemIdx].currentStock[tx.area] || 0) + reverseDelta).toFixed(2));
      if (resultStock < 0) {
        alert(`No se puede eliminar: dejaría el stock en negativo en ${tx.area} (resultaría en ${resultStock}). Es probable que haya movimientos posteriores que dependen de este.`);
        return;
      }
      updatedItems[itemIdx].currentStock[tx.area] = Math.max(0, resultStock);
      setItems(updatedItems);
    }

    setTransactions(prev => prev.filter(t => t.id !== tx.id));
    if (editingTx && editingTx.id === tx.id) closeEditTx();
  };

  // ---------- Historial de Kardex por producto ----------
  const getItemHistory = (itemId) => {
    return transactions
      .filter(t => t.itemId === itemId)
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Exporta el historial de un producto como PDF, usando el diálogo de
  // impresión del navegador (Guardar como PDF) en una ventana aparte para no
  // interferir con los estilos de la app.
  const handleExportHistoryPDF = (item) => {
    const history = getItemHistory(item.id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes para exportar el PDF.');
      return;
    }

    const rows = history.map(tx => `
      <tr>
        <td>${new Date(tx.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td>${tx.area}</td>
        <td style="color:${tx.type === 'IN' ? '#059669' : '#dc2626'}; font-weight:bold;">${tx.type === 'IN' ? 'ENTRADA' : 'SALIDA'}</td>
        <td style="text-align:center;">${tx.type === 'IN' ? '+' : '-'}${tx.quantity} bot.${tx.isShotMode && tx.shotsCount ? ` (${tx.shotsCount} tragos)` : ''}</td>
        <td>${tx.user || '—'}</td>
        <td>${(tx.note || '').replace(/</g, '&lt;')}</td>
      </tr>
    `).join('');

    const totalIn = history.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
    const totalOut = history.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);

    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Historial - ${item.name}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #1f2937; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .sub { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
          th { background: #f3f4f6; }
          .summary { margin-top: 16px; font-size: 12px; display: flex; gap: 24px; }
          .summary b { display: block; font-size: 14px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Historial de Movimientos — ${item.name}</h1>
        <div class="sub">${item.subcategory} · Generado el ${new Date().toLocaleString('es-ES')}</div>
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th><th>Área</th><th>Tipo</th><th>Cantidad</th><th>Registrado por</th><th>Nota</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;">Sin movimientos registrados</td></tr>'}
          </tbody>
        </table>
        <div class="summary">
          <div>Total Entradas <b style="color:#059669;">+${totalIn.toFixed(2)} bot.</b></div>
          <div>Total Salidas <b style="color:#dc2626;">-${totalOut.toFixed(2)} bot.</b></div>
          <div>Stock Actual <b>${getItemTotalStock(item)} bot.</b></div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Pequeño delay para que el navegador termine de pintar antes de abrir el diálogo de impresión
    setTimeout(() => printWindow.print(), 300);
  };

  const lowStockItems = useMemo(() => {
    const list = [];
    items.forEach(item => {
      AREAS.forEach(area => {
        const current = item.currentStock[area] || 0;
        const min = item.minStock[area] || 0;
        if (current < min) {
          list.push({ ...item, alertArea: area, currentAreaStock: current, minAreaStock: min, deficit: Number((min - current).toFixed(2)) });
        }
      });
    });
    return list;
  }, [items]);

  const rotationMetrics = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const weeklyTotals = {};
    const monthlyTotals = {};

    transactions.forEach(tx => {
      if (tx.type === 'OUT') {
        const txDate = new Date(tx.date);
        const qty = tx.quantity;
        if (txDate >= oneMonthAgo) {
          monthlyTotals[tx.itemId] = (monthlyTotals[tx.itemId] || 0) + qty;
          if (txDate >= oneWeekAgo) {
            weeklyTotals[tx.itemId] = (weeklyTotals[tx.itemId] || 0) + qty;
          }
        }
      }
    });

    const getTopItems = (totalsMap) => Object.entries(totalsMap)
      .map(([id, qty]) => ({ item: items.find(i => i.id === id), totalOut: qty }))
      .filter(x => x.item)
      .sort((a, b) => b.totalOut - a.totalOut);

    return { weekly: getTopItems(weeklyTotals), monthly: getTopItems(monthlyTotals) };
  }, [transactions, items]);

  // ---------- Portal de acceso ligero ----------
  // No es autenticación real (no hay backend ni contraseña verificable),
  // pero evita que un movimiento quede sin nombre de responsable asociado.
  if (!operatorName) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm space-y-4">
          <div className="flex items-center space-x-2 text-gray-800">
            <Lock size={22} />
            <h1 className="text-lg font-bold">Identifícate para operar</h1>
          </div>
          <p className="text-xs text-gray-500">
            Cada movimiento de inventario quedará asociado a este nombre en el Kardex.
            Esto no reemplaza un control de acceso real con contraseña.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); if (operatorInput.trim()) setOperatorName(operatorInput.trim()); }}>
            <input
              autoFocus
              type="text"
              value={operatorInput}
              onChange={e => setOperatorInput(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="mt-3 w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="text-amber-400" size={24} />
            <h2 className="text-xl font-bold">Auditoría y Reconteo Físico Semanal</h2>
          </div>
          <p className="text-indigo-200 text-sm mt-1">
            Realiza el reconteo físico semanal para detectar mermas, pérdidas o diferencias frente al sistema.
          </p>
        </div>
        <button 
          onClick={() => setAuditMode(!auditMode)}
          className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-6 py-2.5 rounded-xl transition shadow"
        >
          {auditMode ? 'Cerrar Modo Auditoría' : 'Iniciar Reconteo Físico'}
        </button>
      </div>

      {auditMode && (
        <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="text-lg font-bold text-amber-900 flex items-center">
              <CheckCircle2 className="mr-2 text-amber-600" /> Plantilla de Auditoría de Conteo Físico
            </h3>
            <button
              onClick={handleApplyAudit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center transition"
            >
              <RefreshCcw size={16} className="mr-2" /> Aplicar Ajustes al Stock
            </button>
          </div>
          <p className="text-xs text-amber-800">Ingresa el stock físico real contado en cada área. El botón de arriba escribe esas diferencias en el sistema y las deja registradas en el Kardex.</p>
          <div className="overflow-x-auto bg-white rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-amber-100/50 text-amber-900 border-b">
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-center">Área</th>
                  <th className="p-3 text-center">Sistema</th>
                  <th className="p-3 text-center">Conteo Físico Real</th>
                  <th className="p-3 text-center">Diferencia (Merma/Sobrante)</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  AREAS.map(area => {
                    const sysQty = item.currentStock[area] || 0;
                    const key = `${item.id}-${area}`;
                    const realQty = auditCounts[key] !== undefined ? auditCounts[key] : sysQty;
                    const diff = Number(((toSafeNumber(realQty, { min: 0, fallback: sysQty })) - sysQty).toFixed(2));

                    return (
                      <tr key={key} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{item.name}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            area === 'CAVA' ? 'bg-purple-100 text-purple-700' :
                            area === 'DOS SUCRES' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                          }`}>{area}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-600">{sysQty} bot.</td>
                        <td className="p-3 text-center">
                          <input 
                            type="number" 
                            step="0.05"
                            min="0"
                            value={auditCounts[key] !== undefined ? auditCounts[key] : sysQty}
                            onChange={e => setAuditCounts({...auditCounts, [key]: e.target.value})}
                            className="w-24 p-1.5 border rounded text-center font-bold text-blue-600 bg-white"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded font-bold text-xs ${
                            diff < 0 ? 'bg-red-100 text-red-700' : diff > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {diff > 0 ? `+${diff}` : diff} bot.
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Catálogo Total</p>
            <p className="text-2xl font-black text-gray-800">{items.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Alertas de Stock</p>
            <p className="text-2xl font-black text-gray-800">{lowStockItems.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowLeftRight size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Movimientos Kardex</p>
            <p className="text-2xl font-black text-gray-800">{transactions.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><ShieldAlert size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Bajas / Accidentes</p>
            <p className="text-2xl font-black text-gray-800">{writeOffs.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="mr-2 text-emerald-600" size={18} /> Top Rotación Semanal (Salidas)
          </h3>
          <div className="space-y-2">
            {rotationMetrics.weekly.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No hay salidas registradas esta semana.</p>
            ) : (
              rotationMetrics.weekly.slice(0, 5).map((row, idx) => (
                <div key={row.item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-400 text-gray-900' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{row.item.name}</p>
                      <span className="text-[10px] text-gray-500 uppercase">{row.item.subcategory}</span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 text-sm">{row.totalOut} bot. salientes</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="mr-2 text-indigo-600" size={18} /> Top Rotación Mensual (Salidas)
          </h3>
          <div className="space-y-2">
            {rotationMetrics.monthly.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No hay salidas registradas este mes.</p>
            ) : (
              rotationMetrics.monthly.slice(0, 5).map((row, idx) => (
                <div key={row.item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-purple-600 text-white' : idx === 1 ? 'bg-indigo-500 text-white' : idx === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{row.item.name}</p>
                      <span className="text-[10px] text-gray-500 uppercase">{row.item.subcategory}</span>
                    </div>
                  </div>
                  <span className="font-bold text-indigo-600 text-sm">{row.totalOut} bot. salientes</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-red-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <ShoppingCart className="mr-2 text-red-500" size={20} />
              Pedido Mínimo Recomendado para Fin de Semana
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">Productos que se encuentran por debajo del stock mínimo de seguridad en Cava o Barras.</p>
          </div>
          <button onClick={() => window.print()} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-gray-800 transition">
            <Printer size={16} className="mr-2" /> Exportar Reporte PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="p-4 font-semibold">Área Afectada</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold text-center">Stock Actual</th>
                <th className="p-4 font-semibold text-center">Mínimo Requerido</th>
                <th className="p-4 font-semibold text-center text-red-600">Sugerencia de Pedido</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">¡Excelente! Todo el stock está por encima de los mínimos de seguridad.</td></tr>
              ) : (
                lowStockItems.map((item, idx) => (
                  <tr key={`${item.id}-${item.alertArea}-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.alertArea === 'CAVA' ? 'bg-purple-100 text-purple-700' :
                        item.alertArea === 'DOS SUCRES' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                      }`}>{item.alertArea}</span>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                    <td className="p-4 text-center font-bold text-red-500">{item.currentAreaStock} bot.</td>
                    <td className="p-4 text-center text-gray-600">{item.minAreaStock} bot.</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">+ {item.deficit} bot.</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <div>
            <p className="font-semibold text-gray-700">Responsable de Inventario:</p>
            <input type="text" value={managerName} onChange={e => setManagerName(e.target.value)} className="mt-1 p-1.5 border rounded bg-white text-gray-800 font-medium w-64" />
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <p className="border-t border-gray-400 pt-2 px-12 font-bold text-gray-800">{managerName}</p>
            <p>Firma de Aprobación Semanal</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Plus className="mr-2" size={20} /> Registrar Nuevo Producto en Base de Datos</h2>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto o Licor</label>
              <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Whisky o Vino..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
              <select value={newItem.subcategory} onChange={e => setNewItem({...newItem, subcategory: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {SUBCATEGORIAS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl border">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={newItem.isFractional} onChange={e => setNewItem({...newItem, isFractional: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <span className="ml-2 text-sm font-bold text-gray-800">Fraccionar por tragos o copas (ej. Licores y Destilados)</span>
            </label>
            {newItem.isFractional && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 font-medium">Tragos por botella:</span>
                <input type="number" min="1" value={newItem.shotsPerBottle} onChange={e => setNewItem({...newItem, shotsPerBottle: e.target.value})} className="w-20 p-1 border rounded text-sm bg-white font-mono" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            <div className="bg-purple-50 p-4 rounded-xl space-y-2 border border-purple-100">
              <h3 className="font-bold text-sm text-purple-900 flex items-center"><Warehouse size={16} className="mr-1" /> CAVA (Bodega)</h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Mínimo</label>
                <input type="number" step="0.1" min="0" value={newItem.minStockCava} onChange={e => setNewItem({...newItem, minStockCava: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Inicial (Hoy)</label>
                <input type="number" step="0.05" min="0" value={newItem.stockCava} onChange={e => setNewItem({...newItem, stockCava: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl space-y-2 border border-amber-100">
              <h3 className="font-bold text-sm text-amber-900 flex items-center"><Store size={16} className="mr-1" /> DOS SUCRES (Barra)</h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Mínimo</label>
                <input type="number" step="0.1" min="0" value={newItem.minStockDos} onChange={e => setNewItem({...newItem, minStockDos: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Inicial (Hoy)</label>
                <input type="number" step="0.05" min="0" value={newItem.stockDos} onChange={e => setNewItem({...newItem, stockDos: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
              </div>
            </div>
            <div className="bg-teal-50 p-4 rounded-xl space-y-2 border border-teal-100">
              <h3 className="font-bold text-sm text-teal-900 flex items-center"><Store size={16} className="mr-1" /> MINDALA (Barra)</h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Mínimo</label>
                <input type="number" step="0.1" min="0" value={newItem.minStockMindala} onChange={e => setNewItem({...newItem, minStockMindala: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Inicial (Hoy)</label>
                <input type="number" step="0.05" min="0" value={newItem.stockMindala} onChange={e => setNewItem({...newItem, stockMindala: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center font-bold"><Plus size={18} className="mr-2" /> Guardar Producto</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center"><Package className="mr-2" size={20} /> Existencias por Áreas de Trabajo</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-56">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none bg-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <select value={selectedAreaFilter} onChange={e => setSelectedAreaFilter(e.target.value)} className="p-2 border rounded-xl text-sm outline-none bg-white">
                <option value="TODAS">Todas las subcategorías</option>
                {SUBCATEGORIAS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2 bg-white border rounded-xl p-1">
              <button
                type="button"
                onClick={() => setVolumeUnit('ml')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${volumeUnit === 'ml' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
              >ml</button>
              <button
                type="button"
                onClick={() => setVolumeUnit('oz')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${volumeUnit === 'oz' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
              >oz</button>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trago =</span>
              <input
                type="number"
                min="1"
                step="1"
                value={shotSizeMl}
                onChange={e => setShotSizeMl(toSafeNumber(e.target.value, { min: 1, fallback: shotSizeMl }))}
                className="w-16 p-1.5 border rounded-lg text-xs font-mono bg-white"
              />
              <span className="text-xs text-gray-500">ml</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 border-b">
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold text-center bg-purple-50 text-purple-900">Cava (Bodega)</th>
                <th className="p-4 font-semibold text-center bg-amber-50 text-amber-900">Dos Sucres</th>
                <th className="p-4 font-semibold text-center bg-teal-50 text-teal-900">Mindala</th>
                <th className="p-4 font-semibold text-center bg-blue-50 text-blue-900 font-bold">Total General</th>
                <th className="p-4 font-semibold text-center bg-indigo-50 text-indigo-900">Volumen Total</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter(i => selectedAreaFilter === 'TODAS' || i.subcategory === selectedAreaFilter)
                .filter(i => i.name.toLowerCase().includes(productSearch.trim().toLowerCase()))
                .map(item => {
                const total = getItemTotalStock(item);
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium text-gray-800 flex items-center">
                        {item.name}
                        {item.isFractional && <Wine size={14} className="ml-2 text-indigo-500" title="Fraccionable por tragos" />}
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{item.subcategory}</span>
                        {item.isFractional && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">{item.shotsPerBottle} tragos/bot</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center bg-purple-50/20">
                      <span className="font-bold text-purple-700">{item.currentStock.CAVA || 0} bot.</span>
                      {item.isFractional && <span className="block text-[11px] font-mono text-indigo-600">≈ {Math.round((item.currentStock.CAVA || 0) * item.shotsPerBottle)} tragos</span>}
                      <span className="block text-[10px] text-gray-400">Mín: {item.minStock.CAVA || 0}</span>
                    </td>
                    <td className="p-4 text-center bg-amber-50/20">
                      <span className="font-bold text-amber-700">{item.currentStock['DOS SUCRES'] || 0} bot.</span>
                      {item.isFractional && <span className="block text-[11px] font-mono text-indigo-600">≈ {Math.round((item.currentStock['DOS SUCRES'] || 0) * item.shotsPerBottle)} tragos</span>}
                      <span className="block text-[10px] text-gray-400">Mín: {item.minStock['DOS SUCRES'] || 0}</span>
                    </td>
                    <td className="p-4 text-center bg-teal-50/20">
                      <span className="font-bold text-teal-700">{item.currentStock.MINDALA || 0} bot.</span>
                      {item.isFractional && <span className="block text-[11px] font-mono text-indigo-600">≈ {Math.round((item.currentStock.MINDALA || 0) * item.shotsPerBottle)} tragos</span>}
                      <span className="block text-[10px] text-gray-400">Mín: {item.minStock.MINDALA || 0}</span>
                    </td>
                    <td className="p-4 text-center bg-blue-50/20 font-extrabold text-blue-700 text-base">
                      {total} bot.
                      {item.isFractional && (
                        <span className="block text-xs font-mono text-indigo-700 font-semibold">
                          ≈ {Math.round(total * item.shotsPerBottle)} tragos tot. ({shotSizeMl}ml c/u)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center bg-indigo-50/20">
                      <span className="font-bold text-indigo-700 text-sm">{formatBottlesAsVolume(total)}</span>
                      <span className="block text-[10px] text-gray-400">(botella = 750ml)</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setHistoryItem(item)}
                          title="Ver historial de movimientos"
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => openEditItem(item)}
                          title="Editar producto"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          title="Eliminar producto"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {historyItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center"><History className="mr-2" size={20} /> Historial de Movimientos</h2>
                <p className="text-sm text-gray-500 mt-0.5">{historyItem.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportHistoryPDF(historyItem)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-gray-800 transition whitespace-nowrap"
                >
                  <Printer size={16} className="mr-2" /> Exportar PDF
                </button>
                <button onClick={() => setHistoryItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 border-b">
                    <th className="p-3 font-semibold">Fecha y Hora</th>
                    <th className="p-3 font-semibold">Área</th>
                    <th className="p-3 font-semibold">Tipo</th>
                    <th className="p-3 font-semibold text-center">Cantidad</th>
                    <th className="p-3 font-semibold">Registrado por</th>
                    <th className="p-3 font-semibold">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {getItemHistory(historyItem.id).map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-500">{new Date(tx.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          tx.area === 'CAVA' ? 'bg-purple-100 text-purple-700' : tx.area === 'DOS SUCRES' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                        }`}>{tx.area}</span>
                      </td>
                      <td className="p-3">
                        {tx.type === 'IN' ? (
                          <span className="flex items-center text-xs font-bold text-emerald-700"><TrendingUp size={14} className="mr-1" /> Entrada</span>
                        ) : (
                          <span className="flex items-center text-xs font-bold text-red-700"><TrendingDown size={14} className="mr-1" /> Salida</span>
                        )}
                      </td>
                      <td className={`p-3 text-center font-bold ${tx.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'IN' ? '+' : '-'}{tx.quantity} bot.
                        {tx.isShotMode && tx.shotsCount && <span className="block text-xs font-normal text-indigo-600 font-mono">({tx.shotsCount} tragos)</span>}
                      </td>
                      <td className="p-3 text-xs text-gray-700 font-medium">{tx.user || '—'}</td>
                      <td className="p-3 text-xs text-gray-600">{tx.note}</td>
                    </tr>
                  ))}
                  {getItemHistory(historyItem.id).length === 0 && (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Este producto no tiene movimientos registrados todavía.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {editingItem && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Pencil className="mr-2" size={20} /> Editar Producto
              </h2>
              <button onClick={closeEditItem} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto o Licor</label>
                  <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
                  <select value={editForm.subcategory} onChange={e => setEditForm({...editForm, subcategory: e.target.value})} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {SUBCATEGORIAS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl border">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isFractional}
                    onChange={e => setEditForm({...editForm, isFractional: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-bold text-gray-800">Fraccionar por tragos o copas</span>
                </label>
                {editForm.isFractional && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 font-medium">Tragos por botella:</span>
                    <input
                      type="number"
                      min="1"
                      value={editForm.shotsPerBottle}
                      onChange={e => setEditForm({...editForm, shotsPerBottle: e.target.value})}
                      className="w-20 p-1 border rounded text-sm bg-white font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                <div className="bg-purple-50 p-4 rounded-xl space-y-2 border border-purple-100">
                  <h3 className="font-bold text-sm text-purple-900 flex items-center"><Warehouse size={16} className="mr-1" /> CAVA</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock Mínimo</label>
                    <input type="number" step="0.1" min="0" value={editForm.minStockCava} onChange={e => setEditForm({...editForm, minStockCava: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock Actual</label>
                    <input type="number" step="0.05" min="0" value={editForm.stockCava} onChange={e => setEditForm({...editForm, stockCava: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
                  </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl space-y-2 border border-amber-100">
                  <h3 className="font-bold text-sm text-amber-900 flex items-center"><Store size={16} className="mr-1" /> DOS SUCRES</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock Mínimo</label>
                    <input type="number" step="0.1" min="0" value={editForm.minStockDos} onChange={e => setEditForm({...editForm, minStockDos: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock Actual</label>
                    <input type="number" step="0.05" min="0" value={editForm.stockDos} onChange={e => setEditForm({...editForm, stockDos: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
                  </div>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl space-y-2 border border-teal-100">
                  <h3 className="font-bold text-sm text-teal-900 flex items-center"><Store size={16} className="mr-1" /> MINDALA</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock Mínimo</label>
                    <input type="number" step="0.1" min="0" value={editForm.minStockMindala} onChange={e => setEditForm({...editForm, minStockMindala: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock Actual</label>
                    <input type="number" step="0.05" min="0" value={editForm.stockMindala} onChange={e => setEditForm({...editForm, stockMindala: e.target.value})} className="w-full p-2 border rounded-lg bg-white" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Si cambias el "Stock Actual" aquí, quedará registrado como un ajuste manual en el Kardex para no perder trazabilidad.
              </p>

              <div className="flex justify-between items-center pt-2 border-t">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem)}
                  className="flex items-center text-red-600 hover:text-red-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-50 transition"
                >
                  <Trash2 size={16} className="mr-2" /> Eliminar Producto
                </button>
                <div className="flex space-x-2">
                  <button type="button" onClick={closeEditItem} className="px-6 py-2.5 rounded-xl border font-bold text-gray-700 hover:bg-gray-50 transition">
                    Cancelar
                  </button>
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition font-bold">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderKardex = () => {
    const selectedItemObj = items.find(i => i.id === newTransaction.itemId);
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><ArrowLeftRight className="mr-2" size={20} /> Registrar Movimiento en Kardex (Entrada / Salida por Área)</h2>
          <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
              <div className="flex space-x-1">
                <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'IN'})} className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center font-bold text-xs transition ${newTransaction.type === 'IN' ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600'}`}><TrendingUp size={14} className="mr-1" /> Entrada</button>
                <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'OUT'})} className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center font-bold text-xs transition ${newTransaction.type === 'OUT' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600'}`}><TrendingDown size={14} className="mr-1" /> Salida</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{newTransaction.type === 'IN' ? 'Área que Recibe (Proveedor)' : 'Área de Salida'}</label>
              {newTransaction.type === 'IN' ? (
                <select value={newTransaction.fromArea} onChange={e => setNewTransaction({...newTransaction, fromArea: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none font-semibold bg-white">
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : (
                <select value={newTransaction.toArea} onChange={e => setNewTransaction({...newTransaction, toArea: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none font-semibold bg-white">
                  <option value="DOS SUCRES">DOS SUCRES (Barra)</option>
                  <option value="MINDALA">MINDALA (Barra)</option>
                  <option value="CAVA">CAVA (Ajuste Bodega)</option>
                </select>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
              <div className="relative mb-1.5">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={transactionItemSearch}
                  onChange={e => setTransactionItemSearch(e.target.value)}
                  placeholder="Filtrar productos..."
                  className="w-full pl-8 pr-2 py-1.5 border rounded-lg text-xs outline-none bg-white"
                />
              </div>
              <select required value={newTransaction.itemId} onChange={e => setNewTransaction({...newTransaction, itemId: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none bg-white">
                <option value="" disabled>Seleccione producto o licor...</option>
                {items
                  .filter(item => item.name.toLowerCase().includes(transactionItemSearch.trim().toLowerCase()))
                  .map(item => <option key={item.id} value={item.id}>{item.name} (Tot: {getItemTotalStock(item)} bot.)</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad / Unidad de Medida</label>
              {selectedItemObj && selectedItemObj.isFractional ? (
                <div>
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-2 text-xs">
                    <button type="button" onClick={() => setNewTransaction({...newTransaction, isShotMode: false})} className={`flex-1 py-1 rounded-lg ${!newTransaction.isShotMode ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-600'}`}>Botellas Completas</button>
                    <button type="button" onClick={() => setNewTransaction({...newTransaction, isShotMode: true})} className={`flex-1 py-1 rounded-lg ${newTransaction.isShotMode ? 'bg-white shadow text-indigo-700 font-bold' : 'text-gray-600'}`}>Tragos / Copas</button>
                  </div>
                  {newTransaction.isShotMode ? (
                    <div className="flex items-center">
                      <input required type="number" min="0.1" step="0.1" value={newTransaction.shotsCount} onChange={e => setNewTransaction({...newTransaction, shotsCount: e.target.value})} className="w-full p-2.5 border rounded-xl font-mono" placeholder="Ej. 5.5 tragos" />
                      <span className="ml-2 text-xs text-gray-500 font-medium">tragos</span>
                    </div>
                  ) : (
                    <input required type="number" step="0.05" min="0.05" value={newTransaction.quantity} onChange={e => setNewTransaction({...newTransaction, quantity: e.target.value})} className="w-full p-2.5 border rounded-xl font-mono" placeholder="Ej. 1.5 botellas" />
                  )}
                </div>
              ) : (
                <input required type="number" step="0.05" min="0.05" value={newTransaction.quantity} onChange={e => setNewTransaction({...newTransaction, quantity: e.target.value})} className="w-full p-2.5 border rounded-xl font-mono" placeholder="Ej. 1.5 botellas" />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota o Motivo</label>
              <input type="text" value={newTransaction.note} onChange={e => setNewTransaction({...newTransaction, note: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none" placeholder="Ej. Venta en barra, factura proveedor..." />
            </div>
            <div className="md:col-span-4 flex justify-end pt-2">
              <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition font-bold">Registrar Movimiento en Kardex</button>
            </div>
          </form>
        </div>

        <div className="bg-red-50/50 p-6 rounded-2xl shadow-sm border border-red-200">
          <h2 className="text-lg font-bold text-red-900 mb-2 flex items-center"><ShieldAlert className="mr-2 text-red-600" size={20} /> Registro de Bajas por Accidentes y Roturas</h2>
          <p className="text-xs text-red-700 mb-4">Utiliza esta sección exclusivamente para reportar botellas rotas o perdidas por accidentes en barra o cava.</p>
          <form onSubmit={handleAddWriteOff} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área del Accidente</label>
              <select value={newWriteOff.area} onChange={e => setNewWriteOff({...newWriteOff, area: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none font-semibold bg-white">
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto Afectado</label>
              <div className="relative mb-1.5">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={writeOffItemSearch}
                  onChange={e => setWriteOffItemSearch(e.target.value)}
                  placeholder="Filtrar productos..."
                  className="w-full pl-8 pr-2 py-1.5 border rounded-lg text-xs outline-none bg-white"
                />
              </div>
              <select required value={newWriteOff.itemId} onChange={e => setNewWriteOff({...newWriteOff, itemId: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none bg-white">
                <option value="" disabled>Seleccione producto...</option>
                {items
                  .filter(item => item.name.toLowerCase().includes(writeOffItemSearch.trim().toLowerCase()))
                  .map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Botellas Rotas</label>
              <input required type="number" step="0.05" min="0.05" value={newWriteOff.quantity} onChange={e => setNewWriteOff({...newWriteOff, quantity: e.target.value})} className="w-full p-2.5 border rounded-xl font-mono bg-white" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Accidente</label>
              <input type="text" value={newWriteOff.reason} onChange={e => setNewWriteOff({...newWriteOff, reason: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none bg-white" placeholder="Ej. Caída accidental de botella en barra Dos Sucres..." />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition font-bold w-full">Aplicar Baja</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h2 className="text-lg font-bold text-gray-800">Historial General de Kardex</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b">
                  <th className="p-4 font-semibold">Fecha y Hora</th>
                  <th className="p-4 font-semibold">Área</th>
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Producto</th>
                  <th className="p-4 font-semibold text-center">Cantidad</th>
                  <th className="p-4 font-semibold">Registrado por</th>
                  <th className="p-4 font-semibold">Detalle / Nota</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const item = items.find(i => i.id === tx.itemId);
                  const date = new Date(tx.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
                  return (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-xs text-gray-500">{date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          tx.area === 'CAVA' ? 'bg-purple-100 text-purple-700' : tx.area === 'DOS SUCRES' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                        }`}>{tx.area}</span>
                      </td>
                      <td className="p-4">
                        {tx.type === 'IN' ? (
                          <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg w-max"><TrendingUp size={14} className="mr-1" /> ENTRADA</span>
                        ) : (
                          <span className="flex items-center text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg w-max"><TrendingDown size={14} className="mr-1" /> SALIDA</span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-gray-800">{item ? item.name : 'Ítem (eliminado del catálogo)'}</td>
                      <td className={`p-4 text-center font-bold ${tx.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'IN' ? '+' : '-'}{tx.quantity} bot.
                        {tx.isShotMode && tx.shotsCount && <span className="block text-xs font-normal text-indigo-600 font-mono">({tx.shotsCount} tragos)</span>}
                      </td>
                      <td className="p-4 text-xs text-gray-700 font-medium">{tx.user || '—'}</td>
                      <td className="p-4 text-xs text-gray-600">{tx.note}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => openEditTx(tx)} title="Corregir movimiento" className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteTx(tx)} title="Eliminar movimiento" className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr><td colSpan="8" className="p-8 text-center text-gray-500">No hay movimientos registrados en el Kardex.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editingTx && editTxForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <Pencil className="mr-2" size={20} /> Corregir Movimiento del Kardex
                </h2>
                <button onClick={closeEditTx} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveEditTx} className="p-6 space-y-4">
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  Al guardar, se revierte el efecto original de este movimiento sobre el stock y se aplica de nuevo con los valores corregidos.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
                  <div className="flex space-x-1">
                    <button type="button" onClick={() => setEditTxForm({...editTxForm, type: 'IN'})} className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center font-bold text-xs transition ${editTxForm.type === 'IN' ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600'}`}><TrendingUp size={14} className="mr-1" /> Entrada</button>
                    <button type="button" onClick={() => setEditTxForm({...editTxForm, type: 'OUT'})} className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center font-bold text-xs transition ${editTxForm.type === 'OUT' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600'}`}><TrendingDown size={14} className="mr-1" /> Salida</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                  <select value={editTxForm.area} onChange={e => setEditTxForm({...editTxForm, area: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none font-semibold bg-white">
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                  <div className="relative mb-1.5">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={editTxItemSearch}
                      onChange={e => setEditTxItemSearch(e.target.value)}
                      placeholder="Filtrar productos..."
                      className="w-full pl-8 pr-2 py-1.5 border rounded-lg text-xs outline-none bg-white"
                    />
                  </div>
                  <select required value={editTxForm.itemId} onChange={e => setEditTxForm({...editTxForm, itemId: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none bg-white">
                    {items
                      .filter(item => item.name.toLowerCase().includes(editTxItemSearch.trim().toLowerCase()))
                      .map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (botellas/unidades)</label>
                  <input required type="number" step="0.05" min="0.05" value={editTxForm.quantity} onChange={e => setEditTxForm({...editTxForm, quantity: e.target.value})} className="w-full p-2.5 border rounded-xl font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota de corrección (opcional)</label>
                  <input type="text" value={editTxForm.note} onChange={e => setEditTxForm({...editTxForm, note: e.target.value})} className="w-full p-2.5 border rounded-xl outline-none" placeholder="Ej. Se digitó 5 en vez de 0.5" />
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <button type="button" onClick={() => handleDeleteTx(editingTx)} className="flex items-center text-red-600 hover:text-red-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-50 transition">
                    <Trash2 size={16} className="mr-2" /> Eliminar
                  </button>
                  <div className="flex space-x-2">
                    <button type="button" onClick={closeEditTx} className="px-6 py-2.5 rounded-xl border font-bold text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition font-bold">Guardar Corrección</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black tracking-tight text-white flex items-center"><Wine className="mr-2 text-amber-400" /> InvManager Bar</h1>
          <p className="text-gray-400 text-xs mt-1">Cava, Dos Sucres & Mindala</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-800'}`}><LayoutDashboard size={18} className="mr-3" /> Dashboard y Pedidos</button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-800'}`}><Package size={18} className="mr-3" /> Inventario por Áreas</button>
          <button onClick={() => setActiveTab('kardex')} className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'kardex' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-800'}`}><ArrowLeftRight size={18} className="mr-3" /> Kardex y Bajas</button>
        </nav>
        <div className="p-6 mt-auto">
          <div className="bg-gray-800 p-4 rounded-xl space-y-2">
            <p className="text-xs text-gray-400 font-semibold">Operador Activo:</p>
            <p className="text-xs font-bold text-amber-400 truncate">{operatorName}</p>
            <button onClick={() => setOperatorName('')} className="text-[10px] text-gray-400 hover:text-white underline">Cambiar operador</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              {activeTab === 'dashboard' && 'Panel de Control y Pedidos Semanales'}
              {activeTab === 'inventory' && 'Inventario Fraccionado por Áreas'}
              {activeTab === 'kardex' && 'Control de Movimientos y Mermas'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'dashboard' && 'Visualiza rotación semanal/mensual, auditoría y sugerencias de compra.'}
              {activeTab === 'inventory' && 'Consulta existencias exactas en botellas y equivalencias en tragos.'}
              {activeTab === 'kardex' && 'Gestiona entradas, despachos entre barras y registro de accidentes.'}
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border text-xs text-gray-600 font-semibold">
            Fecha de Operación: <span className="text-blue-600">11 Ago 2026</span>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'kardex' && renderKardex()}
      </main>
    </div>
  );
}
