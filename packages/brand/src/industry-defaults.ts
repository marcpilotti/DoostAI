/**
 * Industry-specific fallback colors and fonts.
 * Used when brand analysis cannot extract reliable values from a website.
 */

export const INDUSTRY_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  "Skönhet & Kosmetik": { primary: "#C9A96E", secondary: "#F5F0EB", accent: "#8B6F47" },
  "Mode & Skönhet": { primary: "#C9A96E", secondary: "#F5F0EB", accent: "#8B6F47" },
  "IT & Tech": { primary: "#2563EB", secondary: "#1E293B", accent: "#06B6D4" },
  "SaaS": { primary: "#6366F1", secondary: "#1E293B", accent: "#818CF8" },
  "SaaS & Molntjänster": { primary: "#6366F1", secondary: "#1E293B", accent: "#818CF8" },
  "E-handel": { primary: "#7C3AED", secondary: "#F5F3FF", accent: "#A78BFA" },
  "Hotell & Restaurang": { primary: "#92400E", secondary: "#FEF3C7", accent: "#D97706" },
  "Bygg & Fastigheter": { primary: "#1E3A5F", secondary: "#E2E8F0", accent: "#F59E0B" },
  "Hälsa & Sjukvård": { primary: "#059669", secondary: "#ECFDF5", accent: "#0D9488" },
  "Finans & Försäkring": { primary: "#1E3A5F", secondary: "#F1F5F9", accent: "#0EA5E9" },
  "Träning & Fritid": { primary: "#DC2626", secondary: "#1E293B", accent: "#F97316" },
  "Utbildning": { primary: "#2563EB", secondary: "#EFF6FF", accent: "#3B82F6" },
  "Fordon & Transport": { primary: "#1E3A5F", secondary: "#F1F5F9", accent: "#EF4444" },
  "Konsult & Rådgivning": { primary: "#1E40AF", secondary: "#F8FAFC", accent: "#3B82F6" },
  "Tillverkning & Industri": { primary: "#374151", secondary: "#F3F4F6", accent: "#F59E0B" },
  "Juridik & Redovisning": { primary: "#1E3A5F", secondary: "#F8FAFC", accent: "#B45309" },
  "Livsmedel & Dagligvaror": { primary: "#15803D", secondary: "#F0FDF4", accent: "#EAB308" },
  "Marknadsföring & Media": { primary: "#7C3AED", secondary: "#1E293B", accent: "#EC4899" },
  "Rekrytering & Bemanning": { primary: "#0D9488", secondary: "#F0FDFA", accent: "#6366F1" },
  "Energi & Miljö": { primary: "#15803D", secondary: "#ECFDF5", accent: "#22D3EE" },
  "Kultur & Nöje": { primary: "#9333EA", secondary: "#1E1B2E", accent: "#F472B6" },
  "Detaljhandel": { primary: "#DC2626", secondary: "#FEF2F2", accent: "#F97316" },
  "Flyg & Resebolag": { primary: "#0369A1", secondary: "#F0F9FF", accent: "#06B6D4" },
  "Elektronik & Imaging": { primary: "#1E293B", secondary: "#F1F5F9", accent: "#EF4444" },
};

export const INDUSTRY_FONTS: Record<string, { heading: string; body: string }> = {
  "Skönhet & Kosmetik": { heading: "Playfair Display", body: "Lato" },
  "Mode & Skönhet": { heading: "Playfair Display", body: "Lato" },
  "IT & Tech": { heading: "Inter", body: "Inter" },
  "SaaS": { heading: "Inter", body: "Inter" },
  "SaaS & Molntjänster": { heading: "Inter", body: "Inter" },
  "E-handel": { heading: "DM Sans", body: "DM Sans" },
  "Hotell & Restaurang": { heading: "Cormorant Garamond", body: "Open Sans" },
  "Bygg & Fastigheter": { heading: "Montserrat", body: "Open Sans" },
  "Hälsa & Sjukvård": { heading: "Nunito", body: "Open Sans" },
  "Finans & Försäkring": { heading: "IBM Plex Sans", body: "IBM Plex Sans" },
  "Träning & Fritid": { heading: "Oswald", body: "Open Sans" },
  "Utbildning": { heading: "Poppins", body: "Open Sans" },
  "Fordon & Transport": { heading: "Montserrat", body: "Open Sans" },
  "Konsult & Rådgivning": { heading: "DM Sans", body: "DM Sans" },
  "Tillverkning & Industri": { heading: "Roboto", body: "Roboto" },
  "Juridik & Redovisning": { heading: "Merriweather", body: "Source Sans 3" },
  "Livsmedel & Dagligvaror": { heading: "Nunito", body: "Open Sans" },
  "Marknadsföring & Media": { heading: "Space Grotesk", body: "DM Sans" },
  "Rekrytering & Bemanning": { heading: "DM Sans", body: "DM Sans" },
  "Energi & Miljö": { heading: "Montserrat", body: "Open Sans" },
  "Kultur & Nöje": { heading: "Abril Fatface", body: "Lato" },
  "Detaljhandel": { heading: "DM Sans", body: "DM Sans" },
  "Flyg & Resebolag": { heading: "Poppins", body: "Open Sans" },
  "Elektronik & Imaging": { heading: "Inter", body: "Inter" },
};

export const KNOWN_FONTS = new Set([
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "DM Sans",
  "Playfair Display", "Merriweather", "Source Sans 3", "Nunito", "Oswald",
  "Raleway", "IBM Plex Sans", "Space Grotesk", "Cormorant Garamond",
  "Abril Fatface", "Work Sans", "Barlow", "Manrope", "Sora", "Outfit",
  "Plus Jakarta Sans", "Figtree", "Geist", "JetBrains Mono",
  "Georgia", "Times New Roman", "Verdana", "Trebuchet MS",
  "Noto Sans", "Noto Serif", "PT Sans", "PT Serif", "Ubuntu",
  "Cabin", "Mulish", "Quicksand", "Rubik", "Karla",
]);
