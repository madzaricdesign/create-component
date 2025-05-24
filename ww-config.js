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
    cardsData: {
      label: { en: "Cards Data" },
      type: "Array",
      section: "Data",
      bindable: true,
      defaultValue: [],
      options: { item: { type: "Object", defaultValue: {} } },
      /* wwEditor:start */ bindingValidation: {
        type: "array",
        tooltip:
          "Bind to an array of tarot cards from your data source. Each card should have id, card_number, card_title, image, card_meaning, and card_description properties.",
      },
      propertyHelp: {
        tooltip: "Connect your tarot cards collection from Xano here",
      },
      /* wwEditor:end */ description: {
        en: "Array of tarot cards from your data source (e.g., Xano)",
      },
    },
    cardTitlePath: {
      label: { en: "Card Title Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "card_title",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for card titles. Format: string (e.g. "card_title" or "title")',
      },
      propertyHelp: {
        tooltip: "Select which property from your cards to use as the title",
      } /* wwEditor:end */,
    },
    cardNumberPath: {
      label: { en: "Card Number Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "card_number",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for card numbers. Format: string (e.g. "card_number" or "number")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the card number",
      } /* wwEditor:end */,
    },
    cardImagePath: {
      label: { en: "Card Image Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "image.url",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for card images. Format: string (e.g. "image.url" or "imageUrl")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the image URL",
      } /* wwEditor:end */,
    },
    cardMeaningPath: {
      label: { en: "Card Meaning Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "card_meaning",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for card meanings. Format: string (e.g. "card_meaning" or "meaning")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the card meaning",
      } /* wwEditor:end */,
    },
    cardDescriptionPath: {
      label: { en: "Card Description Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "card_description",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for card descriptions. Format: string (e.g. "card_description" or "description")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the card description",
      } /* wwEditor:end */,
    },
    cardLongDescriptionPath: {
      label: { en: "Long Description Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "long_description",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for long descriptions. Format: string (e.g. "long_description")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the long description",
      } /* wwEditor:end */,
    },
    cardDescriptionReversedPath: {
      label: { en: "Reversed Description Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "description_reversed",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for reversed descriptions. Format: string (e.g. "description_reversed")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the reversed description",
      } /* wwEditor:end */,
    },
    cardMeaningArrayPath: {
      label: { en: "Card Meanings Array Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "card_meaning_array",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for card meanings array. Format: string (e.g. "card_meaning_array")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the meanings array",
      } /* wwEditor:end */,
    },
    cardMeaningReversedArrayPath: {
      label: { en: "Reversed Meanings Array Property" },
      type: "ObjectPropertyPath",
      section: "Data",
      bindable: true,
      options: (content) => ({ object: content.cardsData?.[0] || {} }),
      defaultValue: "card_meaning_reversed_array",
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.cardsData) ||
        !content.cardsData?.length ||
        !boundProps.cardsData,
      /* wwEditor:start */ bindingValidation: {
        type: "string",
        tooltip:
          'The property path to use for reversed meanings array. Format: string (e.g. "card_meaning_reversed_array")',
      },
      propertyHelp: {
        tooltip:
          "Select which property from your cards to use as the reversed meanings array",
      } /* wwEditor:end */,
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
    overlayText: {
      label: {
        en: "Deck Overlay Text",
      },
      type: "Text",
      defaultValue: "Click to shuffle",
      section: "Content",
      bindable: true,
      description: {
        en: "The text shown on the deck overlay when hovering",
      },
    },
    overlayTextColor: {
      label: {
        en: "Deck Overlay Text Color",
      },
      type: "Color",
      defaultValue: "#ffffff",
      section: "Content",
      bindable: true,
      description: {
        en: "The color of the text shown on the deck overlay",
      },
    },
    overlayTextSize: {
      label: {
        en: "Deck Overlay Text Size",
      },
      type: "Number",
      defaultValue: 14,
      section: "Content",
      bindable: true,
      options: {
        min: 8,
        max: 32,
        step: 1,
      },
      description: {
        en: "The font size of the text shown on the deck overlay (in pixels)",
      },
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
            long_description: "",
            description_reversed: "",
            card_meaning: [],
            card_meaning_reversed: [],
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
            long_description: {
              label: {
                en: "Long Description",
              },
              type: "Text",
              defaultValue: "",
            },
            description_reversed: {
              label: {
                en: "Reversed Description",
              },
              type: "Text",
              defaultValue: "",
            },
            card_meaning: {
              label: {
                en: "Card Meanings",
              },
              type: "Array",
              defaultValue: [],
              options: {
                item: {
                  type: "Text",
                  defaultValue: "",
                },
              },
            },
            card_meaning_reversed: {
              label: {
                en: "Reversed Card Meanings",
              },
              type: "Array",
              defaultValue: [],
              options: {
                item: {
                  type: "Text",
                  defaultValue: "",
                },
              },
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
