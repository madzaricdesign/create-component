export default {
  name: "tarot-card-reader",
  version: "0.1.0",
  editor: {
    label: {
      en: "Tarot Card Reader",
    },
  },
  properties: {
    backgroundColor: {
      label: {
        en: "Background Color",
      },
      type: "Color",
      defaultValue: "#38074a",
      section: "Colors",
      description: {
        en: "Controls the background of the component",
      },
    },
    deckBorderColor: {
      label: {
        en: "Deck Border Color",
      },
      type: "Color",
      defaultValue: "#9e15bf",
      section: "Colors",
      description: {
        en: "Controls the border color of the deck",
      },
    },
    placeholderBorderColor: {
      label: {
        en: "Result Placeholder Border Color",
      },
      type: "Color",
      defaultValue: "#4ac6d2",
      section: "Colors",
      description: {
        en: "Controls the border color of the result placeholder cards",
      },
    },
    placeholderBackgroundColor: {
      label: {
        en: "Result Placeholder Background Color",
      },
      type: "Color",
      defaultValue: "transparent",
      section: "Colors",
      description: {
        en: "Controls the background color of the result placeholder cards",
      },
    },
    buttonBackgroundColor: {
      label: {
        en: "Button Background Color",
      },
      type: "Color",
      defaultValue: "#9e15bf",
      section: "Colors",
      description: {
        en: "Controls the background color of the shuffle and reveal button",
      },
    },
    buttonTextColor: {
      label: {
        en: "Button Text Color",
      },
      type: "Color",
      defaultValue: "#ffffff",
      section: "Colors",
      description: {
        en: "Controls the text color of the shuffle and reveal button",
      },
    },
    lightColor: {
      label: {
        en: "Card Text Color",
      },
      type: "Color",
      defaultValue: "#f8f0fc",
      section: "Colors",
      description: {
        en: "Controls the text color on cards",
      },
    },
    titleColor: {
      label: {
        en: "Title Text Color",
      },
      type: "Color",
      defaultValue: "#f8f0fc",
      section: "Colors",
      description: {
        en: "Controls the text color of the card titles below the cards",
      },
    },
    titleFontSize: {
      label: {
        en: "Title Font Size",
      },
      type: "Number",
      options: {
        min: 8,
        max: 24,
        step: 1,
      },
      defaultValue: 14,
      section: "Typography",
      description: {
        en: "Controls the font size of card titles below the cards (in pixels)",
      },
    },
    cardbackImageUrl: {
      label: {
        en: "Card Back Image URL",
      },
      type: "Text",
      defaultValue:
        "https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg",
      section: "Images",
    },
    apiUrl: {
      label: {
        en: "Tarot API URL",
      },
      type: "Text",
      defaultValue:
        "https://b145kh3.myrdbx.io/wp-json/wp/v2/waite-tarot?per_page=80",
      section: "Data",
      description: {
        en: "API endpoint for tarot card data (fetches all cards in the deck)",
      },
    },
    defaultCardOption: {
      label: {
        en: "Number of Cards",
      },
      type: "Number",
      options: {
        min: 1,
        max: 9,
        step: 1,
      },
      defaultValue: 3,
      section: "Cards",
      bindable: true,
      required: true,
      description: {
        en: "The number of tarot cards that will be revealed (1-9)",
      },
    },
    cardPattern: {
      label: { en: "Pattern" },
      type: "TextSelect",
      section: "Cards",
      bindable: true,
      defaultValue: "default",
      options: {
        options: [
          { value: "default", label: "Default" },
          { value: "relationship", label: "Relationship" },
        ],
      },
      description: {
        en: "Choose how the placeholders/cards are arranged when multiple cards are dealt.",
      },
    },
    enableCardFlipping: {
      label: { en: "Enable Upside Down Cards" },
      type: "OnOff",
      section: "Cards",
      bindable: true,
      defaultValue: false,
      description: {
        en: "Allow cards to appear upside down (reversed) when dealt.",
      },
    },
    cardFlipProbability: {
      label: { en: "Flip Probability (%)" },
      type: "Number",
      section: "Cards",
      bindable: true,
      defaultValue: 20,
      options: {
        min: 0,
        max: 100,
        step: 5,
      },
      hidden: (content) => !content.enableCardFlipping,
      description: {
        en: "Probability of any card being flipped upside down (0-100%).",
      },
    },
    maxFlippedCards: {
      label: { en: "Max Flipped Cards" },
      type: "Number",
      section: "Cards",
      bindable: true,
      defaultValue: 1,
      options: {
        min: 1,
        max: 9,
        step: 1,
      },
      hidden: (content) => !content.enableCardFlipping,
      description: {
        en: "Maximum number of cards that can be flipped in a single deal.",
      },
    },
    buttonText: {
      label: {
        en: "Button Text",
      },
      type: "Text",
      defaultValue: "Shuffle & Reveal",
      section: "Content",
    },
    resultCards: {
      label: {
        en: "Result Cards",
      },
      type: "Array",
      section: "Data",
      bindable: true,
      defaultValue: [],
      options: {
        item: {
          type: "Object",
          defaultValue: {
            id: "",
            title: "",
            cardNumber: "",
            imageUrl: "",
            index: 0,
            cardFlipped: false,
          },
          options: {
            title: {
              label: {
                en: "Title",
              },
              type: "Text",
              defaultValue: "",
            },
            id: {
              label: {
                en: "ID",
              },
              type: "Text",
              defaultValue: "",
            },
            cardNumber: {
              label: {
                en: "Card Number",
              },
              type: "Text",
              defaultValue: "",
            },
            imageUrl: {
              label: {
                en: "Image URL",
              },
              type: "Text",
              defaultValue: "",
            },
            index: {
              label: {
                en: "Index",
              },
              type: "Number",
              defaultValue: 0,
            },
            cardFlipped: {
              label: {
                en: "Card Flipped",
              },
              type: "Boolean",
              defaultValue: false,
            },
          },
        },
      },
      description: {
        en: "Result of dealt cards, bind to a variable to access",
      },
    },
    showDebugInfo: {
      label: {
        en: "Show Debug Info",
      },
      type: "OnOff",
      defaultValue: false,
      section: "Debug",
      description: {
        en: "Display debug information about the component's state",
      },
    },
  },
  actions: [
    {
      name: "getCards",
      label: {
        en: "Get Dealt Cards",
      },
      description: {
        en: "Retrieve the currently dealt cards",
      },
      result: {
        type: "Array",
      },
    },
    {
      name: "clearCards",
      label: {
        en: "Clear Cards",
      },
      description: {
        en: "Clear all dealt cards",
      },
      result: {
        type: "Boolean",
      },
    },
    {
      name: "getCardCount",
      label: {
        en: "Card Count",
      },
      description: {
        en: "Get the number of currently dealt cards",
      },
      result: {
        type: "Number",
      },
    },
    {
      name: "updateVariableById",
      label: {
        en: "Update Variable By ID",
      },
      description: {
        en: "Update a WeWeb variable with card data using its ID",
      },
      properties: {
        variableId: {
          label: {
            en: "Variable ID",
          },
          type: "Text",
          description: {
            en: "The UUID of the WeWeb variable to update",
          },
          required: true,
        },
      },
      result: {
        type: "Boolean",
      },
    },
  ],
  triggerEvents: [
    {
      name: "cardsDealt",
      label: {
        en: "Cards Dealt",
      },
      description: {
        en: "Triggered when cards are dealt, includes card data",
      },
      event: {
        count: { type: "Number", label: "Dealt Card Count" },
        firstCardTitle: { type: "Text", label: "First Card Title" },
        cards: { type: "Array", label: "All Cards (Optimized)" },
        card1: { type: "Object", label: "Card 1" },
        card2: { type: "Object", label: "Card 2" },
        card3: { type: "Object", label: "Card 3" },
        card4: { type: "Object", label: "Card 4" },
        card5: { type: "Object", label: "Card 5" },
        cardsJson: { type: "Text", label: "All Cards (JSON)" },
        rawCards: { type: "Array", label: "All Dealt Cards (Raw)" },
      },
    },
    {
      name: "cardsCleared",
      label: {
        en: "Cards Cleared",
      },
      description: {
        en: "Triggered when cards are cleared",
      },
      event: {},
    },
  ],
};
