export default {
  editor: {
    label: {
      en: "Tarot Card Reader",
    },
    icon: "cards",
  },
  properties: {
    // Data Section
    cardsData: {
      label: { en: "Bind Cards" },
      type: "Array",
      section: "settings",
      bindable: true,
      defaultValue: [],
      options: {
        item: {
          type: "Object",
          defaultValue: {
            id: "",
            card_title: "",
            card_number: "",
            image: { url: "" },
            card_description: "",
            long_description: "",
            description_reversed: "",
            card_meaning: [],
            card_meaning_reversed: [],
          },
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: "array",
        tooltip:
          "Bind your tarot cards collection here. Each card should have properties like card_title, card_number, image, etc.",
      },
      /* wwEditor:end */
    },
    resultCards: {
      label: { en: "Dealt Cards (Output)" },
      type: "Array",
      section: "settings",
      bindable: true,
      bindingDirection: "out",
      defaultValue: [],
      options: {
        item: {
          type: "Object",
          defaultValue: {
            id: "",
            title: "",
            cardNumber: "",
            imageUrl: "",
            description: "",
            long_description: "",
            description_reversed: "",
            card_meaning: [],
            card_meaning_reversed: [],
            isFlipped: false,
            index: 0,
          },
        },
      },
      /* wwEditor:start */
      hidden: false,
      bindingValidation: {
        type: "array",
        tooltip:
          "Output binding: This will contain the dealt cards after shuffling. Bind this to a variable to access the dealt cards data.",
      },
      /* wwEditor:end */
    },
    numberOfCards: {
      label: { en: "Number of Cards" },
      type: "Number",
      section: "settings",
      bindable: true,
      defaultValue: 3,
      options: {
        min: 1,
        max: 9,
        step: 1,
      },
    },

    // Appearance Section
    backgroundColor: {
      label: { en: "Background Color" },
      type: "Color",
      section: "style",
      defaultValue: "#38074a",
      states: true,
      classes: true,
    },
    deckBorderColor: {
      label: { en: "Deck Border Color" },
      type: "Color",
      section: "style",
      defaultValue: "#9e15bf",
      states: true,
      classes: true,
    },
    placeholderBorderColor: {
      label: { en: "Placeholder Border Color" },
      type: "Color",
      section: "style",
      defaultValue: "#4ac6d2",
      states: true,
      classes: true,
    },
    placeholderBackgroundColor: {
      label: { en: "Placeholder Background" },
      type: "Color",
      section: "style",
      defaultValue: "transparent",
      states: true,
      classes: true,
    },

    // Button Styling
    buttonBackgroundColor: {
      label: { en: "Button Background" },
      type: "Color",
      section: "style",
      defaultValue: "#9e15bf",
      states: true,
      classes: true,
    },
    buttonTextColor: {
      label: { en: "Button Text Color" },
      type: "Color",
      section: "style",
      defaultValue: "#ffffff",
      states: true,
      classes: true,
    },
    buttonText: {
      label: { en: "Button Text" },
      type: "Text",
      section: "settings",
      defaultValue: "Shuffle & Reveal",
      bindable: true,
    },

    // Card Styling
    cardbackImageUrl: {
      label: { en: "Card Back Image" },
      type: "Text",
      section: "style",
      defaultValue:
        "https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg",
      bindable: true,
    },
    cardTextColor: {
      label: { en: "Card Text Color" },
      type: "Color",
      section: "style",
      defaultValue: "#f8f0fc",
      states: true,
      classes: true,
    },
    titleColor: {
      label: { en: "Title Color" },
      type: "Color",
      section: "style",
      defaultValue: "#f8f0fc",
      states: true,
      classes: true,
    },
    titleFontSize: {
      label: { en: "Title Font Size" },
      type: "Number",
      section: "style",
      defaultValue: 14,
      options: {
        min: 8,
        max: 24,
        step: 1,
      },
      states: true,
      classes: true,
    },

    // Overlay Settings
    overlayText: {
      label: { en: "Deck Overlay Text" },
      type: "Text",
      section: "settings",
      defaultValue: "Click to shuffle",
      bindable: true,
    },
    overlayTextColor: {
      label: { en: "Overlay Text Color" },
      type: "Color",
      section: "style",
      defaultValue: "#ffffff",
      states: true,
      classes: true,
    },
    overlayTextSize: {
      label: { en: "Overlay Text Size" },
      type: "Number",
      section: "style",
      defaultValue: 14,
      options: {
        min: 8,
        max: 32,
        step: 1,
      },
      states: true,
      classes: true,
    },

    // Card Flipping
    enableCardFlipping: {
      label: { en: "Enable Card Flipping" },
      type: "OnOff",
      section: "settings",
      defaultValue: false,
      bindable: true,
    },
    cardFlipProbability: {
      label: { en: "Flip Probability (%)" },
      type: "Number",
      section: "settings",
      defaultValue: 20,
      options: {
        min: 0,
        max: 100,
        step: 5,
      },
      hidden: (content) => !content.enableCardFlipping,
      bindable: true,
    },
    maxFlippedCards: {
      label: { en: "Max Flipped Cards" },
      type: "Number",
      section: "settings",
      defaultValue: 1,
      options: {
        min: 1,
        max: 9,
        step: 1,
      },
      hidden: (content) => !content.enableCardFlipping,
      bindable: true,
    },

    // Layout
    minHeight: {
      label: { en: "Minimum Height" },
      type: "Number",
      section: "layout",
      defaultValue: 450,
      options: {
        min: 300,
        max: 800,
        step: 10,
      },
      states: true,
      classes: true,
    },

    // Debug
    showDebugInfo: {
      label: { en: "Show Debug Info" },
      type: "OnOff",
      section: "settings",
      defaultValue: false,
      /* wwEditor:start */
      editorOnly: true,
      /* wwEditor:end */
    },
  },
  triggerEvents: [
    {
      name: "cards-dealt",
      label: { en: "Cards Dealt" },
      event: {
        cards: { type: "array", label: { en: "Dealt Cards" } },
        count: { type: "number", label: { en: "Card Count" } },
      },
      getTestEvent: () => ({
        cards: [],
        count: 0,
      }),
    },
    {
      name: "dealt-cards-updated",
      label: { en: "Dealt Cards Updated" },
      event: {
        cards: { type: "array", label: { en: "Updated Cards" } },
        count: { type: "number", label: { en: "Card Count" } },
      },
    },
    {
      name: "cards-cleared",
      label: { en: "Cards Cleared" },
      event: {},
    },
  ],
};
