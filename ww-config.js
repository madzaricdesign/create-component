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
      options: {
        item: {
          type: "Object",
          defaultValue: {},
          options: {
            title: {
              label: {
                en: "Title",
              },
              type: "Text",
            },
            id: {
              label: {
                en: "ID",
              },
              type: "Text",
            },
            cardNumber: {
              label: {
                en: "Card Number",
              },
              type: "Text",
            },
            imageUrl: {
              label: {
                en: "Image URL",
              },
              type: "Text",
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
