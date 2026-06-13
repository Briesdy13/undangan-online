export const templates = [
  { id: "blue-islamic", name: "Blue Islamic", icon: "🕌", tier: "basic", badge: "Classic", description: "Royal navy Islamic mosque with gold arabesque" },
  { id: "emerald-mosque", name: "Emerald Mosque", icon: "💚", tier: "premium", badge: "Terlaris", description: "Emerald glass mosque with geometric glow" },
  { id: "gold-luxury", name: "Gold Luxury", icon: "👑", tier: "premium", badge: "Premium", description: "Cream marble gold royal celebration" },
  { id: "white-elegant", name: "White Elegant", icon: "🤍", tier: "basic", badge: "Elegant", description: "Pearl white soft gold minimal luxury" },
  { id: "dark-premium", name: "Dark Premium", icon: "✨", tier: "premium", badge: "Exclusive", description: "Black cinematic glass gold luxury" },
  { id: "royal-sand", name: "Royal Sand", icon: "🏜️", tier: "premium", badge: "New", description: "Champagne desert palace premium theme" },
];

export const featureAccess = {
  basic: {
    themes: ["blue-islamic", "white-elegant"],
    features: ["data", "gallery", "guests", "rsvp", "wishes", "preview", "publish"],
  },
  premium: {
    themes: ["blue-islamic", "emerald-mosque", "gold-luxury", "white-elegant", "dark-premium", "royal-sand"],
    features: ["data", "gallery", "theme", "guests", "rsvp", "wishes", "gift", "music", "preview", "publish", "timeline", "qris"],
  },
};
