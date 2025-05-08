export default {
  name: "tarot-card-reader",
  version: "0.1.0",
  editor: {
    label: {
      en: "Tarot Card Reader",
    },
  },
  properties: {
    mainColor: {
      label: {
        en: "Main Color",
      },
      type: "Color",
      defaultValue: "#9e15bf",
    },
    secondaryColor: {
      label: {
        en: "Secondary Color",
      },
      type: "Color",
      defaultValue: "#4ac6d2",
    },
    darkColor: {
      label: {
        en: "Dark Background Color",
      },
      type: "Color",
      defaultValue: "#38074a",
    },
    lightColor: {
      label: {
        en: "Light Text Color",
      },
      type: "Color",
      defaultValue: "#f8f0fc",
    },
    title: {
      label: {
        en: "Title",
      },
      type: "Text",
      defaultValue: "Mystic Tarot Reading",
    },
    introText: {
      label: {
        en: "Introduction Text",
      },
      type: "Text",
      defaultValue:
        "Focus on your question as the cards are shuffled and revealed from the Rider-Waite deck",
    },
    cardbackImageUrl: {
      label: {
        en: "Card Back Image URL",
      },
      type: "Text",
      defaultValue:
        "https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg",
    },
    apiUrl: {
      label: {
        en: "Tarot API URL",
      },
      type: "Text",
      defaultValue:
        "https://b145kh3.myrdbx.io/wp-json/wp/v2/waite-tarot?per_page=80",
    },
    cardOptions: {
      label: {
        en: "Card Number Options",
      },
      type: "Array",
      defaultValue: [
        { value: "1", label: "1 Card (Simple Reading)" },
        { value: "3", label: "3 Cards (Past, Present, Future)" },
        { value: "6", label: "6 Cards (Celtic Cross Simplified)" },
        { value: "9", label: "9 Cards (Extended Reading)" },
      ],
    },
    defaultCardOption: {
      label: {
        en: "Default Number of Cards",
      },
      type: "Number",
      defaultValue: 3,
    },
    buttonText: {
      label: {
        en: "Button Text",
      },
      type: "Text",
      defaultValue: "Shuffle & Reveal",
    },
  },
};
