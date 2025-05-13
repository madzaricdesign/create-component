<template>
  <div class="tarot-reader" :style="rootStyles">
    <div class="game-area" ref="gameArea" :style="gameAreaStyles">
      <div class="deck-area" id="deck" ref="deckElement">
        <!-- Cards will be added here by JS -->
      </div>
      <div class="player-hand-area" id="player-hand" ref="playerHandElement">
        <!-- Dealt cards will go here -->
      </div>
    </div>

    <div class="controls">
      <button
        id="shuffle-deal-button"
        ref="shuffleDealButton"
        @click="shuffleAndDeal"
        :disabled="isAnimating">
        {{ content.buttonText }}
      </button>
    </div>

    <!-- Debug info display (hidden by default) -->
    <div
      class="debug-info"
      v-if="content.showDebugInfo"
      style="
        margin-top: 10px;
        font-size: 12px;
        max-width: 90%;
        overflow: auto;
        max-height: 200px;
        background: rgba(0, 0, 0, 0.1);
        padding: 10px;
        border-radius: 5px;
      ">
      <div><strong>Dealt Cards:</strong> {{ dealtCards.length }}</div>
      <pre>{{ JSON.stringify(dealtCards, null, 2) }}</pre>

      <div style="margin-top: 10px">
        <strong>content.resultCards:</strong>
        {{ content.resultCards ? content.resultCards.length : 0 }}
      </div>
      <pre>{{ JSON.stringify(content.resultCards, null, 2) }}</pre>

      <!-- Add manual update button -->
      <button
        @click="manuallyUpdateBinding()"
        style="
          margin-top: 10px;
          padding: 5px 10px;
          background: #4ac6d2;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        ">
        Manually Update Binding
      </button>
    </div>
  </div>
</template>

<script>
import { gsap } from "gsap";

export default {
  props: {
    content: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:resultCards", "cardsDealt", "cardsCleared", "update:content"],

  // NOTE: we no longer keep a hard-coded variable ID in the component.  Any
  // direct push to a WeWeb variable should be done externally (for example in
  // the binding's JavaScript formula) or via the `updateVariableById` helper
  // method that accepts an ID at runtime.

  // Explicitly expose functions for WeWeb actions
  wwFunctions: {
    getCards() {
      console.log("[Tarot Card Reader] Action getCards called");
      return this.dealtCards ? [...this.dealtCards] : [];
    },
    clearCards() {
      console.log("[Tarot Card Reader] Action clearCards called");

      // Clear the local array
      this.dealtCards = [];

      // CORRECT APPROACH: Create a copy of content, don't modify directly
      // Add a delay to ensure WeWeb has time to process
      setTimeout(() => {
        this.$emit("update:content", {
          ...this.content, // Keep all other properties
          resultCards: [], // Update just resultCards with empty array
        });

        console.log(
          "[Tarot Card Reader] Cleared resultCards binding with delay"
        );
      }, 100);

      // Emit the cards-cleared event for workflows with a delay
      setTimeout(() => {
        this.$emit("trigger-event", {
          name: "cardsCleared",
          payload: {},
        });
        console.log(
          "[Tarot Card Reader] Emitted cardsCleared event with delay"
        );
      }, 1000); // 1 second delay for workflow

      return true;
    },
    getCardCount() {
      console.log("[Tarot Card Reader] Action getCardCount called");
      return this.dealtCards ? this.dealtCards.length : 0;
    },
  },

  data() {
    return {
      deckCards: [],
      dealtCards: [], // Always initialize as empty array
      isAnimating: false,
      cardWidth: 120,
      cardHeight: 168,
      cardMargin: 10,
      selectedCardCount: "3",
      cardsToDisplay: 3,
      version: 1,
      hasInitialized: false,
      apiCallInProgress: false,
      cardsData: null,
      initializationInProgress: false,
      mountCount: 0,
      resizeTimeout: null,
      lastDeckClickTime: null,
    };
  },
  computed: {
    wwDefaultContent() {
      return {
        resultCards: [], // Always provide a default empty array
      };
    },
    cssVars() {
      return {
        "--deck-border-color": this.content.deckBorderColor || "#9e15bf",
        "--placeholder-border-color":
          this.content.placeholderBorderColor || "#4ac6d2",
        "--placeholder-background-color":
          this.content.placeholderBackgroundColor || "transparent",
        "--button-background-color":
          this.content.buttonBackgroundColor || "#9e15bf",
        "--button-text-color": this.content.buttonTextColor || "#ffffff",
        "--card-text-color": this.content.lightColor || "#f8f0fc",
        "--background-color": this.content.backgroundColor || "#38074a",
        "--card-width": `min(120px, 20vw)`,
        "--card-height": `min(168px, 28vw)`,
        "--card-margin": `min(10px, 2vw)`,
        "--font-size": `min(18px, 3.5vw)`,
        "--title-font-size": this.content.titleFontSize
          ? `${this.content.titleFontSize}px`
          : `min(14px, 2.8vw)`,
        "--title-color": this.content.titleColor || "#f8f0fc",
      };
    },
    rootStyles() {
      return {
        "--deck-border-color": this.content.deckBorderColor || "#9e15bf",
        "--placeholder-border-color":
          this.content.placeholderBorderColor || "#4ac6d2",
        "--placeholder-background-color":
          this.content.placeholderBackgroundColor || "transparent",
        "--button-background-color":
          this.content.buttonBackgroundColor || "#9e15bf",
        "--button-text-color": this.content.buttonTextColor || "#ffffff",
        "--card-text-color": this.content.lightColor || "#f8f0fc",
        "--background-color": this.content.backgroundColor || "#38074a",
        "--card-width": `min(120px, 20vw)`,
        "--card-height": `min(168px, 28vw)`,
        "--card-margin": `min(10px, 2vw)`,
        "--font-size": `min(18px, 3.5vw)`,
        "--title-font-size": this.content.titleFontSize
          ? `${this.content.titleFontSize}px`
          : `min(14px, 2.8vw)`,
        "--title-color": this.content.titleColor || "#f8f0fc",
        backgroundColor: this.content.backgroundColor || "#38074a",
        height: this.content.height ? this.content.height + "px" : "100%",
      };
    },
    gameAreaStyles() {
      const baseStyles = {
        position: "relative",
        width: "100%",
        minHeight: "300px",
        height: `calc(100% - 80px)`,
        border: `2px solid ${this.content.deckBorderColor || "#9e15bf"}`,
        background: `linear-gradient(135deg, ${this.adjustColor(
          this.content.backgroundColor || "#38074a",
          5
        )}, ${this.adjustColor(
          this.content.backgroundColor || "#38074a",
          -15
        )})`,
        borderRadius: "10px",

        marginBottom: "20px",
        overflow: "hidden",
        transformStyle: "preserve-3d",
        perspective: "1000px",
        boxSizing: "border-box",
      };

      // Add height from content if available
      if (this.content.height) {
        baseStyles.height = this.content.height + "px";
        baseStyles.minHeight = this.content.height + "px";
      }

      return baseStyles;
    },
  },
  watch: {
    "content.defaultCardOption": {
      handler(newValue) {
        if (this.isAnimating) return;

        console.log(
          `[Tarot Card Reader] v${this.version} - Card count changed in editor to ${newValue}`
        );
        this.selectedCardCount = (newValue || 3).toString();
        this.cardsToDisplay = parseInt(this.selectedCardCount);

        this.updatePlaceholderCards();
      },
      immediate: true,
    },
    "content.titleColor": {
      handler(newValue) {
        console.log(
          `[Tarot Card Reader] v${this.version} - Title color changed to: ${newValue}`
        );
        this.updateAllStyles();
        this.updateTitleStyles();
      },
      immediate: true,
    },
    "content.titleFontSize": {
      handler(newValue) {
        console.log(
          `[Tarot Card Reader] v${this.version} - Title font size changed to: ${newValue}`
        );
        this.updateAllStyles();
        this.updateTitleStyles();
      },
      immediate: true,
    },
    "content.backgroundColor": {
      handler() {
        this.updateAllStyles();
      },
      immediate: true,
    },
    "content.deckBorderColor": {
      handler() {
        this.updateAllStyles();
      },
      immediate: true,
    },
    "content.placeholderBorderColor": {
      handler() {
        this.updateAllStyles();
      },
      immediate: true,
    },
    "content.buttonBackgroundColor": {
      handler() {
        this.updateAllStyles();
      },
      immediate: true,
    },
    "content.buttonTextColor": {
      handler() {
        this.updateAllStyles();
      },
      immediate: true,
    },
    "content.lightColor": {
      handler() {
        this.updateAllStyles();
        this.updateTitleStyles();
      },
      immediate: true,
    },
    "content.cardbackImageUrl": {
      handler() {
        this.updateAllStyles();
      },
      immediate: true,
    },
    "content.dealtCardsData": {
      handler(newValue) {
        if (
          newValue &&
          Array.isArray(newValue) &&
          JSON.stringify(newValue) !== JSON.stringify(this.dealtCards)
        ) {
          console.log(
            `[Tarot Card Reader] External update to dealtCardsData detected:`,
            newValue
          );

          // Update our internal state
          this.dealtCards = [...newValue];

          // Update global variable
          window.tarotDealtCards = [...newValue];
          console.log(
            "[Tarot Card Reader] Updated global variable with dealtCardsData"
          );
        }
      },
      deep: true,
    },
    // Sync internal dealtCards when resultCards is updated externally (from WeWeb binding)
    "content.resultCards": {
      handler(newValue) {
        if (
          newValue &&
          Array.isArray(newValue) &&
          JSON.stringify(newValue) !== JSON.stringify(this.dealtCards)
        ) {
          console.log(
            `[Tarot Card Reader] External update to content.resultCards detected:`,
            newValue
          );

          // Update our internal state
          this.dealtCards = [...newValue];

          // Update global variable (for backwards compatibility)
          window.tarotDealtCards = [...newValue];
        }
      },
      deep: true,
    },
    // Emit dedicated update event whenever dealtCards changes so WeWeb can propagate the
    // resultCards binding to variables / workflows in a fully supported way.
    dealtCards: {
      handler(newVal) {
        // Dealt cards changed – propagate the standard update event
        this.$emit(
          "update:resultCards",
          Array.isArray(newVal) ? [...newVal] : []
        );

        // No per-frame logging or verification – keeps the editor fast
      },
      deep: true,
    },
    "content.cardPattern": {
      handler(newValue) {
        if (this.isAnimating) return;

        console.log(
          `[Tarot Card Reader] v${this.version} - Card pattern changed in editor to ${newValue}`
        );

        // Just refresh placeholders if no cards are displayed yet
        this.updatePlaceholderCards();
      },
      immediate: true,
    },
  },
  mounted() {
    this.mountCount++;
    console.log(
      `[Tarot Card Reader] v${this.version} - Component mounted (count: ${this.mountCount})`
    );

    // Initialize safe default values
    this.initializeComponentDefaults();

    // Add debugging methods for direct variable access
    if (typeof window !== "undefined") {
      window.tarotHelper = {
        updateLorem: () => {
          console.warn(
            "[Tarot Card Reader] updateLorem() deprecated – no action taken."
          );
          return false;
        },
        getDealtCards: () => {
          return [...this.dealtCards];
        },
        getContentResultCards: () => {
          return this.content.resultCards ? [...this.content.resultCards] : [];
        },
        getAllVars: () => {
          if (window.wwLib && window.wwLib.wwVariable) {
            try {
              return window.wwLib.wwVariable.getValues();
            } catch (err) {
              console.error(
                "[Tarot Card Reader] Error getting variables:",
                err
              );
              return null;
            }
          }
          return null;
        },
      };
      console.log(
        "[Tarot Card Reader] Added tarotHelper for direct variable access"
      );
    }

    // Register component for WeWeb event system if wwLib is available
    if (typeof window !== "undefined" && window.wwLib) {
      try {
        console.log("[Tarot Card Reader] Exposing functions for WeWeb actions");
        // Register the component's functions for action workflows
        if (window.wwLib.wwObject && window.wwLib.wwObject.update) {
          console.log(
            "[Tarot Card Reader] Registering component functions for WeWeb actions"
          );
          // Make functions accessible to WeWeb
          window.tarotReaderActions = {
            getDealtCards: () => {
              const result = this.getDealtCards();
              console.log(
                "[Tarot Card Reader] Window action getDealtCards called, returning:",
                result
              );
              return result;
            },
            clearDealtCards: () => this.clearDealtCards(),
            updateVariable: (variableName) => this.updateVariable(variableName),
            getCardsJson: () => this.getCardsJson(),
            syncResultCards: () => this.syncResultCards(),
            getDealtCardsCount: () => this.getDealtCardsCount(),
            updateVariableById: (variableId) =>
              this.updateVariableById(variableId),
          };
        }
      } catch (error) {
        console.error(
          "[Tarot Card Reader] Error registering with WeWeb:",
          error
        );
      }
    }

    // Expose global access function
    if (typeof window !== "undefined") {
      window.getTarotDealtCards = () => {
        console.log(
          `[Tarot Card Reader] Global access: window.getTarotDealtCards called, returning:`,
          this.dealtCards
        );
        return [...this.dealtCards];
      };
      console.log(
        `[Tarot Card Reader] Exposed global function: window.getTarotDealtCards()`
      );

      // Add direct access to all component functions
      window.tarotReaderComponent = this;
      console.log(
        "[Tarot Card Reader] Exposed component instance as window.tarotReaderComponent"
      );

      // Add direct variable update function
      window.updateTarotVariableById = (variableId) => {
        console.log(
          `[Tarot Card Reader] Global function updateTarotVariableById called for ID: ${variableId}`
        );
        return this.updateVariableById(variableId);
      };

      console.log(
        "[Tarot Card Reader] Exposed global function: window.updateTarotVariableById(variableId)"
      );
    }

    // Update all CSS variables
    this.updateAllStyles();

    this.$nextTick(() => {
      setTimeout(() => {
        if (!this.hasInitialized && !this.initializationInProgress) {
          console.log(
            `[Tarot Card Reader] v${this.version} - Initializing component after mount (first time)`
          );
          this.initializeComponent();
        } else {
          console.log(
            `[Tarot Card Reader] v${this.version} - Component already initialized or initialization in progress, skipping initialization`
          );
        }
      }, 100);
    });

    // Simple resize handler without debounce or additional calls
    this.handleResize = () => {
      try {
        if (!this.isAnimating) {
          this.updateCardDimensions();
          this.updateAllStyles();

          if (this.$refs.playerHandElement) {
            // Only update placeholders if no cards have been dealt
            const dealtCardsElements = // Renamed for clarity
              this.$refs.playerHandElement.querySelectorAll(".card-face");
            if (!dealtCardsElements || dealtCardsElements.length === 0) {
              this.updatePlaceholderCards();
            } else {
              // Fix styling for already dealt cards
              this.fixCardAppearanceAfterResize();
            }
          }
        }
      } catch (err) {
        console.error("[Tarot Card Reader] - Resize handler error:", err);
      }
    };

    window.addEventListener("resize", this.handleResize);

    // Add this to the mounted function near the other window functions
    // Add debug helper to examine and update variables
    window.tarotDebugHelper = {
      // Get the current dealt cards
      getDealtCards: () => {
        return [...this.dealtCards];
      },

      // Force update of any WeWeb variable with current dealtCards
      updateVariable: (variableName) => {
        if (window.wwLib && window.wwLib.wwVariable) {
          try {
            window.wwLib.wwVariable.updateValue(variableName, [
              ...this.dealtCards,
            ]);
            console.log(
              `[Tarot Card Reader] Updated ${variableName} with:`,
              this.dealtCards
            );
            return true;
          } catch (error) {
            console.error(
              `[Tarot Card Reader] Error updating ${variableName}:`,
              error
            );
            return false;
          }
        }
        return false;
      },

      // Add the variable update by ID method
      updateVariableById: (variableId) => {
        console.log(
          `[Tarot Card Reader] Debug helper updateVariableById called for ID: ${variableId}`
        );
        return this.updateVariableById(variableId);
      },

      // Inspect all WeWeb variables (helpful for debugging)
      inspectVariables: () => {
        if (window.wwLib && window.wwLib.wwVariable) {
          try {
            const vars = window.wwLib.wwVariable.getValues();
            console.log("[Tarot Cards] All WeWeb variables:", vars);
            return vars;
          } catch (error) {
            console.error("[Tarot Cards] Error getting variables:", error);
            return null;
          }
        }
        return null;
      },

      // Check if a specific variable exists
      variableExists: (variableName) => {
        if (window.wwLib && window.wwLib.wwVariable) {
          try {
            const value = window.wwLib.wwVariable.getValue(variableName);
            console.log(
              `[Tarot Cards] Variable ${variableName} exists:`,
              value !== undefined
            );
            return value !== undefined;
          } catch (error) {
            console.error(
              `[Tarot Cards] Error checking variable ${variableName}:`,
              error
            );
            return false;
          }
        }
        return false;
      },
    };

    console.log("[Tarot Card Reader] Added tarotDebugHelper to window object");

    // Add a simple workflow helper method inside the mounted function
    console.log(
      "[Tarot Card Reader] Added tarotHelper for direct variable access"
    );

    // Add workflow JavaScript helper (deprecated)
    window.updateLoremFromTarot = function () {
      console.warn(
        "[Tarot Workflow] updateLoremFromTarot() deprecated – use updateVariableById(id) instead."
      );
      return { success: false, reason: "helper_deprecated" };
    };

    console.log(
      "[Tarot Card Reader] Added workflow helper function window.updateLoremFromTarot()"
    );
  },
  beforeUnmount() {
    console.log(`[Tarot Card Reader] v${this.version} - Component unmounting`);
    if (this.handleResize) {
      window.removeEventListener("resize", this.handleResize);
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  },
  methods: {
    // Helper method to initialize component with safe defaults
    initializeComponentDefaults() {
      console.log("[Tarot Card Reader] Initializing component defaults");

      // Make sure content has all expected properties with defaults
      if (!this.content) {
        console.warn("[Tarot Card Reader] Content object is missing!");
        return;
      }

      // Initialize dealtCards from content.resultCards if available
      if (this.content.resultCards && Array.isArray(this.content.resultCards)) {
        // Make a clean copy to avoid reactivity issues
        const cards = JSON.parse(JSON.stringify(this.content.resultCards));
        this.dealtCards = cards;
        console.log(
          "[Tarot Card Reader] Initialized dealtCards from content.resultCards:",
          cards
        );
      } else {
        // Initialize with empty array
        this.dealtCards = [];

        // Initialize content.resultCards if missing with an empty array
        if (!this.content.resultCards) {
          console.log(
            "[Tarot Card Reader] content.resultCards missing, initializing with empty array"
          );
          this.$emit("update:content", {
            ...this.content,
            resultCards: [],
          });
        }
      }

      // Ensure global variable always exists and is updated
      window.tarotDealtCards =
        this.dealtCards.length > 0 ? [...this.dealtCards] : [];

      // Add global trigger event function if not already defined
      if (!window.triggerTarotEvent) {
        window.triggerTarotEvent = (eventName) => {
          if (eventName === "cards-dealt") {
            this.$emit("trigger-event", {
              name: "cardsDealt",
              payload: {
                cards: [...this.dealtCards],
                count: this.dealtCards.length,
                firstCardTitle:
                  this.dealtCards.length > 0 ? this.dealtCards[0].title : null,
              },
            });
            return true;
          } else if (eventName === "cards-cleared") {
            this.$emit("trigger-event", {
              name: "cardsCleared",
              payload: {},
            });
            return true;
          }
          return false;
        };
      }

      console.log("[Tarot Card Reader] Component defaults initialized");
    },

    adjustColor(hex, percent) {
      hex = hex.replace(/^#/, "");

      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      r = Math.max(0, Math.min(255, r + percent));
      g = Math.max(0, Math.min(255, g + percent));
      b = Math.max(0, Math.min(255, b + percent));

      return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    },

    // Add new method to update a specific WeWeb variable by ID
    updateVariableById(variableId, data = null) {
      console.log(`[Tarot Card Reader] Updating variable ID: ${variableId}`);

      // Use the cards data if not provided
      const cardsData = data || [...this.dealtCards];

      if (!variableId) {
        console.error("[Tarot Card Reader] Variable ID is required");
        return false;
      }

      if (window.wwLib && window.wwLib.wwVariable) {
        try {
          // Clean the data for WeWeb (remove reactive properties)
          const cleanData = JSON.parse(JSON.stringify(cardsData));

          // Update the variable directly by ID
          if (typeof window.wwLib.wwVariable.updateValueById === "function") {
            window.wwLib.wwVariable.updateValueById(variableId, cleanData);
          } else {
            // Fallback for older WeWeb runtimes
            window.wwLib.wwVariable.updateValue(variableId, cleanData);
          }

          console.log(
            `[Tarot Card Reader] Successfully updated variable ID: ${variableId} with:`,
            cleanData
          );
          return true;
        } catch (error) {
          console.error(
            `[Tarot Card Reader] Error updating variable ID ${variableId}:`,
            error
          );
        }
      } else {
        console.error("[Tarot Card Reader] wwLib.wwVariable not available");
      }
      return false;
    },

    async fetchTarotCards() {
      try {
        console.log(
          `[Tarot Card Reader] v${this.version} - Fetching cards from WordPress API...`
        );

        const apiUrl =
          this.content.apiUrl ||
          "https://b145kh3.myrdbx.io/wp-json/wp/v2/waite-tarot?per_page=80";
        console.log(
          `[Tarot Card Reader] v${this.version} - Using API URL: ${apiUrl}`
        );

        const response = await fetch(apiUrl, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
          credentials: "omit",
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error(
            `[Tarot Card Reader] v${this.version} - API returned non-OK status:`,
            response.status
          );
          console.error(
            "Response text:",
            responseText.substring(0, 500) + "..."
          );
          throw new Error(`API request failed with status ${response.status}`);
        }

        const responseText = await response.text();

        if (
          responseText.trim().startsWith("<!DOCTYPE") ||
          responseText.trim().startsWith("<html")
        ) {
          console.error(
            `[Tarot Card Reader] v${this.version} - API returned HTML instead of JSON:`,
            responseText.substring(0, 500) + "..."
          );
          throw new Error("API returned HTML instead of JSON");
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(
            `[Tarot Card Reader] v${this.version} - Failed to parse response as JSON:`,
            parseError
          );
          console.error(
            "Response text:",
            responseText.substring(0, 500) + "..."
          );
          throw parseError;
        }

        console.log(
          `[Tarot Card Reader] v${this.version} - API response data:`,
          data
        );

        if (!Array.isArray(data)) {
          console.warn(
            `[Tarot Card Reader] v${this.version} - API response is not an array:`,
            data
          );
          data = [data];
        }

        const tarotCards = data.map((post) => {
          let cardNumber = "0";
          if (
            post["toolset-meta"] &&
            post["toolset-meta"]["card-info"] &&
            post["toolset-meta"]["card-info"]["card-number"] &&
            post["toolset-meta"]["card-info"]["card-number"]["raw"]
          ) {
            cardNumber =
              post["toolset-meta"]["card-info"]["card-number"]["raw"];
          }

          return {
            id: post.id.toString(),
            title: post.title.rendered || "Unnamed Card",
            cardNumber: cardNumber,
            featuredMediaId: post.featured_media || null,
            imageUrl: null,
          };
        });

        console.log(
          `[Tarot Card Reader] v${this.version} - Processed ${tarotCards.length} cards from API`
        );

        if (tarotCards.length === 0) {
          console.warn(
            `[Tarot Card Reader] v${this.version} - No cards received from API, using fallback data`
          );
          return this.createFallbackCards();
        }

        return tarotCards.sort(
          (a, b) => parseInt(a.cardNumber) - parseInt(b.cardNumber)
        );
      } catch (error) {
        console.error(
          `[Tarot Card Reader] v${this.version} - Error fetching tarot cards:`,
          error
        );
        console.log(
          `[Tarot Card Reader] v${this.version} - Using fallback cards due to API error`
        );
        return this.createFallbackCards();
      }
    },

    async fetchCardImage(mediaId) {
      if (!mediaId) return null;

      try {
        const apiUrl =
          this.content.apiUrl ||
          "https://b145kh3.myrdbx.io/wp-json/wp/v2/waite-tarot?per_page=80";
        const baseUrl = apiUrl.split("/wp-json/")[0];
        const mediaUrl = `${baseUrl}/wp-json/wp/v2/media/${mediaId}`;

        console.log(
          `[Tarot Card Reader] v${this.version} - Fetching image from: ${mediaUrl}`
        );

        const response = await fetch(mediaUrl);

        if (!response.ok) {
          console.error(
            `[Tarot Card Reader] v${this.version} - Failed to fetch image with ID ${mediaId}, status: ${response.status}`
          );
          return null;
        }

        const responseText = await response.text();

        try {
          const media = JSON.parse(responseText);
          return media.source_url || null;
        } catch (parseError) {
          console.error(
            `[Tarot Card Reader] v${this.version} - Failed to parse image response as JSON:`,
            parseError
          );
          console.log("Response text:", responseText.substring(0, 200) + "...");
          return null;
        }
      } catch (error) {
        console.error(
          `[Tarot Card Reader] v${this.version} - Error fetching card image:`,
          error
        );
        return null;
      }
    },

    incrementVersion(action) {
      this.version++;
      console.log(`[Tarot Card Reader] v${this.version} - ${action}`);
      return this.version;
    },

    initializeComponent() {
      this.incrementVersion("Initializing component");

      if (this.hasInitialized) {
        console.log(
          `[Tarot Card Reader] v${this.version} - Component already initialized, will refresh data`
        );
      }

      if (
        !this.$refs.deckElement ||
        !this.$refs.playerHandElement ||
        !this.$refs.gameArea
      ) {
        console.warn(
          "[Tarot Card Reader] - DOM refs not ready during initialization"
        );

        setTimeout(() => {
          if (
            this.$refs.deckElement &&
            this.$refs.playerHandElement &&
            this.$refs.gameArea
          ) {
            console.log(
              "[Tarot Card Reader] - DOM refs now available, retrying initialization"
            );
            this.initializationInProgress = false;
            this.initializeComponent();
          } else {
            console.error(
              "[Tarot Card Reader] - DOM refs still not available after delay"
            );
            this.initializationInProgress = false;
          }
        }, 200);

        return;
      }

      this.updateCardDimensions();

      const deckCreated = this.createDeck();

      if (deckCreated) {
        this.hasInitialized = true;
        this.initializationInProgress = false;

        if (this.$refs.deckElement) {
          gsap.set(this.$refs.deckElement, {
            left: "20px",
            top: "20px",
            x: 0,
            y: 0,
          });
        }

        this.updatePlaceholderCards();
        this.preloadCardImages();
        this.incrementVersion("Component initialization complete");
      } else {
        console.warn(
          "[Tarot Card Reader] - Deck creation failed during initialization"
        );
        this.initializationInProgress = false;
      }
    },

    updateCardDimensions() {
      try {
        const computedStyle = getComputedStyle(document.documentElement);
        this.cardWidth =
          parseInt(computedStyle.getPropertyValue("--card-width")) || 120;
        this.cardHeight =
          parseInt(computedStyle.getPropertyValue("--card-height")) || 168;
        this.cardMargin =
          parseInt(computedStyle.getPropertyValue("--card-margin")) || 10;

        // Update deck position if needed
        if (this.$refs.deckElement && !this.isAnimating) {
          gsap.set(this.$refs.deckElement, {
            width: "var(--card-width)",
            height: "var(--card-height)",
          });
        }

        console.log(
          `[Tarot Card Reader] v${this.version} - Card dimensions updated: ${this.cardWidth}x${this.cardHeight}`
        );
      } catch (err) {
        console.error(
          "[Tarot Card Reader] - Error updating card dimensions:",
          err
        );
        // Set fallback values
        this.cardWidth = 120;
        this.cardHeight = 168;
        this.cardMargin = 10;
      }
    },

    async createDeck() {
      this.incrementVersion("Creating deck");
      if (
        !this.$refs.deckElement ||
        !this.$refs.playerHandElement ||
        !this.$refs.gameArea
      ) {
        console.warn("Required DOM elements not found");
        return false;
      }

      const deckElement = this.$refs.deckElement;
      const playerHandElement = this.$refs.playerHandElement;

      deckElement.innerHTML = "";
      playerHandElement.innerHTML = "";
      this.deckCards = [];

      const loadingMessage = document.createElement("div");
      loadingMessage.textContent = "Loading Tarot Cards...";
      loadingMessage.style.color = "var(--light-accent)";
      loadingMessage.style.fontSize = "1.5rem";
      loadingMessage.style.position = "absolute";
      loadingMessage.style.top = "50%";
      loadingMessage.style.left = "50%";
      loadingMessage.style.transform = "translate(-50%, -50%)";
      this.$refs.gameArea.appendChild(loadingMessage);

      try {
        const tarotCards = await this.fetchTarotCards();

        if (tarotCards.length === 0) {
          throw new Error("No tarot cards were loaded");
        }

        const cardCount = Math.min(52, tarotCards.length);
        for (let i = 0; i < cardCount; i++) {
          const tarotCard = tarotCards[i];
          const card = document.createElement("div");
          card.classList.add("card", "card-back");
          // Set exact dimensions to match CSS variables
          card.style.width = "var(--card-width)";
          card.style.height = "var(--card-height)";

          card.dataset.cardId = i;
          card.dataset.tarotId = tarotCard.id;
          card.dataset.cardNumber = tarotCard.cardNumber;
          card.dataset.title = tarotCard.title;

          if (tarotCard.imageUrl) {
            card.dataset.imageUrl = tarotCard.imageUrl;
            console.log(
              `Card ${tarotCard.title} has image: ${tarotCard.imageUrl}`
            );
          } else if (tarotCard.featuredMediaId) {
            const imageUrl = await this.fetchCardImage(
              tarotCard.featuredMediaId
            );
            if (imageUrl) {
              card.dataset.imageUrl = imageUrl;
              console.log(
                `Card ${tarotCard.title} fetched image from media: ${imageUrl}`
              );
            } else {
              console.warn(`Card ${tarotCard.title} has no image URL`);
            }
          } else {
            console.warn(`Card ${tarotCard.title} has no image URL`);
          }

          card.innerHTML = `<span style="color: var(--main-dark)">${tarotCard.title}</span>`;

          deckElement.appendChild(card);
          this.deckCards.push(card);
        }

        loadingMessage.remove();

        gsap.set(this.deckCards, {
          x: (i) => Math.random() * 0.5 - 0.25,
          y: (i) => Math.random() * 0.5 - 0.25,
          rotation: (i) => Math.random() * 0.8 - 0.4,
          zIndex: (i) => i,
        });

        this.deckCards.forEach((card, index) => {
          card.style.setProperty("--index", index);
        });

        // Add the shuffle overlay to the deck
        this.createDeckOverlay();

        this.incrementVersion(
          `Deck created with ${this.deckCards.length} cards`
        );
        return true;
      } catch (error) {
        console.error("Error creating tarot deck:", error);
        if (loadingMessage.parentNode === this.$refs.gameArea) {
          loadingMessage.textContent = "Error loading cards. Please refresh.";
          loadingMessage.style.color = "red";
        }
        this.incrementVersion("Deck creation failed");
        return false;
      }
    },

    // Create clickable overlay for the deck
    createDeckOverlay() {
      if (!this.$refs.deckElement) return;

      // Remove any existing overlay first
      const existingOverlay =
        this.$refs.deckElement.querySelector(".deck-overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Only create overlay if not animating
      if (this.isAnimating) return;

      const deckOverlay = document.createElement("div");
      deckOverlay.className = "deck-overlay";

      const overlayText = document.createElement("span");
      overlayText.textContent = "Click to shuffle";
      deckOverlay.appendChild(overlayText);

      // Add click event listener
      deckOverlay.addEventListener("click", (event) => {
        this.shuffleFromDeck(event);
      });

      // Add to deck
      this.$refs.deckElement.appendChild(deckOverlay);
    },

    createFallbackCards() {
      const suits = ["Cups", "Pentacles", "Swords", "Wands"];
      const values = [
        "Ace",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Page",
        "Knight",
        "Queen",
        "King",
      ];

      const fallbackCards = [];

      const majorArcana = [
        "The Fool",
        "The Magician",
        "The High Priestess",
        "The Empress",
        "The Emperor",
        "The Hierophant",
        "The Lovers",
        "The Chariot",
        "Strength",
        "The Hermit",
        "Wheel of Fortune",
        "Justice",
        "The Hanged Man",
        "Death",
        "Temperance",
        "The Devil",
        "The Tower",
        "The Star",
        "The Moon",
        "The Sun",
        "Judgement",
        "The World",
      ];

      const majorArcanaImages = [
        "https://www.trustedtarot.com/img/cards/the-fool.png",
        "https://www.trustedtarot.com/img/cards/the-magician.png",
        "https://www.trustedtarot.com/img/cards/the-high-priestess.png",
        "https://www.trustedtarot.com/img/cards/the-empress.png",
        "https://www.trustedtarot.com/img/cards/the-emperor.png",
        "https://www.trustedtarot.com/img/cards/the-hierophant.png",
        "https://www.trustedtarot.com/img/cards/the-lovers.png",
        "https://www.trustedtarot.com/img/cards/the-chariot.png",
        "https://www.trustedtarot.com/img/cards/strength.png",
        "https://www.trustedtarot.com/img/cards/the-hermit.png",
        "https://www.trustedtarot.com/img/cards/wheel-of-fortune.png",
        "https://www.trustedtarot.com/img/cards/justice.png",
        "https://www.trustedtarot.com/img/cards/the-hanged-man.png",
        "https://www.trustedtarot.com/img/cards/death.png",
        "https://www.trustedtarot.com/img/cards/temperance.png",
        "https://www.trustedtarot.com/img/cards/the-devil.png",
        "https://www.trustedtarot.com/img/cards/the-tower.png",
        "https://www.trustedtarot.com/img/cards/the-star.png",
        "https://www.trustedtarot.com/img/cards/the-moon.png",
        "https://www.trustedtarot.com/img/cards/the-sun.png",
        "https://www.trustedtarot.com/img/cards/judgement.png",
        "https://www.trustedtarot.com/img/cards/the-world.png",
      ];

      majorArcana.forEach((title, index) => {
        fallbackCards.push({
          id: `major-${index}`,
          title: title,
          cardNumber: index.toString(),
          featuredMediaId: null,
          imageUrl: majorArcanaImages[index] || null,
        });
      });

      const suitImageBaseUrls = {
        Cups: "https://www.trustedtarot.com/img/cards/cup-",
        Pentacles: "https://www.trustedtarot.com/img/cards/pentacle-",
        Swords: "https://www.trustedtarot.com/img/cards/sword-",
        Wands: "https://www.trustedtarot.com/img/cards/wand-",
      };

      suits.forEach((suit) => {
        values.forEach((value, index) => {
          let cardNum = index + 1;
          let imageValue = cardNum.toString();

          if (value === "Page") imageValue = "page";
          if (value === "Knight") imageValue = "knight";
          if (value === "Queen") imageValue = "queen";
          if (value === "King") imageValue = "king";

          fallbackCards.push({
            id: `${suit.toLowerCase()}-${index + 1}`,
            title: `${value} of ${suit}`,
            cardNumber: (index + 1).toString(),
            featuredMediaId: null,
            imageUrl: `${suitImageBaseUrls[suit]}${imageValue}.png`,
          });
        });
      });

      console.log(
        `[Tarot Card Reader] v${this.version} - Created ${fallbackCards.length} fallback cards with images`
      );
      return fallbackCards;
    },

    updatePlaceholderCards() {
      this.incrementVersion(
        `Updating placeholders for ${this.cardsToDisplay} cards`
      );

      if (!this.$refs.playerHandElement) {
        console.warn("Player hand element not found");
        return;
      }

      const numCards = this.cardsToDisplay;

      // Detect selected pattern from content
      const selectedPattern = this.content.cardPattern || "default";

      // If the relationship pattern is selected and we have 7 cards, use the custom layout
      if (selectedPattern === "relationship" && numCards === 7) {
        this.createRelationshipPlaceholders(numCards);
        return;
      }

      // Fallback to default flex placeholders
      const playerHandElement = this.$refs.playerHandElement;
      playerHandElement.innerHTML = "";
      playerHandElement.style.bottom = "50px";

      const placeholdersContainer = document.createElement("div");
      placeholdersContainer.style.display = "flex";
      placeholdersContainer.style.flexWrap = "wrap";
      placeholdersContainer.style.justifyContent = "center";
      placeholdersContainer.style.width = "100%";
      placeholdersContainer.style.position = "absolute";
      placeholdersContainer.style.bottom = "0";
      placeholdersContainer.style.left = "0";
      placeholdersContainer.style.gap = "15px";
      placeholdersContainer.style.paddingBottom = "10px";

      playerHandElement.appendChild(placeholdersContainer);

      for (let i = 0; i < numCards; i++) {
        const visiblePlaceholder = document.createElement("div");
        visiblePlaceholder.classList.add("rec-card", "card-placeholder");
        visiblePlaceholder.style.position = "relative";
        visiblePlaceholder.style.margin = "5px";
        placeholdersContainer.appendChild(visiblePlaceholder);
      }

      this.updateHandAreaHeight(numCards);
    },

    updateHandAreaHeight(numCards) {
      if (!this.$refs.playerHandElement || !this.$refs.gameArea) return;

      const playerHandElement = this.$refs.playerHandElement;
      const gameArea = this.$refs.gameArea;
      const gameAreaHeight = gameArea.clientHeight;

      const isMobile = window.innerWidth < 768;
      const maxCardsPerRow = isMobile ? 2 : 5;
      const numRows = Math.ceil(numCards / maxCardsPerRow);

      // Calculate height based on rows
      const rowGap = isMobile ? 25 : 20;
      const padding = 40;
      const titleHeight = isMobile ? 50 : 40;
      const titleBottomSpace = 30; // Extra space for title below card

      // Calculate needed height for cards
      const neededCardHeight =
        numRows * (this.cardHeight + titleHeight + titleBottomSpace) +
        (numRows - 1) * rowGap +
        padding;

      // Reserve space for deck at top and ensure minimum spacing
      const deckTopPosition = 20;
      const deckHeight = this.cardHeight;
      const minGapRequired = 60;

      // Calculate available space for player hand
      const availableSpace = Math.max(
        gameAreaHeight - deckTopPosition - deckHeight - minGapRequired,
        neededCardHeight
      );

      playerHandElement.style.minHeight = `${availableSpace}px`;
      playerHandElement.style.height = `${availableSpace}px`;

      console.log(
        `[Tarot Card Reader] v${this.version} - Hand area height updated: ${availableSpace}px (based on game area: ${gameAreaHeight}px)`
      );
    },

    shuffleArray(array) {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    },

    shuffleAndDeal() {
      try {
        this.incrementVersion("Shuffle and deal started");
        if (
          !this.$refs.deckElement ||
          !this.$refs.shuffleDealButton ||
          !this.$refs.gameArea ||
          !this.$refs.playerHandElement
        ) {
          console.warn("Required DOM elements not found");
          return;
        }

        if (this.isAnimating || this.deckCards.length < 1) return;

        // Remove the deck overlay before animation starts
        const existingOverlay =
          this.$refs.deckElement.querySelector(".deck-overlay");
        if (existingOverlay) {
          existingOverlay.remove();
        }

        // We'll only emit the cardsDealt event AFTER the cards are actually dealt
        // No emission here to avoid duplicate triggers
        console.log(
          "[Tarot Card Reader] User clicked Shuffle button - Will emit event AFTER cards are dealt"
        );

        // Reset dealt cards array when shuffling and emit cleared event
        if (this.dealtCards.length > 0) {
          this.dealtCards = [];

          // Still emit the cardsCleared event
          this.$emit("trigger-event", {
            name: "cardsCleared",
            payload: {},
          });

          console.log(
            "[Tarot Card Reader] Emitted 'trigger-event' with name: 'cardsCleared'"
          );
        }

        this.isAnimating = true;
        const shuffleDealButton = this.$refs.shuffleDealButton;
        shuffleDealButton.disabled = true;
        shuffleDealButton.classList.add("shuffling");
        const deckElement = this.$refs.deckElement;
        const gameArea = this.$refs.gameArea;

        const animationTimeout = setTimeout(() => {
          if (this.isAnimating) {
            this.isAnimating = false;
            shuffleDealButton.disabled = false;
            shuffleDealButton.classList.remove("shuffling");
            gsap.set(deckElement, {
              clearProps: "all",
              left: "20px",
              top: "20px",
            });
            this.incrementVersion("Animation timeout triggered - safety reset");
          }
        }, 10000);

        this.cardsToDisplay = parseInt(this.selectedCardCount);
        this.cardsToDisplay = Math.min(
          this.cardsToDisplay,
          this.deckCards.length
        );

        this.updateCardDimensions();

        this.$refs.playerHandElement.innerHTML = "";
        this.createPlaceholders(this.cardsToDisplay);

        const gameAreaRect = gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        const deckTopPosition = Math.max(gameAreaHeight * 0.2, 80);

        const centerX = gameAreaWidth / 2 - this.cardWidth / 2;

        deckElement.style.transform = "none";

        gsap.set(deckElement, {
          position: "absolute",
          left: "20px",
          top: "20px",
          rotation: 0,
          zIndex: 100,
          transform: "none",
        });

        this.deckCards.forEach((card) => {
          card.classList.add("card-back");
          card.style.backgroundImage = "";
          deckElement.appendChild(card);
        });

        const shuffledDeckCards = this.shuffleArray(this.deckCards);
        this.deckCards = shuffledDeckCards;
        this.deckCards.forEach((card) => deckElement.appendChild(card));
        this.incrementVersion("Cards shuffled");

        console.log(
          `[Tarot Card Reader] v${this.version} - Animation values:`,
          {
            gameAreaWidth,
            gameAreaHeight,
            deckTopPosition,
            centerPosition: centerX + "px",
            deckSize: this.deckCards.length,
          }
        );

        const isLargeDeck = this.deckCards.length > 30;

        const animationCards = isLargeDeck
          ? this.deckCards.slice(0, Math.min(30, this.deckCards.length))
          : this.deckCards;

        console.log(
          `[Tarot Card Reader] v${this.version} - Animating ${animationCards.length} cards out of ${this.deckCards.length} total`
        );

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          onComplete: () => {
            try {
              this.incrementVersion(
                "Shuffle animation complete, starting deal"
              );
              this.dealCards();
              clearTimeout(animationTimeout);
            } catch (err) {
              console.error(
                "[Tarot Card Reader] - Animation complete error:",
                err
              );
              this.isAnimating = false;
              shuffleDealButton.disabled = false;
              shuffleDealButton.classList.remove("shuffling");
              clearTimeout(animationTimeout);
            }
          },
        });

        tl.to(deckElement, {
          duration: 0.4,
          left: centerX + "px",
          top: deckTopPosition + "px",
          rotation: 2,
          ease: "power1.inOut",
        });

        const performShuffle = () => {
          try {
            tl.to(animationCards, {
              x: (i) => (i % 2 === 0 ? -25 : 25),
              y: (i) => (i % 3 === 0 ? -15 : 15),
              stagger: {
                amount: isLargeDeck ? 0.1 : 0.15,
                from: "center",
              },
              duration: isLargeDeck ? 0.1 : 0.15,
            });

            if (isLargeDeck) {
              tl.to(animationCards, {
                x: (i) => Math.sin(i * 0.5) * 20,
                y: (i) => Math.sin(i * 0.7) * 15,
                rotation: (i) => Math.sin(i * 0.8) * 5,
                stagger: { amount: 0.2, from: "random", ease: "power2.inOut" },
                duration: 0.3,
                ease: "power2.inOut",
              }).to(animationCards, {
                x: 0,
                y: 0,
                rotation: 0,
                duration: 0.2,
                ease: "power2.inOut",
              });
            } else {
              const halfDeckSize = Math.floor(animationCards.length / 2);
              const firstHalf = animationCards.slice(0, halfDeckSize);
              const secondHalf = animationCards.slice(halfDeckSize);

              tl.to(firstHalf, {
                x: (i) => -200,
                y: (i) => 40 + Math.sin(i * 0.3) * 30,
                rotation: -15,
                stagger: { amount: 0.2, from: "start", ease: "power1.inOut" },
                duration: 0.3,
                ease: "back.out(1.2)",
              })
                .to(
                  secondHalf,
                  {
                    x: (i) => 200,
                    y: (i) => 40 + Math.sin(i * 0.3) * 30,
                    rotation: 15,
                    stagger: {
                      amount: 0.2,
                      from: "start",
                      ease: "power1.inOut",
                    },
                    duration: 0.3,
                    ease: "back.out(1.2)",
                  },
                  "<"
                )
                .to(animationCards, {
                  x: (i) => Math.sin(i * 0.5) * 25,
                  y: (i) => Math.sin(i * 0.7) * 10,
                  rotation: (i) => Math.sin(i * 0.8) * 8,
                  stagger: {
                    amount: 0.4,
                    from: "random",
                    ease: "power3.inOut",
                  },
                  duration: 0.4,
                  ease: "elastic.out(0.5, 0.3)",
                })
                .to(animationCards, {
                  x: 0,
                  y: 0,
                  rotation: 0,
                  duration: 0.2,
                  ease: "power2.inOut",
                });
            }
          } catch (err) {
            console.error("[Tarot Card Reader] - Shuffle error:", err);
            // Continue to next steps on error rather than breaking
            tl.to(animationCards, {
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.2,
              ease: "power2.inOut",
            });
          }
        };

        performShuffle();

        tl.to(deckElement, {
          y: "-=10",
          duration: 0.1,
          ease: "power1.inOut",
        }).to(deckElement, {
          y: "+=10",
          duration: 0.1,
          ease: "power1.out",
        });

        performShuffle();
      } catch (err) {
        console.error("[Tarot Card Reader] - Shuffle and deal error:", err);
        if (this.$refs.shuffleDealButton) {
          this.$refs.shuffleDealButton.disabled = false;
          this.$refs.shuffleDealButton.classList.remove("shuffling");
        }
        this.isAnimating = false;
      }
    },

    dealCards() {
      try {
        this.incrementVersion(`Dealing ${this.cardsToDisplay} cards`);
        if (
          !this.$refs.playerHandElement ||
          !this.$refs.deckElement ||
          !this.$refs.gameArea
        ) {
          console.error(
            "[Tarot Card Reader] - DOM refs missing, cannot deal cards"
          );
          return;
        }

        console.log(
          `[Tarot Card Reader] dealCards: Starting the deal process for ${this.cardsToDisplay} cards`
        );

        const playerHandElement = this.$refs.playerHandElement;
        const placeholderContainer = playerHandElement.querySelector("div");
        if (!placeholderContainer) return;

        const placeholders =
          placeholderContainer.querySelectorAll(".card-placeholder");

        // Make sure we have enough cards and placeholders
        if (placeholders.length === 0) {
          console.error("No placeholders found for dealing cards");
          return;
        }

        const cardsToDisplayCount = Math.min(
          this.cardsToDisplay,
          this.deckCards.length
        );

        if (cardsToDisplayCount === 0) {
          console.error("No cards to deal");
          return;
        }

        const cardsToDealElements = this.deckCards.slice(-cardsToDisplayCount);
        this.deckCards.splice(-cardsToDisplayCount); // Remove from deck array

        // Create array to hold the card data
        const dealtCardsData = [];

        this.updateCardDimensions();

        const deckElement = this.$refs.deckElement;
        const gameArea = this.$refs.gameArea;
        const deckRect = deckElement.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();

        // Get all placeholder bounds before DOM changes
        const placeholderBounds = Array.from(placeholders).map((placeholder) =>
          placeholder.getBoundingClientRect()
        );

        const dealTl = gsap.timeline({
          onComplete: () => {
            try {
              this.incrementVersion("Card dealing complete, moving deck back");
              this.moveRemainingDeckBack();
            } catch (err) {
              console.error("[Tarot Card Reader] - Deal complete error:", err);
              this.isAnimating = false;
              if (this.$refs.shuffleDealButton) {
                this.$refs.shuffleDealButton.disabled = false;
                this.$refs.shuffleDealButton.classList.remove("shuffling");
              }
            }
          },
        });

        cardsToDealElements.forEach((card, i) => {
          try {
            if (i >= placeholders.length) return; // Skip if no placeholder available

            console.log(`[Tarot Card Reader] Card ${i} data:`, {
              id: card.dataset.tarotId,
              title: card.dataset.title,
              cardNumber: card.dataset.cardNumber,
              imageUrl: card.dataset.imageUrl || null,
            });

            // Extract and store the card data
            dealtCardsData.push({
              id: card.dataset.tarotId,
              title: card.dataset.title,
              cardNumber: card.dataset.cardNumber,
              imageUrl: card.dataset.imageUrl || null,
              index: i,
            });

            // Get first bounds before any DOM changes
            const firstBounds = card.getBoundingClientRect();
            const first = {
              top: firstBounds.top - gameAreaRect.top,
              left: firstBounds.left - gameAreaRect.left,
              width: firstBounds.width,
              height: firstBounds.height,
            };

            // Get the target placeholder
            const placeholder = placeholders[i];
            const placeholderRect = placeholderBounds[i];

            // Calculate position within the game area
            const placeholderInGameArea = {
              top: placeholderRect.top - gameAreaRect.top,
              left: placeholderRect.left - gameAreaRect.left,
            };

            // Now append the card to the placeholder instead of replacing it
            placeholder.appendChild(card);

            // Set the card to fill the placeholder
            gsap.set(card, {
              position: "absolute",
              width: "100%",
              height: "100%",
              left: 0,
              top: 0,
              margin: 0,
              zIndex: 10,
            });

            // Calculate the final position for the animation
            const finalPosition = {
              top: placeholderInGameArea.top,
              left: placeholderInGameArea.left,
            };

            // Calculate translation values for the animation
            const deltaX = first.left - finalPosition.left;
            const deltaY = first.top - finalPosition.top;

            gsap.set(card, {
              x: deltaX,
              y: deltaY,
              transformOrigin: "center center",
              zIndex: 100 + i,
            });

            const staggerDelay = i * 0.06;

            dealTl.to(card, {
              duration: 0.25,
              x: 0,
              y: 0,
              ease: "power2.out",
              delay: staggerDelay,
            });

            dealTl.to(
              card,
              {
                rotationY: 180,
                duration: 0.15,
                ease: "power1.inOut",
                onStart: function () {
                  gsap.set(card, {
                    transformPerspective: 800,
                    transformOrigin: "center center",
                  });
                },
                onComplete: () => {
                  try {
                    card.classList.remove("card-back");
                    card.classList.add("card-face");

                    if (card.dataset.imageUrl) {
                      card.style.backgroundImage = `url('${card.dataset.imageUrl}')`;
                      card.style.backgroundSize = "cover";
                      card.style.backgroundPosition = "center";
                      card.style.backgroundRepeat = "no-repeat";
                      card.style.backgroundColor =
                        this.content.lightColor || "#f8f0fc";

                      // Ensure card stays within placeholder during resize
                      card.style.position = "absolute";
                      card.style.width = "100%";
                      card.style.height = "100%";
                      card.style.top = "0";
                      card.style.left = "0";
                      card.style.margin = "0";
                    } else {
                      card.style.backgroundColor =
                        this.content.lightColor || "#f8f0fc";

                      // Ensure card stays within placeholder during resize
                      card.style.position = "absolute";
                      card.style.width = "100%";
                      card.style.height = "100%";
                      card.style.top = "0";
                      card.style.left = "0";
                      card.style.margin = "0";
                    }

                    card.style.borderColor =
                      this.content.deckBorderColor || "#9e15bf";

                    const titleElement = card.querySelector("span");
                    if (titleElement) {
                      card.removeChild(titleElement);

                      // Create the title with absolute positioning
                      const titleContainer = document.createElement("div");
                      titleContainer.classList.add("card-title");
                      titleContainer.textContent = titleElement.textContent;

                      // Position the title below the placeholder with consistent 10px spacing
                      placeholder.appendChild(titleContainer);
                      titleContainer.style.position = "absolute";
                      titleContainer.style.top = "calc(100% + 10px)"; // 10px spacing from card
                      titleContainer.style.left = "0";
                      titleContainer.style.whiteSpace = "normal";
                      titleContainer.style.width = "100%";
                      titleContainer.style.textAlign = "center";
                      titleContainer.style.color =
                        this.content.titleColor ||
                        this.content.lightColor ||
                        "#f8f0fc";
                      titleContainer.style.fontWeight = "bold";
                      titleContainer.style.fontSize = this.content.titleFontSize
                        ? `${this.content.titleFontSize}px`
                        : "min(14px, 2.8vw)";
                      titleContainer.style.textShadow =
                        "0 0 4px rgba(0, 0, 0, 0.8)";
                      titleContainer.style.zIndex = "20";
                    }

                    gsap.set(card, { rotationY: 0 });
                  } catch (err) {
                    console.error(
                      "[Tarot Card Reader] - Card flip error:",
                      err
                    );
                    gsap.set(card, { rotationY: 0 });
                  }
                },
              },
              ">"
            );

            dealTl.to(
              card,
              {
                boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
                duration: 0.05,
                delay: -0.05,
              },
              ">-0.05"
            );

            dealTl.to(card, {
              boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
              duration: 0.1,
            });
          } catch (err) {
            console.error(
              "[Tarot Card Reader] - Card deal error for card " + i + ":",
              err
            );
            // Continue with next card
          }
        });

        // After all cards are dealt and animations are complete
        dealTl.add(() => {
          try {
            console.log("[Tarot Card Reader] Finalizing dealt cards");

            // Create a clean, non-reactive copy of the card data
            const cleanCardData = dealtCardsData.map((card) => ({
              id: card.id,
              title: card.title,
              cardNumber: card.cardNumber,
              imageUrl: card.imageUrl,
              index: card.index,
            }));

            // Update our internal state
            this.dealtCards = cleanCardData;

            // CORRECT APPROACH: Create a copy of content, don't modify directly
            // Add a delay to ensure WeWeb has time to process the binding
            setTimeout(() => {
              this.$emit("update:content", {
                ...this.content, // Keep all other properties
                resultCards: cleanCardData, // Update just resultCards
              });

              console.log(
                "[Tarot Card Reader] Emitted update:content with resultCards",
                cleanCardData
              );

              // Emit dedicated event right after, to ensure external variable receives the update
              this.$emit("update:resultCards", cleanCardData);

              console.log(
                "[Tarot Card Reader] Emitted update:resultCards directly after update:content"
              );

              // (Verification helper removed)
            }, 1000); // 1 second delay as you mentioned

            // Create workflow payload
            const eventPayload = {
              count: cleanCardData.length,
              firstCardTitle:
                cleanCardData.length > 0 ? cleanCardData[0].title : null,
              cards: cleanCardData,
              cardsJson: JSON.stringify(cleanCardData),
              card1: cleanCardData.length > 0 ? cleanCardData[0] : null,
              card2: cleanCardData.length > 1 ? cleanCardData[1] : null,
              card3: cleanCardData.length > 2 ? cleanCardData[2] : null,
              card4: cleanCardData.length > 3 ? cleanCardData[3] : null,
              card5: cleanCardData.length > 4 ? cleanCardData[4] : null,
              rawCards: cleanCardData,
            };

            // Emit the event for workflows with a delay
            setTimeout(() => {
              this.$emit("trigger-event", {
                name: "cardsDealt",
                payload: eventPayload,
              });

              console.log(
                "[Tarot Card Reader] Emitted workflow event with delay"
              );
            }, 1000); // 1 second delay as you mentioned

            // Add visual effect
            gsap.to(cardsToDealElements, {
              boxShadow: "0 0 8px rgba(255,255,255,0.7)",
              duration: 0.1,
              yoyo: true,
              repeat: 1,
            });

            // Inform WeWeb bindings immediately
            this.$emit("update:resultCards", cleanCardData);
          } catch (err) {
            console.error(
              "[Tarot Card Reader] - Error in dealTl.add callback:",
              err
            );
          }
        });
      } catch (err) {
        console.error("[Tarot Card Reader] - Deal cards error:", err);
        this.isAnimating = false;
        if (this.$refs.shuffleDealButton) {
          this.$refs.shuffleDealButton.disabled = false;
          this.$refs.shuffleDealButton.classList.remove("shuffling");
        }
      }
    },

    createPlaceholders(numCards) {
      if (!this.$refs.playerHandElement) return;

      // Detect selected pattern
      const selectedPattern = this.content.cardPattern || "default";

      if (selectedPattern === "relationship" && numCards === 7) {
        this.createRelationshipPlaceholders(numCards);
        return;
      }

      const playerHandElement = this.$refs.playerHandElement;
      playerHandElement.innerHTML = "";

      const placeholdersContainer = document.createElement("div");
      placeholdersContainer.style.display = "flex";
      placeholdersContainer.style.flexWrap = "wrap";
      placeholdersContainer.style.justifyContent = "center";
      placeholdersContainer.style.width = "100%";
      placeholdersContainer.style.position = "absolute";
      placeholdersContainer.style.bottom = "0";
      placeholdersContainer.style.left = "0";
      placeholdersContainer.style.gap = "15px";
      placeholdersContainer.style.paddingBottom = "10px";

      playerHandElement.appendChild(placeholdersContainer);

      for (let i = 0; i < numCards; i++) {
        const visiblePlaceholder = document.createElement("div");
        visiblePlaceholder.classList.add("rec-card", "card-placeholder");
        visiblePlaceholder.style.position = "relative";
        visiblePlaceholder.style.margin = "5px";
        placeholdersContainer.appendChild(visiblePlaceholder);
      }

      this.updateHandAreaHeight(numCards);
      console.log(
        `[Tarot Card Reader] v${this.version} - Created ${numCards} placeholders`
      );
    },

    moveRemainingDeckBack() {
      try {
        this.incrementVersion("Moving deck back to start position");
        if (!this.$refs.deckElement || !this.$refs.shuffleDealButton) return;

        const deckElement = this.$refs.deckElement;

        gsap.set(deckElement, { transform: "none" });

        gsap.to(deckElement, {
          duration: 0.4,
          left: "20px",
          top: "20px",
          rotation: 0,
          ease: "back.out(1.2)",
          onComplete: () => {
            try {
              this.isAnimating = false;
              this.$refs.shuffleDealButton.disabled = false;
              this.$refs.shuffleDealButton.classList.remove("shuffling");

              gsap.set(deckElement, {
                transform: "none",
                rotation: 0,
              });

              gsap.fromTo(
                deckElement,
                { top: "17px" },
                { top: "20px", duration: 0.2, ease: "elastic.out(2, 0.3)" }
              );

              // FINAL ANIMATION COMPLETION - at this point cards are fully dealt and visible
              console.log("[Tarot Card Reader] ANIMATION SEQUENCE COMPLETE");

              // Recreate the deck overlay now that animation is complete
              this.createDeckOverlay();

              // We no longer emit the event here to avoid duplicate triggers.
              // The event is already emitted once in the dealCards method.

              this.incrementVersion("Animation sequence complete");
            } catch (err) {
              console.error("[Tarot Card Reader] - Deck reset error:", err);
              // Make sure animation state is still reset on error
              this.isAnimating = false;
              if (this.$refs.shuffleDealButton) {
                this.$refs.shuffleDealButton.disabled = false;
                this.$refs.shuffleDealButton.classList.remove("shuffling");
              }
            }
          },
        });
      } catch (err) {
        console.error("[Tarot Card Reader] - Move deck back error:", err);
        this.isAnimating = false;
        if (this.$refs.shuffleDealButton) {
          this.$refs.shuffleDealButton.disabled = false;
          this.$refs.shuffleDealButton.classList.remove("shuffling");
        }
      }
    },

    preloadCardImages() {
      this.incrementVersion("Preloading card images");

      const imageUrls = [];

      this.deckCards.forEach((card) => {
        if (card.dataset.imageUrl) {
          imageUrls.push(card.dataset.imageUrl);
        }
      });

      if (imageUrls.length > 0) {
        console.log(
          `[Tarot Card Reader] v${this.version} - Preloading ${imageUrls.length} card images`
        );

        const imagePromises = imageUrls.map((url) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(`Failed to load image: ${url}`);
            img.src = url;
          });
        });

        Promise.allSettled(imagePromises).then((results) => {
          const loadedCount = results.filter(
            (r) => r.status === "fulfilled"
          ).length;
          const failedCount = results.filter(
            (r) => r.status === "rejected"
          ).length;
          console.log(
            `[Tarot Card Reader] v${this.version} - Preloaded ${loadedCount} images, ${failedCount} failed`
          );
        });
      } else {
        console.log(
          `[Tarot Card Reader] v${this.version} - No images to preload`
        );
      }
    },

    fixCardAppearanceAfterResize() {
      try {
        if (!this.$refs.playerHandElement) return;

        // Find all dealt cards
        const dealtCards =
          this.$refs.playerHandElement.querySelectorAll(".card-face");

        if (dealtCards && dealtCards.length > 0) {
          this.incrementVersion("Fixing card appearance after resize");

          // Fix card shadows and ensure proper positioning
          dealtCards.forEach((card) => {
            card.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.3)";
            card.style.position = "absolute";
            card.style.width = "100%";
            card.style.height = "100%";
            card.style.top = "0";
            card.style.left = "0";
            card.style.margin = "0";
            card.style.transform = "translateZ(0)";
          });

          // Update the title styles
          this.updateTitleStyles();
        }
      } catch (err) {
        console.error(
          "[Tarot Card Reader] - Error fixing card appearance:",
          err
        );
      }
    },

    updateTitleStyles() {
      try {
        if (!this.$refs.playerHandElement) return;

        this.incrementVersion("Updating title styles");

        // Update CSS variables
        document.documentElement.style.setProperty(
          "--title-color",
          this.content.titleColor || this.content.lightColor || "#f8f0fc"
        );
        document.documentElement.style.setProperty(
          "--title-font-size",
          this.content.titleFontSize
            ? `${this.content.titleFontSize}px`
            : "min(14px, 2.8vw)"
        );

        // Find any existing card titles and update their styling
        const titles =
          this.$refs.playerHandElement.querySelectorAll(".card-title");
        if (titles && titles.length > 0) {
          titles.forEach((title) => {
            title.style.color =
              this.content.titleColor || this.content.lightColor || "#f8f0fc";
            title.style.fontSize = this.content.titleFontSize
              ? `${this.content.titleFontSize}px`
              : "min(14px, 2.8vw)";
          });
        }
      } catch (err) {
        console.error(
          "[Tarot Card Reader] - Error updating title styles:",
          err
        );
      }
    },

    updateAllStyles() {
      // Update all CSS variables
      const root = document.documentElement;
      root.style.setProperty(
        "--deck-border-color",
        this.content.deckBorderColor || "#9e15bf"
      );
      root.style.setProperty(
        "--placeholder-border-color",
        this.content.placeholderBorderColor || "#4ac6d2"
      );
      root.style.setProperty(
        "--placeholder-background-color",
        this.content.placeholderBackgroundColor || "transparent"
      );
      root.style.setProperty(
        "--button-background-color",
        this.content.buttonBackgroundColor || "#9e15bf"
      );
      root.style.setProperty(
        "--button-text-color",
        this.content.buttonTextColor || "#ffffff"
      );
      root.style.setProperty(
        "--card-text-color",
        this.content.lightColor || "#f8f0fc"
      );
      root.style.setProperty(
        "--background-color",
        this.content.backgroundColor || "#38074a"
      );
      root.style.setProperty(
        "--title-color",
        this.content.titleColor || this.content.lightColor || "#f8f0fc"
      );
      root.style.setProperty(
        "--title-font-size",
        this.content.titleFontSize
          ? `${this.content.titleFontSize}px`
          : "min(14px, 2.8vw)"
      );
      root.style.setProperty(
        "--card-back-image",
        `url('${
          this.content.cardbackImageUrl ||
          "https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg"
        }')`
      );
    },

    // Add a method to get current dealt cards
    getDealtCards() {
      console.log("[Tarot Card Reader] Direct action getDealtCards called");
      return this.dealtCards ? [...this.dealtCards] : [];
    },

    // Clear dealt cards
    clearDealtCards() {
      console.log("[Tarot Card Reader] Action clearDealtCards called");

      // Clear the local array
      this.dealtCards = [];

      // Notify WeWeb bindings immediately
      this.$emit("update:resultCards", []);

      console.log(
        "[Tarot Card Reader] Cleared resultCards property in content binding"
      );

      // Update global variable
      window.tarotDealtCards = [];

      // Emit the cards-cleared event using the trigger-event pattern
      this.$emit("trigger-event", {
        name: "cardsCleared",
        payload: {},
      });

      console.log("[Tarot Card Reader] Emitted cardsCleared event");

      // Reflect the change in the full content object first
      this.$emit("update:content", {
        ...this.content,
        resultCards: [],
      });

      // Then emit the dedicated update so external bindings are refreshed
      this.$emit("update:resultCards", []);

      // (Verification helper removed)
    },

    // In the script section, add a special API method that WeWeb can access
    wwGetDealtCards: function () {
      console.log(
        "[Tarot Card Reader] wwGetDealtCards called, returning:",
        this.dealtCards
      );
      return this.dealtCards;
    },

    // Add a "set" method specifically for WeWeb
    setResultCards: function (cards) {
      console.log("[Tarot Card Reader] setResultCards called with:", cards);

      // Only update our local property, and let the watcher emit events
      this.dealtCards = Array.isArray(cards) ? [...cards] : [];

      return this.dealtCards;
    },

    // Add a getter method specifically for WeWeb
    getResultCards: function () {
      console.log("[Tarot Card Reader] getResultCards called");
      return this.dealtCards;
    },

    // Emit events in the documented WeWeb format
    emitWWEvent(eventName, data = {}) {
      console.log(
        `[Tarot Card Reader] Emitting WeWeb event '${eventName}' via trigger-event with payload:`,
        data
      );

      // Use the official WeWeb trigger-event format
      this.$emit("trigger-event", {
        name: eventName,
        payload: data,
      });
    },

    // Add dedicated method for cardRes sync
    syncCardRes() {
      console.log("[Tarot Card Reader] Method syncCardRes called");

      // The dealtCards watcher handles emitting update:content and attempting to update cardRes variable.
      // We keep it here in case it's directly called by an action in WeWeb, but its direct update to cardRes might still fail if cardRes is not found.

      // Ensure content is updated via standard emit, which is the preferred way.
      this.$emit("update:content", {
        resultCards: [...this.dealtCards],
        dealtCardsData: [...this.dealtCards],
      });
      console.log(
        "[Tarot Card Reader] Emitted update:content from syncCardRes method (watcher should also run)"
      );

      // Attempt to update cardRes directly, acknowledging it might fail if variable doesn't exist.
      if (window.wwLib && window.wwLib.wwVariable) {
        try {
          window.wwLib.wwVariable.updateValue("cardRes", [...this.dealtCards]);
          console.log(
            "[Tarot Card Reader] Attempted to sync cardRes directly from syncCardRes method with dealtCards:",
            this.dealtCards
          );
          return true;
        } catch (error) {
          console.error(
            "[Tarot Card Reader] Error attempting to sync cardRes from syncCardRes method:",
            error
          );
        }
      }

      return false;
    },

    // Update a specific WeWeb variable with the dealt cards
    updateVariable: function (variableName) {
      console.log(
        `[Tarot Card Reader] Action updateVariable called for ${variableName}`
      );

      if (!variableName) {
        console.error(
          "[Tarot Card Reader] Variable name is required for updateVariable action"
        );
        return false;
      }

      if (window.wwLib && window.wwLib.wwVariable) {
        try {
          window.wwLib.wwVariable.updateValue(variableName, [
            ...this.dealtCards,
          ]);
          console.log(
            `[Tarot Card Reader] Successfully updated WeWeb variable '${variableName}'`
          );
          return true;
        } catch (error) {
          console.error(
            `[Tarot Card Reader] Error updating variable ${variableName}:`,
            error
          );
        }
      }

      // Also try direct content binding
      if (this.content) {
        this.content.resultCards = [...this.dealtCards];
        console.log(
          `[Tarot Card Reader] Updated content.resultCards as fallback`
        );
      }

      return false;
    },

    // Add a method to update the dealtCardsData property with formatted card info
    updateDealtCardsData() {
      try {
        if (!this.dealtCards || this.dealtCards.length === 0) {
          // If no cards are dealt, send empty array
          this.$emit("update:content", {
            dealtCardsData: [],
          });
          return;
        }

        // Update dealtCardsData with the full array
        this.$emit("update:content", {
          dealtCardsData: [...this.dealtCards],
        });

        console.log(
          "[Tarot Card Reader] Updated dealtCardsData property with array data"
        );
      } catch (err) {
        console.error(
          "[Tarot Card Reader] Error updating dealtCardsData:",
          err
        );
      }
    },

    // Add a direct method WeWeb can call
    getCardsJson() {
      console.log("[Tarot Card Reader] getCardsJson called");
      return JSON.stringify(this.dealtCards || []);
    },

    // Method to synchronize data with WeWeb
    syncResultCards() {
      console.log("[Tarot Card Reader] Method syncResultCards called");

      // Ensure content is updated via standard emit
      this.$emit("update:content", {
        resultCards: [...this.dealtCards],
      });

      // Update global variable
      window.tarotDealtCards = [...this.dealtCards];

      console.log("[Tarot Card Reader] Synchronized data with WeWeb");

      return [...this.dealtCards];
    },

    // Get count of dealt cards - simple number return for WeWeb workflows
    getDealtCardsCount() {
      console.log("[Tarot Card Reader] getDealtCardsCount called");
      const count = this.dealtCards ? this.dealtCards.length : 0;
      console.log("[Tarot Card Reader] Returning dealt cards count:", count);
      return count;
    },

    // Simplify the testUpdateBinding method to use a more direct approach
    testUpdateBinding() {
      // Create test data
      const testCards = [
        {
          id: "test-card-1",
          title: "Test Card 1",
          cardNumber: "1",
          imageUrl: "https://example.com/card1.jpg",
          index: 0,
        },
        {
          id: "test-card-2",
          title: "Test Card 2",
          cardNumber: "2",
          imageUrl: "https://example.com/card2.jpg",
          index: 1,
        },
        {
          id: "test-card-3",
          title: "Test Card 3",
          cardNumber: "3",
          imageUrl: "https://example.com/card3.jpg",
          index: 2,
        },
      ];

      console.log("[Tarot Card Reader] Creating test cards");

      // Set local data
      this.dealtCards = testCards;

      // Skip the binding update for now - we'll do it manually
      console.log(
        "[Tarot Card Reader] Test cards created, use the manual update button"
      );

      return testCards;
    },

    // Implement the manual binding update method
    manuallyUpdateBinding() {
      console.log("[Tarot Card Reader] Manually updating binding");

      // Create a new object for content update
      const contentUpdate = Object.assign({}, this.content);

      // Assign cards to resultCards property
      contentUpdate.resultCards = [...this.dealtCards];

      // Emit the update
      this.$emit("update:content", contentUpdate);

      console.log("[Tarot Card Reader] Manual binding update complete");

      // If you need to push the dealt cards manually, call
      // `window.tarotReaderComponent.updateVariableById(theUuid)` from a
      // workflow or the browser console.  No hard-coded ID here anymore.
    },

    // Basic helper left in place for external calls – no hard-coded ID.
    verifyVariableSync(id, expectedArray = null) {
      if (!id || !window.wwLib || !window.wwLib.wwVariable) return;
      try {
        const current = window.wwLib.wwVariable.getValue(id);
        console.log(
          `[Tarot Card Reader] verifyVariableSync → variable ${id}:`,
          current,
          expectedArray
        );
      } catch (err) {
        console.warn(
          `[Tarot Card Reader] verifyVariableSync failed for ${id}:`,
          err
        );
      }
    },

    // Custom placeholder layout for the "Relationship" pattern (7-card spread)
    createRelationshipPlaceholders(numCards) {
      if (!this.$refs.playerHandElement) return;

      const playerHandElement = this.$refs.playerHandElement;
      playerHandElement.innerHTML = "";

      // Create a container with grid layout
      const placeholdersContainer = document.createElement("div");
      placeholdersContainer.style.display = "grid";
      placeholdersContainer.style.gridTemplateColumns = "1fr 1fr 1fr";
      placeholdersContainer.style.gridTemplateRows = "1fr 1fr 1fr";
      placeholdersContainer.style.gap = "30px 10px";
      placeholdersContainer.style.padding = "20px";
      playerHandElement.appendChild(placeholdersContainer);

      // Card positions in the grid based on the screenshot pattern
      // The positions are defined as [row, column, card index]
      // Where card index matches the dealing order (0-based)
      const gridPositions = [
        [1, 1, 0], // Card 1 (center - middle row, middle column)
        [0, 2, 1], // Card 2 (top-right corner - top row, right column)
        [1, 2, 2], // Card 3 (middle right - middle row, right column)
        [2, 2, 3], // Card 4 (bottom-right corner - bottom row, right column)
        [2, 0, 4], // Card 5 (bottom-left corner - bottom row, left column)
        [1, 0, 5], // Card 6 (middle left - middle row, left column)
        [0, 0, 6], // Card 7 (top-left corner - top row, left column)
      ];

      // Create placeholders and place them in the grid
      for (let i = 0; i < numCards && i < gridPositions.length; i++) {
        const [row, col, cardIndex] = gridPositions[i];

        // Create the placeholder
        const placeholder = document.createElement("div");
        placeholder.classList.add("rec-card", "card-placeholder");
        placeholder.style.margin = "0";

        // Set grid position
        placeholder.style.gridRow = row + 1; // Grid rows are 1-based
        placeholder.style.gridColumn = col + 1; // Grid columns are 1-based

        // Set data attribute for identification (optional)
        placeholder.dataset.cardIndex = cardIndex;

        // Add to the container
        placeholdersContainer.appendChild(placeholder);
      }

      // Ensure the hand area is tall enough
      this.updateHandAreaHeight(numCards);

      console.log(
        `[Tarot Card Reader] v${this.version} - Created relationship pattern placeholders with grid layout`
      );
    },

    // Method to handle clicking on the deck to shuffle
    shuffleFromDeck(event) {
      // Call the existing shuffle method
      this.shuffleAndDeal();

      // Track the click for double-click handling
      if (!this.lastDeckClickTime) {
        this.lastDeckClickTime = new Date().getTime();
      } else {
        const currentTime = new Date().getTime();
        // Check if it's a double click (within 300ms)
        if (currentTime - this.lastDeckClickTime < 300) {
          // Handle double-click if needed
          console.log("[Tarot Card Reader] Double-click detected on deck");
        }
        this.lastDeckClickTime = currentTime;
      }
    },
  },
};
</script>

<style>
.tarot-reader {
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 450px;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #38074a;
  overflow: hidden;
  perspective: 1000px;
  box-sizing: border-box;
}

.game-area {
  position: relative;
  min-height: 300px;
  height: calc(100% - 80px); /* Leave space for controls */
  border: 2px solid #9e15bf;
  background: linear-gradient(135deg, #300538, #170222);
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
  box-sizing: border-box;
}

.deck-area,
.player-hand-area {
  position: absolute;
  display: flex;
}

.deck-area {
  position: absolute;
  width: var(--card-width);
  height: var(--card-height);
  transform: none;
  top: 20px;
  left: 20px;
  z-index: 50;
  transition: none;
  will-change: transform, left, top;
}

.deck-area .card {
  position: absolute;
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
  margin-top: calc(0.2px * var(--index, 0));
  margin-left: calc(0.1px * var(--index, 0));
}

.deck-area .card:nth-child(1) {
  transform: translateZ(0.5px);
}
.deck-area .card:nth-child(2) {
  transform: translateZ(1px);
}
.deck-area .card:nth-child(3) {
  transform: translateZ(1.5px);
}
.deck-area .card:nth-child(4) {
  transform: translateZ(2px);
}
.deck-area .card:nth-child(5) {
  transform: translateZ(2.5px);
}
.deck-area .card:nth-child(6) {
  transform: translateZ(3px);
}
.deck-area .card:nth-child(7) {
  transform: translateZ(3.5px);
}
.deck-area .card:nth-child(8) {
  transform: translateZ(4px);
}
.deck-area .card:nth-child(9) {
  transform: translateZ(4.5px);
}
.deck-area .card:nth-child(10) {
  transform: translateZ(5px);
}

.deck-area .card:last-child {
  box-shadow: 0 1px 8px rgba(158, 21, 191, 0.6), 0 0 2px rgba(0, 0, 0, 0.3);
  transform: translateZ(6px);
}

.player-hand-area {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  min-height: 200px;
  width: 95%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  gap: 15px;
  padding-bottom: 20px; /* Reduced padding since titles are in flex containers now */
}

.rec-card {
  width: min(120px, 20vw);
  height: min(168px, 28vw);
  border: 1.5px solid #4ac6d2;
  border-radius: 8px;
  margin: 5px 5px 25px 5px;
  display: inline-block;
  box-sizing: border-box;
  position: relative;
  background-color: transparent;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1) inset;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  position: absolute;
  width: min(120px, 20vw);
  height: min(168px, 28vw);
  background-color: #f8f0fc;
  border: 1px solid #7a109a;
  border-radius: 8px;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: min(18px, 3.5vw);
  font-weight: bold;
  user-select: none;
  background: linear-gradient(135deg, #f8f0fc, #f0e6fa);
  padding: 5px;
  box-sizing: border-box;
  backface-visibility: hidden;
  will-change: transform;
  transition: box-shadow 0.2s;
  transform-style: preserve-3d;
  transform-origin: center center;
}

.card span {
  display: inline-block;
  text-align: center;
  width: 100%;
}

.player-hand-area .card {
  position: absolute;
  margin: 0;
  z-index: 10;
  border-radius: 8px;
  overflow: hidden;
}

.controls #shuffle-deal-button {
  padding: min(10px, 2vw) min(20px, 4vw);
  font-size: min(16px, 4vw);
  cursor: pointer;
  background-color: #9e15bf;
  color: white;
  border: none;
  border-radius: 5px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.controls #shuffle-deal-button:hover {
  background-color: #7a109a;
}

.controls #shuffle-deal-button:active {
  background-color: #38074a;
  transform: translateY(1px);
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.controls #shuffle-deal-button.shuffling {
  background-color: #4ac6d2;
  cursor: not-allowed;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    background-color: #4ac6d2;
  }
  50% {
    opacity: 0.7;
    background-color: #3aa3ad;
  }
  100% {
    opacity: 1;
    background-color: #4ac6d2;
  }
}

@media (max-width: 768px) {
  .card {
    width: min(90px, 19vw);
    height: min(126px, 26.6vw);
    font-size: min(14px, 3vw);
  }

  .rec-card {
    width: min(90px, 19vw);
    height: min(146px, 56.6vw);
  }

  .deck-area {
    width: min(90px, 19vw);
    height: min(146px, 36.6vw);
  }

  .player-hand-area {
    min-height: 220px;
    bottom: 15px;
    gap: 15px;
    padding-bottom: 50px;
  }

  .rec-card {
    margin: 5px 5px 25px 5px;
  }

  .player-hand-area {
    gap: 25px;
    padding-bottom: 50px;
  }

  .card-title {
    font-size: 0.85em;
  }
}

@media (max-width: 480px) {
  .card {
    width: min(70px, 18vw);
    height: min(98px, 25.2vw);
    font-size: min(12px, 2.5vw);
  }

  .rec-card {
    width: min(90px, 26vw);
    height: min(146px, 45.2vw);
  }

  .deck-area {
    width: min(70px, 18vw);
    height: min(98px, 25.2vw);
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .card {
    width: min(70px, 12vw);
    height: min(98px, 16.8vw);
  }

  .rec-card {
    width: min(70px, 12vw);
    height: min(98px, 16.8vw);
  }

  .deck-area {
    width: min(70px, 12vw);
    height: min(98px, 16.8vw);
  }
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.card-back {
  background-image: var(
    --card-back-image,
    url("https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg")
  ) !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  border: 1.5px solid #9e15bf !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
}

.card-back span {
  opacity: 0 !important;
}

.deck-area .card span {
  display: none !important;
}

.card-face {
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  background-color: #f8f0fc !important;
  border: 1px solid #9e15bf !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 3px !important;
  width: 100% !important;
  height: 100% !important;
  top: 0 !important;
  left: 0 !important;
  position: absolute !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  transform: translateZ(0) !important; /* Force GPU acceleration */
}

.card-face::before {
  content: "" !important;
  position: absolute !important;
  top: 2px !important;
  left: 2px !important;
  right: 2px !important;
  bottom: 2px !important;
  border: 1px solid rgba(158, 21, 191, 0.3) !important;
  border-radius: 6px !important;
  pointer-events: none !important;
}

.card-title {
  width: 100%;
  text-align: center;
  font-size: var(--title-font-size);
  font-weight: bold;
  color: var(--title-color);
  position: absolute;
  top: calc(100% + 10px); /* Consistent 10px spacing from card */
  left: 0;
  z-index: 20;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
  max-width: 100%;
  padding: 0 2px;
  pointer-events: none;
}

.card-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  position: relative;
}

.card-container .card-face {
  flex: 1;
  min-height: 0;
}

.deck-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 105%;
  height: 107%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  z-index: 100;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  font-size: min(14px, 3vw);
  font-weight: bold;
  box-sizing: border-box;
}

.deck-overlay:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.deck-overlay span {
  padding: 5px;
  text-align: center;
  width: 100%;
}
</style>
