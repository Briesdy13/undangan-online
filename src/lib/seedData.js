export const templates = [
  { id: "blue-islamic", name: "Blue Islamic", icon: "🕌", tier: "basic", description: "Royal blue mosque, clean premium Islamic layout" },
  { id: "gold-luxury", name: "Gold Luxury", icon: "👑", tier: "premium", description: "Royal gold, warm luxury ceremony" },
  { id: "emerald-mosque", name: "Emerald Mosque", icon: "💚", tier: "premium", description: "Emerald glass, mosque glow, modern Islamic" },
  { id: "white-elegant", name: "White Elegant", icon: "🤍", tier: "basic", description: "White pearl, clean minimalist premium" },
  { id: "dark-premium", name: "Dark Premium", icon: "✨", tier: "premium", description: "Black gold night luxury, dramatic premium" },
  { id: "royal-sand", name: "Royal Sand", icon: "🏜️", tier: "premium", description: "Desert palace, champagne sand, exclusive luxury" },
];

export const featureAccess = {
  basic: {
    themes: ["blue-islamic", "white-elegant"],
    features: ["data", "gallery", "guests", "rsvp", "wishes", "preview", "publish"],
  },
  premium: {
    themes: ["blue-islamic", "gold-luxury", "emerald-mosque", "white-elegant", "dark-premium", "royal-sand"],
    features: ["data", "gallery", "theme", "guests", "rsvp", "wishes", "gift", "music", "preview", "publish", "checkin"],
  },
};
