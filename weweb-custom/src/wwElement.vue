<template>
  <div class="tarot-reader">
    <h1 class="tarot-title">{{ content.title }}</h1>
    <p class="tarot-intro">{{ content.introText }}</p>
    <div class="game-area" ref="gameArea">
      <div class="deck-area" id="deck" ref="deckElement">
        <!-- Cards will be added here by JS -->
      </div>
      <div class="player-hand-area" id="player-hand" ref="playerHandElement">
        <!-- Dealt cards will go here -->
      </div>
    </div>

    <div class="controls">
      <div class="card-count-selector">
        <label for="card-count">Cards to reveal:</label>
        <select
          id="card-count"
          ref="cardCountSelect"
          v-model="selectedCardCount"
          @change="onCardCountChange">
          <option
            v-for="option in content.cardOptions"
            :key="option.value"
            :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <button
        id="shuffle-deal-button"
        ref="shuffleDealButton"
        @click="shuffleAndDeal"
        :disabled="isAnimating">
        {{ content.buttonText }}
      </button>
    </div>
  </div>
</template>

<script>
import { gsap } from "gsap";

export default {
  props: {
    content: { type: Object, required: true },
  },
  data() {
    return {
      deckCards: [],
      isAnimating: false,
      cardWidth: 120,
      cardHeight: 168,
      cardMargin: 10,
      selectedCardCount: "3",
      cardsToDisplay: 3,
      version: 1, // Track version number
    };
  },
  computed: {
    cssVars() {
      return {
        "--main-color": this.content.mainColor || "#9e15bf",
        "--secondary-color": this.content.secondaryColor || "#4ac6d2",
        "--main-dark": this.adjustColor(
          this.content.mainColor || "#9e15bf",
          -20
        ),
        "--secondary-dark": this.adjustColor(
          this.content.secondaryColor || "#4ac6d2",
          -20
        ),
        "--light-accent": this.content.lightColor || "#f8f0fc",
        "--dark-accent": this.content.darkColor || "#38074a",
        "--card-width": `min(120px, 20vw)`,
        "--card-height": `min(168px, 28vw)`,
        "--card-margin": `min(10px, 2vw)`,
        "--font-size": `min(18px, 3.5vw)`,
      };
    },
  },
  mounted() {
    console.log(`[Tarot Card Reader] v${this.version} - Component mounted`);
    this.selectedCardCount = (this.content.defaultCardOption || 3).toString();
    this.cardsToDisplay = parseInt(this.selectedCardCount);

    // Set cardback image CSS variable
    document.documentElement.style.setProperty(
      "--card-back-image",
      `url('${
        this.content.cardbackImageUrl ||
        "https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg"
      }')`
    );

    this.$nextTick(() => {
      this.initializeComponent();
    });
    window.addEventListener("resize", this.onResize);
  },
  beforeUnmount() {
    console.log(`[Tarot Card Reader] v${this.version} - Component unmounting`);
    window.removeEventListener("resize", this.onResize);
  },
  methods: {
    // Helper function to darken/lighten colors
    adjustColor(hex, percent) {
      // Remove the # if it exists
      hex = hex.replace(/^#/, "");

      // Parse the hex color
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      // Adjust the color
      r = Math.max(0, Math.min(255, r + percent));
      g = Math.max(0, Math.min(255, g + percent));
      b = Math.max(0, Math.min(255, b + percent));

      // Convert back to hex
      return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    },

    // Fetch tarot cards from the WordPress API
    async fetchTarotCards() {
      try {
        console.log(
          `[Tarot Card Reader] v${this.version} - Fetching cards from WordPress API...`
        );

        // Use the configurable API URL from ww-config properties
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
          // Log the actual response text to see what's being returned
          const responseText = await response.text();
          console.error(
            `[Tarot Card Reader] v${this.version} - API returned non-OK status:`,
            response.status
          );
          console.error(
            "Response text:",
            responseText.substring(0, 500) + "..."
          ); // Show first 500 chars
          throw new Error(`API request failed with status ${response.status}`);
        }

        // Get response text first so we can debug if needed
        const responseText = await response.text();

        // Check if response looks like HTML
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

        // Try to parse the response as JSON
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

        // Check if data is not an array or empty
        if (!Array.isArray(data)) {
          console.warn(
            `[Tarot Card Reader] v${this.version} - API response is not an array:`,
            data
          );
          // If it's still not an array, make it one with a single item
          data = [data];
        }

        // Map the waite-tarot WordPress API structure to our card format
        const tarotCards = data.map((post) => {
          // Extract card number from toolset-meta if available
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
            imageUrl: null, // Will be populated by fetchCardImage if needed
          };
        });

        console.log(
          `[Tarot Card Reader] v${this.version} - Processed ${tarotCards.length} cards from API`
        );

        // If we got no cards, try using fallback data
        if (tarotCards.length === 0) {
          console.warn(
            `[Tarot Card Reader] v${this.version} - No cards received from API, using fallback data`
          );
          return this.createFallbackCards();
        }

        // Sort cards by card number if needed
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

    // Fetch card image from WordPress media library
    async fetchCardImage(mediaId) {
      // If no media ID, return null
      if (!mediaId) return null;

      try {
        // Extract the base URL from the API URL to build the media endpoint
        const apiUrl =
          this.content.apiUrl ||
          "https://b145kh3.myrdbx.io/wp-json/wp/v2/waite-tarot?per_page=80";
        const baseUrl = apiUrl.split("/wp-json/")[0];
        const mediaUrl = `${baseUrl}/wp-json/wp/v2/media/${mediaId}`;

        console.log(
          `[Tarot Card Reader] v${this.version} - Fetching image from: ${mediaUrl}`
        );

        // Use the WordPress REST API media endpoint
        const response = await fetch(mediaUrl);

        if (!response.ok) {
          console.error(
            `[Tarot Card Reader] v${this.version} - Failed to fetch image with ID ${mediaId}, status: ${response.status}`
          );
          return null;
        }

        // Try to get response as text first for debugging
        const responseText = await response.text();

        try {
          const media = JSON.parse(responseText);
          // WordPress media objects have source_url property for the full image URL
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
      this.updateCardDimensions();
      this.createDeck();

      // Set initial deck position
      if (this.$refs.deckElement) {
        gsap.set(this.$refs.deckElement, {
          left: "20px",
          top: "20px",
          x: 0,
          y: 0,
        });
      }

      this.updatePlaceholderCards();
      this.adjustGameAreaHeight();
      this.preloadCardImages();
      this.incrementVersion("Component initialization complete");
    },

    onResize() {
      if (!this.isAnimating) {
        this.incrementVersion("Handling resize");
        this.updateCardDimensions();

        // Maintain center position if in animation
        if (
          this.$refs.deckElement &&
          this.$refs.deckElement.style.left === "50%"
        ) {
          gsap.set(this.$refs.deckElement, { x: "-50%" });
        }

        this.adjustGameAreaHeight();
      }
    },

    onCardCountChange() {
      this.incrementVersion(`Card count changed to ${this.selectedCardCount}`);
      this.cardsToDisplay = parseInt(this.selectedCardCount);
      this.updatePlaceholderCards();
      this.adjustGameAreaHeight();
    },

    updateCardDimensions() {
      const computedStyle = getComputedStyle(document.documentElement);
      this.cardWidth =
        parseInt(computedStyle.getPropertyValue("--card-width")) || 120;
      this.cardHeight =
        parseInt(computedStyle.getPropertyValue("--card-height")) || 168;
      this.cardMargin =
        parseInt(computedStyle.getPropertyValue("--card-margin")) || 10;
      console.log(
        `[Tarot Card Reader] v${this.version} - Card dimensions updated: ${this.cardWidth}x${this.cardHeight}`
      );
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

      // Show loading message
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
        // Fetch tarot cards from WordPress API
        const tarotCards = await this.fetchTarotCards();

        if (tarotCards.length === 0) {
          throw new Error("No tarot cards were loaded");
        }

        // Create a sample card for deck display (only need 10 for visual effect)
        const cardCount = Math.min(52, tarotCards.length);
        for (let i = 0; i < cardCount; i++) {
          const tarotCard = tarotCards[i];
          const card = document.createElement("div");
          card.classList.add("card", "card-back");

          // Store tarot card data
          card.dataset.cardId = i;
          card.dataset.tarotId = tarotCard.id;
          card.dataset.cardNumber = tarotCard.cardNumber;
          card.dataset.title = tarotCard.title;

          // Store image URL if available directly or fetch from WordPress media library
          if (tarotCard.imageUrl) {
            card.dataset.imageUrl = tarotCard.imageUrl;
            console.log(
              `Card ${tarotCard.title} has image: ${tarotCard.imageUrl}`
            );
          } else if (tarotCard.featuredMediaId) {
            // Fetch image from WordPress media library
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

          // Create card content with tarot title
          card.innerHTML = `<span style="color: var(--main-dark)">${tarotCard.title}</span>`;

          deckElement.appendChild(card);
          this.deckCards.push(card);
        }

        loadingMessage.remove();

        // Initial stacking position with slight offsets
        gsap.set(this.deckCards, {
          x: (i) => Math.random() * 0.5 - 0.25,
          y: (i) => Math.random() * 0.5 - 0.25,
          rotation: (i) => Math.random() * 0.8 - 0.4,
          zIndex: (i) => i,
        });

        // Set stack index for visual stacking effect
        this.deckCards.forEach((card, index) => {
          card.style.setProperty("--index", index);
        });

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

    // For WeWeb, we'll use fallback cards instead of API fetching
    createFallbackCards() {
      // Create basic cards as a fallback
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

      // Major Arcana
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

      // Major Arcana card images (placeholders using free tarot images)
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

      // Add Major Arcana
      majorArcana.forEach((title, index) => {
        fallbackCards.push({
          id: `major-${index}`,
          title: title,
          cardNumber: index.toString(),
          featuredMediaId: null,
          imageUrl: majorArcanaImages[index] || null,
        });
      });

      // Minor Arcana card base URLs
      const suitImageBaseUrls = {
        Cups: "https://www.trustedtarot.com/img/cards/cup-",
        Pentacles: "https://www.trustedtarot.com/img/cards/pentacle-",
        Swords: "https://www.trustedtarot.com/img/cards/sword-",
        Wands: "https://www.trustedtarot.com/img/cards/wand-",
      };

      // Add Minor Arcana
      suits.forEach((suit) => {
        values.forEach((value, index) => {
          // Convert card value to number for image URL
          let cardNum = index + 1;
          let imageValue = cardNum.toString();

          // Handle court cards
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

      const playerHandElement = this.$refs.playerHandElement;
      const numCards = this.cardsToDisplay;

      playerHandElement.innerHTML = "";
      playerHandElement.style.bottom = "20px";

      // Create container for placeholders
      const placeholdersContainer = document.createElement("div");
      placeholdersContainer.style.display = "flex";
      placeholdersContainer.style.flexWrap = "wrap";
      placeholdersContainer.style.justifyContent = "center";
      placeholdersContainer.style.width = "100%";
      placeholdersContainer.style.position = "absolute";
      placeholdersContainer.style.bottom = "0";
      placeholdersContainer.style.left = "0";
      placeholdersContainer.style.gap = "15px";

      playerHandElement.appendChild(placeholdersContainer);

      // Create placeholders
      for (let i = 0; i < numCards; i++) {
        const visiblePlaceholder = document.createElement("div");
        visiblePlaceholder.classList.add("rec-card", "card-placeholder");
        visiblePlaceholder.style.position = "relative";
        visiblePlaceholder.style.margin = "5px 5px 25px 5px";
        placeholdersContainer.appendChild(visiblePlaceholder);
      }

      this.updateHandAreaHeight(numCards);
    },

    updateHandAreaHeight(numCards) {
      if (!this.$refs.playerHandElement) return;

      const playerHandElement = this.$refs.playerHandElement;
      const isMobile = window.innerWidth < 768;
      const maxCardsPerRow = isMobile ? 2 : 5;
      const numRows = Math.ceil(numCards / maxCardsPerRow);

      // Calculate height based on rows
      const rowGap = isMobile ? 25 : 20;
      const padding = 40;
      const titleHeight = isMobile ? 50 : 40;
      const totalHeight =
        numRows * (this.cardHeight + titleHeight) +
        (numRows - 1) * rowGap +
        padding;

      playerHandElement.style.minHeight = `${totalHeight}px`;
      playerHandElement.style.height = `${totalHeight}px`;
      console.log(
        `[Tarot Card Reader] v${this.version} - Hand area height updated: ${totalHeight}px`
      );
    },

    adjustGameAreaHeight() {
      if (!this.$refs.gameArea) return;

      const numCards = this.cardsToDisplay;
      const gameArea = this.$refs.gameArea;

      // Calculate player hand height
      const isMobile = window.innerWidth < 768;
      const maxCardsPerRow = isMobile ? 2 : 5;
      const numRows = Math.ceil(numCards / maxCardsPerRow);
      const rowGap = isMobile ? 25 : 20;
      const padding = 40;
      const titleHeight = isMobile ? 50 : 40;
      const playerHandHeight =
        numRows * (this.cardHeight + titleHeight) +
        (numRows - 1) * rowGap +
        padding;

      // Calculate minimum required height
      const deckTopPosition = 20;
      const deckHeight = this.cardHeight;
      const minGapRequired = 60;
      const bottomMargin = 30;

      const minHeightRequired =
        deckTopPosition +
        deckHeight +
        minGapRequired +
        playerHandHeight +
        bottomMargin;
      const maxAllowedHeight = Math.max(
        minHeightRequired,
        window.innerHeight * 0.85
      );

      gameArea.style.height = `${maxAllowedHeight}px`;
      console.log(
        `[Tarot Card Reader] v${this.version} - Game area height adjusted: ${maxAllowedHeight}px`
      );
      return maxAllowedHeight;
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

      this.isAnimating = true;
      const shuffleDealButton = this.$refs.shuffleDealButton;
      shuffleDealButton.disabled = true;
      shuffleDealButton.classList.add("shuffling");
      const deckElement = this.$refs.deckElement;
      const gameArea = this.$refs.gameArea;

      // Set animation timeout safety
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

      // Update cards to deal
      this.cardsToDisplay = parseInt(this.selectedCardCount);
      this.cardsToDisplay = Math.min(
        this.cardsToDisplay,
        this.deckCards.length
      );

      // Update layout
      this.adjustGameAreaHeight();
      this.updateCardDimensions();
      this.$refs.playerHandElement.innerHTML = "";
      this.createPlaceholders(this.cardsToDisplay);

      // Get exact dimensions before animation
      const gameAreaRect = gameArea.getBoundingClientRect();
      const gameAreaWidth = gameAreaRect.width;
      const gameAreaHeight = gameAreaRect.height;
      const deckTopPosition = Math.max(gameAreaHeight * 0.2, 80);

      // Calculate center position (simpler direct positioning)
      const centerX = gameAreaWidth / 2 - this.cardWidth / 2;

      // Clear any existing transforms and set absolute position
      deckElement.style.transform = "none";

      // Reset deck to starting position with absolute values
      gsap.set(deckElement, {
        position: "absolute",
        left: "20px",
        top: "20px",
        rotation: 0,
        zIndex: 100,
        transform: "none",
      });

      // Reset all cards to deck
      this.deckCards.forEach((card) => {
        card.classList.add("card-back");
        card.style.backgroundImage = "";
        deckElement.appendChild(card);
      });

      // Shuffle the cards and update DOM
      const shuffledDeckCards = this.shuffleArray(this.deckCards);
      this.deckCards = shuffledDeckCards;
      this.deckCards.forEach((card) => deckElement.appendChild(card));
      this.incrementVersion("Cards shuffled");

      // Debug logs
      console.log(`[Tarot Card Reader] v${this.version} - Animation values:`, {
        gameAreaWidth,
        gameAreaHeight,
        deckTopPosition,
        centerPosition: centerX + "px",
      });

      // Create animation timeline with clear steps
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          this.incrementVersion("Shuffle animation complete, starting deal");
          this.dealCards();
          clearTimeout(animationTimeout);
        },
      });

      // STEP 1: Move deck to center - simpler direct positioning
      tl.to(deckElement, {
        duration: 0.7,
        left: centerX + "px", // Direct center positioning
        top: deckTopPosition + "px",
        rotation: 2,
        ease: "power1.inOut",
        onStart: () => {
          console.log(
            `[Tarot Card Reader] v${this.version} - Moving deck to center: ${centerX}px, ${deckTopPosition}px`
          );
        },
      });

      // STEP 2: Spread cards
      tl.to(this.deckCards, {
        x: (i) => (i % 2 === 0 ? -3 : 3),
        y: (i) => (i % 3 === 0 ? -2 : 2),
        stagger: { amount: 0.2, from: "center" },
        duration: 0.2,
      });

      // STEP 3: Shuffle animation
      tl.add(() => {
        // Split deck for riffle shuffle
        const halfDeckSize = Math.floor(this.deckCards.length / 2);
        const firstHalf = this.deckCards.slice(0, halfDeckSize);
        const secondHalf = this.deckCards.slice(halfDeckSize);

        // Move first half left
        tl.to(firstHalf, {
          x: (i) => -40,
          y: (i) => 10 + Math.sin(i * 0.3) * 5,
          rotation: -5,
          stagger: { amount: 0.3, from: "start", ease: "power1.inOut" },
          duration: 0.4,
          ease: "back.out(1.2)",
        })
          // Move second half right (simultaneously)
          .to(
            secondHalf,
            {
              x: (i) => 40,
              y: (i) => 10 + Math.sin(i * 0.3) * 5,
              rotation: 5,
              stagger: { amount: 0.3, from: "start", ease: "power1.inOut" },
              duration: 0.4,
              ease: "back.out(1.2)",
            },
            "<"
          )
          // Interleave cards (riffle)
          .to(this.deckCards, {
            x: (i) => Math.sin(i * 0.5) * 3,
            y: 0,
            rotation: (i) => Math.sin(i * 0.8) * 1,
            stagger: { amount: 0.5, from: "random", ease: "power3.inOut" },
            duration: 0.6,
            ease: "elastic.out(0.5, 0.3)",
          })
          // Final position adjustment
          .to(this.deckCards, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.3,
            ease: "power2.inOut",
          });
      });
    },

    dealCards() {
      this.incrementVersion(`Dealing ${this.cardsToDisplay} cards`);
      if (
        !this.$refs.playerHandElement ||
        !this.$refs.deckElement ||
        !this.$refs.gameArea
      )
        return;

      // Get placeholders
      const playerHandElement = this.$refs.playerHandElement;
      const placeholderContainer = playerHandElement.querySelector("div");
      if (!placeholderContainer) return;

      const placeholders =
        placeholderContainer.querySelectorAll(".card-placeholder");

      // Get top cards from deck
      const cardsToDealElements = this.deckCards.slice(-this.cardsToDisplay);
      this.deckCards.splice(-this.cardsToDisplay); // Remove from deck array

      // Update card dimensions
      this.updateCardDimensions();

      // Get positions
      const deckElement = this.$refs.deckElement;
      const gameArea = this.$refs.gameArea;
      const deckRect = deckElement.getBoundingClientRect();
      const gameAreaRect = gameArea.getBoundingClientRect();
      const containerRect = placeholderContainer.getBoundingClientRect();

      // Animation timeline
      const dealTl = gsap.timeline({
        onComplete: () => {
          this.incrementVersion("Card dealing complete, moving deck back");
          this.moveRemainingDeckBack();
        },
      });

      // Deal each card (FLIP animation technique)
      cardsToDealElements.forEach((card, i) => {
        if (!placeholders[i]) return;

        const targetPlaceholder = placeholders[i];
        const staggerDelay = i * 0.12;

        // STEP 1: FIRST - get initial position at deck
        const firstBounds = card.getBoundingClientRect();
        const first = {
          top: firstBounds.top - gameAreaRect.top,
          left: firstBounds.left - gameAreaRect.left,
          width: firstBounds.width,
          height: firstBounds.height,
        };

        // STEP 2: LAST - position card over placeholder
        const placeholderBounds = targetPlaceholder.getBoundingClientRect();
        placeholderContainer.appendChild(card);

        gsap.set(card, {
          position: "absolute",
          width: `${this.cardWidth}px`,
          height: `${this.cardHeight}px`,
          left: `${placeholderBounds.left - containerRect.left}px`,
          top: `${placeholderBounds.top - containerRect.top}px`,
          margin: 0,
          zIndex: 10,
        });

        const lastBounds = card.getBoundingClientRect();
        const last = {
          top: lastBounds.top - gameAreaRect.top,
          left: lastBounds.left - gameAreaRect.left,
          width: lastBounds.width,
          height: lastBounds.height,
        };

        // STEP 3: INVERT - calculate deltas
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        gsap.set(card, {
          x: deltaX,
          y: deltaY,
          transformOrigin: "center center",
          zIndex: 100 + i,
        });

        // STEP 4: PLAY - animate to final position
        dealTl.to(card, {
          duration: 0.5,
          x: 0,
          y: 0,
          ease: "power2.out",
          delay: staggerDelay,
        });

        // Add card flip animation
        dealTl.to(
          card,
          {
            rotationY: 180,
            duration: 0.3,
            ease: "power1.inOut",
            onStart: function () {
              gsap.set(card, {
                transformPerspective: 800,
                transformOrigin: "center center",
              });
            },
            onComplete: function () {
              // Reveal card face
              card.classList.remove("card-back");
              card.classList.add("card-face");

              // Apply image URL if available
              if (card.dataset.imageUrl) {
                card.style.backgroundImage = `url('${card.dataset.imageUrl}')`;
                card.style.backgroundSize = "contain";
                card.style.backgroundPosition = "center";
                card.style.backgroundRepeat = "no-repeat";
                card.style.backgroundColor = "#f8f0fc";
              } else {
                // Fallback color if no image
                card.style.backgroundColor = "#f8f0fc";
              }

              // Move title below card
              const titleElement = card.querySelector("span");
              if (titleElement) {
                card.removeChild(titleElement);

                const titleContainer = document.createElement("div");
                titleContainer.classList.add("card-title");
                titleContainer.textContent = titleElement.textContent;

                // Style title
                titleContainer.style.position = "absolute";
                titleContainer.style.top = "100%";
                titleContainer.style.left = "0";
                titleContainer.style.whiteSpace = "normal";
                titleContainer.style.width = "100%";
                titleContainer.style.textAlign = "center";
                titleContainer.style.color = "#f8f0fc";
                titleContainer.style.fontWeight = "bold";
                titleContainer.style.fontSize = "0.9em";
                titleContainer.style.textShadow = "0 0 4px rgba(0, 0, 0, 0.8)";

                card.appendChild(titleContainer);
              }

              // Reset rotation
              gsap.set(card, { rotationY: 0 });
            },
          },
          ">"
        );

        // Add subtle "settle" effect
        dealTl.to(
          card,
          {
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            duration: 0.1,
            delay: -0.1,
          },
          ">-0.1"
        );

        dealTl.to(card, {
          boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
          duration: 0.2,
        });
      });

      // Flash effect on all cards
      dealTl.add(() => {
        gsap.to(cardsToDealElements, {
          boxShadow: "0 0 8px rgba(255,255,255,0.7)",
          duration: 0.15,
          yoyo: true,
          repeat: 1,
        });
      });
    },

    createPlaceholders(numCards) {
      if (!this.$refs.playerHandElement) return;

      const playerHandElement = this.$refs.playerHandElement;
      playerHandElement.innerHTML = "";

      // Create container for placeholders
      const placeholdersContainer = document.createElement("div");
      placeholdersContainer.style.display = "flex";
      placeholdersContainer.style.flexWrap = "wrap";
      placeholdersContainer.style.justifyContent = "center";
      placeholdersContainer.style.width = "100%";
      placeholdersContainer.style.position = "absolute";
      placeholdersContainer.style.bottom = "0";
      placeholdersContainer.style.left = "0";
      placeholdersContainer.style.gap = "15px"; // Consistent gap

      playerHandElement.appendChild(placeholdersContainer);

      // Create visible placeholders
      for (let i = 0; i < numCards; i++) {
        const visiblePlaceholder = document.createElement("div");
        visiblePlaceholder.classList.add("rec-card", "card-placeholder");
        visiblePlaceholder.style.position = "relative";
        visiblePlaceholder.style.margin = "5px 5px 25px 5px"; // 25px bottom margin for titles
        placeholdersContainer.appendChild(visiblePlaceholder);
      }

      // Set height for hand area
      this.updateHandAreaHeight(numCards);
      console.log(
        `[Tarot Card Reader] v${this.version} - Created ${numCards} placeholders`
      );
    },

    moveRemainingDeckBack() {
      this.incrementVersion("Moving deck back to start position");
      if (!this.$refs.deckElement || !this.$refs.shuffleDealButton) return;

      const deckElement = this.$refs.deckElement;

      // Clear any transform properties before animating
      gsap.set(deckElement, { transform: "none" });

      gsap.to(deckElement, {
        duration: 0.7,
        left: "20px",
        top: "20px",
        rotation: 0,
        ease: "back.out(1.2)",
        onComplete: () => {
          this.isAnimating = false;
          this.$refs.shuffleDealButton.disabled = false;
          this.$refs.shuffleDealButton.classList.remove("shuffling");

          // Make sure position is reset cleanly
          gsap.set(deckElement, {
            transform: "none",
            rotation: 0,
          });

          // Final settling animation
          gsap.fromTo(
            deckElement,
            { top: "17px" },
            { top: "20px", duration: 0.3, ease: "elastic.out(2, 0.3)" }
          );

          this.incrementVersion("Animation sequence complete");
        },
      });
    },

    // Preload card images to ensure they display when cards are dealt
    preloadCardImages() {
      this.incrementVersion("Preloading card images");

      // Preload whatever images we already have in the deck cards
      const imageUrls = [];

      // Get image URLs from deck cards first (which might have API-loaded images)
      this.deckCards.forEach((card) => {
        if (card.dataset.imageUrl) {
          imageUrls.push(card.dataset.imageUrl);
        }
      });

      // If we have deck cards with images, preload them
      if (imageUrls.length > 0) {
        console.log(
          `[Tarot Card Reader] v${this.version} - Preloading ${imageUrls.length} card images`
        );

        // Create an array of promises for preloading
        const imagePromises = imageUrls.map((url) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(`Failed to load image: ${url}`);
            img.src = url;
          });
        });

        // Use Promise.allSettled to handle all image loading attempts
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
}

.game-area {
  position: relative;
  width: min(80vw, 800px);
  height: min(70vh, 600px);
  min-height: 300px;
  border: 2px solid #9e15bf;
  background: linear-gradient(135deg, #300538, #170222);
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(158, 21, 191, 0.3),
    0 0 30px rgba(158, 21, 191, 0.2) inset;
  margin-bottom: 20px;
  overflow: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.deck-area,
.player-hand-area {
  position: absolute;
  display: flex;
}

.deck-area {
  position: absolute;
  width: min(120px, 20vw);
  height: min(168px, 28vw);
  transform: none;
  top: 20px;
  left: 20px;
  z-index: 50;
  transition: none; /* Prevent CSS transitions from interfering with GSAP */
  will-change: transform, left, top; /* Hint to browser about properties that will animate */
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
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-height: 200px;
  width: 95%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  gap: 15px;
  padding-bottom: 35px;
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
    height: min(126px, 26.6vw);
  }

  .deck-area {
    width: min(90px, 19vw);
    height: min(126px, 26.6vw);
  }

  .game-area {
    height: 65vh;
  }

  .player-hand-area {
    min-height: 220px;
    bottom: 15px;
    gap: 15px;
    padding-bottom: 50px;
  }

  .tarot-title {
    font-size: 1.8rem;
  }

  .tarot-intro {
    font-size: 0.9rem;
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
    width: min(70px, 18vw);
    height: min(98px, 25.2vw);
  }

  .deck-area {
    width: min(70px, 18vw);
    height: min(98px, 25.2vw);
  }

  .tarot-title {
    font-size: 1.5rem;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .game-area {
    height: 78vh;
  }

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

.card-count-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f8f0fc;
  font-weight: bold;
}

select {
  padding: 5px;
  border-radius: 5px;
  background-color: #9e15bf;
  color: white;
  border: none;
  cursor: pointer;
}

select:focus {
  outline: none;
  box-shadow: 0 0 5px #4ac6d2;
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
  background-size: contain !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  background-color: #f8f0fc !important;
  border: 1px solid #9e15bf !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 3px !important;
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

.tarot-title {
  color: #f8f0fc !important;
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px #9e15bf, 0 0 20px #9e15bf;
  font-family: "Georgia", serif;
}

.tarot-intro {
  color: #4ac6d2;
  text-align: center;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.card-title {
  width: 100%;
  text-align: center;
  font-size: 0.9em;
  font-weight: bold;
  color: #f8f0fc;
  margin-top: 8px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
  max-width: 120%;
  padding: 0 2px;
}
</style>
