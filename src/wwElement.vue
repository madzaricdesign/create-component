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
      version: 1,
      hasInitialized: false,
      apiCallInProgress: false,
      cardsData: null,
      initializationInProgress: false,
      mountCount: 0,
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
        this.adjustGameAreaHeight();
      },
      immediate: true,
    },
  },
  mounted() {
    this.mountCount++;
    console.log(
      `[Tarot Card Reader] v${this.version} - Component mounted (count: ${this.mountCount})`
    );

    document.documentElement.style.setProperty(
      "--card-back-image",
      `url('${
        this.content.cardbackImageUrl ||
        "https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg"
      }')`
    );

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

    window.addEventListener("resize", this.onResize);
  },
  beforeUnmount() {
    console.log(`[Tarot Card Reader] v${this.version} - Component unmounting`);
    window.removeEventListener("resize", this.onResize);
  },
  methods: {
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
      this.updateCardDimensions();
      this.createDeck();

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

        if (
          this.$refs.deckElement &&
          this.$refs.deckElement.style.left === "50%"
        ) {
          gsap.set(this.$refs.deckElement, { x: "-50%" });
        }

        this.adjustGameAreaHeight();
      }
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

      const playerHandElement = this.$refs.playerHandElement;
      const numCards = this.cardsToDisplay;

      playerHandElement.innerHTML = "";
      playerHandElement.style.bottom = "20px";

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

      this.adjustGameAreaHeight();
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

      console.log(`[Tarot Card Reader] v${this.version} - Animation values:`, {
        gameAreaWidth,
        gameAreaHeight,
        deckTopPosition,
        centerPosition: centerX + "px",
        deckSize: this.deckCards.length,
      });

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
          this.incrementVersion("Shuffle animation complete, starting deal");
          this.dealCards();
          clearTimeout(animationTimeout);
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
                stagger: { amount: 0.2, from: "start", ease: "power1.inOut" },
                duration: 0.3,
                ease: "back.out(1.2)",
              },
              "<"
            )
            .to(animationCards, {
              x: (i) => Math.sin(i * 0.5) * 25,
              y: (i) => Math.sin(i * 0.7) * 10,
              rotation: (i) => Math.sin(i * 0.8) * 8,
              stagger: { amount: 0.4, from: "random", ease: "power3.inOut" },
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
    },

    dealCards() {
      this.incrementVersion(`Dealing ${this.cardsToDisplay} cards`);
      if (
        !this.$refs.playerHandElement ||
        !this.$refs.deckElement ||
        !this.$refs.gameArea
      )
        return;

      const playerHandElement = this.$refs.playerHandElement;
      const placeholderContainer = playerHandElement.querySelector("div");
      if (!placeholderContainer) return;

      const placeholders =
        placeholderContainer.querySelectorAll(".card-placeholder");

      const cardsToDealElements = this.deckCards.slice(-this.cardsToDisplay);
      this.deckCards.splice(-this.cardsToDisplay);

      this.updateCardDimensions();

      const deckElement = this.$refs.deckElement;
      const gameArea = this.$refs.gameArea;
      const deckRect = deckElement.getBoundingClientRect();
      const gameAreaRect = gameArea.getBoundingClientRect();
      const containerRect = placeholderContainer.getBoundingClientRect();

      const dealTl = gsap.timeline({
        onComplete: () => {
          this.incrementVersion("Card dealing complete, moving deck back");
          this.moveRemainingDeckBack();
        },
      });

      cardsToDealElements.forEach((card, i) => {
        if (!placeholders[i]) return;

        const targetPlaceholder = placeholders[i];
        const staggerDelay = i * 0.06;

        const firstBounds = card.getBoundingClientRect();
        const first = {
          top: firstBounds.top - gameAreaRect.top,
          left: firstBounds.left - gameAreaRect.left,
          width: firstBounds.width,
          height: firstBounds.height,
        };

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

        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        gsap.set(card, {
          x: deltaX,
          y: deltaY,
          transformOrigin: "center center",
          zIndex: 100 + i,
        });

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
              card.classList.remove("card-back");
              card.classList.add("card-face");

              if (card.dataset.imageUrl) {
                card.style.backgroundImage = `url('${card.dataset.imageUrl}')`;
                card.style.backgroundSize = "contain";
                card.style.backgroundPosition = "center";
                card.style.backgroundRepeat = "no-repeat";
                card.style.backgroundColor =
                  this.content.lightColor || "#f8f0fc";
              } else {
                card.style.backgroundColor =
                  this.content.lightColor || "#f8f0fc";
              }

              card.style.borderColor =
                this.content.deckBorderColor || "#9e15bf";

              const titleElement = card.querySelector("span");
              if (titleElement) {
                card.removeChild(titleElement);

                const titleContainer = document.createElement("div");
                titleContainer.classList.add("card-title");
                titleContainer.textContent = titleElement.textContent;

                titleContainer.style.position = "absolute";
                titleContainer.style.top = "100%";
                titleContainer.style.left = "0";
                titleContainer.style.whiteSpace = "normal";
                titleContainer.style.width = "100%";
                titleContainer.style.textAlign = "center";
                titleContainer.style.color =
                  this.content.lightColor || "#f8f0fc";
                titleContainer.style.fontWeight = "bold";
                titleContainer.style.fontSize = "0.9em";
                titleContainer.style.textShadow = "0 0 4px rgba(0, 0, 0, 0.8)";

                card.appendChild(titleContainer);
              }

              gsap.set(card, { rotationY: 0 });
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
      });

      dealTl.add(() => {
        gsap.to(cardsToDealElements, {
          boxShadow: "0 0 8px rgba(255,255,255,0.7)",
          duration: 0.1,
          yoyo: true,
          repeat: 1,
        });
      });
    },

    createPlaceholders(numCards) {
      if (!this.$refs.playerHandElement) return;

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

      playerHandElement.appendChild(placeholdersContainer);

      for (let i = 0; i < numCards; i++) {
        const visiblePlaceholder = document.createElement("div");
        visiblePlaceholder.classList.add("rec-card", "card-placeholder");
        visiblePlaceholder.style.position = "relative";
        visiblePlaceholder.style.margin = "5px 5px 25px 5px";
        placeholdersContainer.appendChild(visiblePlaceholder);
      }

      this.updateHandAreaHeight(numCards);
      console.log(
        `[Tarot Card Reader] v${this.version} - Created ${numCards} placeholders`
      );
    },

    moveRemainingDeckBack() {
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

          this.incrementVersion("Animation sequence complete");
        },
      });
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
