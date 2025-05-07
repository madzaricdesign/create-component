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
    };
  },
  computed: {
    cssVars() {
      return {
        "--main-color": this.content.mainColor,
        "--secondary-color": this.content.secondaryColor,
        "--main-dark": this.adjustColor(this.content.mainColor, -20),
        "--secondary-dark": this.adjustColor(this.content.secondaryColor, -20),
        "--light-accent": this.content.lightColor,
        "--dark-accent": this.content.darkColor,
        "--card-width": `min(120px, 20vw)`,
        "--card-height": `min(168px, 28vw)`,
        "--card-margin": `min(10px, 2vw)`,
        "--font-size": `min(18px, 3.5vw)`,
      };
    },
  },
  mounted() {
    this.selectedCardCount = this.content.defaultCardOption.toString();
    this.cardsToDisplay = parseInt(this.selectedCardCount);
    this.initializeComponent();
    window.addEventListener("resize", this.onResize);
  },
  beforeUnmount() {
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

    initializeComponent() {
      this.updateCardDimensions();
      this.createDeck();

      // Set initial deck position
      gsap.set(this.$refs.deckElement, {
        left: "20px",
        top: "20px",
        x: 0,
        y: 0,
      });

      this.updatePlaceholderCards();
      this.adjustGameAreaHeight();
    },

    onResize() {
      if (!this.isAnimating) {
        this.updateCardDimensions();

        // Maintain center position if in animation
        if (this.$refs.deckElement.style.left === "50%") {
          gsap.set(this.$refs.deckElement, { x: "-50%" });
        }

        this.adjustGameAreaHeight();
      }
    },

    onCardCountChange() {
      this.cardsToDisplay = parseInt(this.selectedCardCount);
      this.updatePlaceholderCards();
      this.adjustGameAreaHeight();
    },

    updateCardDimensions() {
      const computedStyle = getComputedStyle(document.documentElement);
      this.cardWidth = parseInt(computedStyle.getPropertyValue("--card-width"));
      this.cardHeight = parseInt(
        computedStyle.getPropertyValue("--card-height")
      );
      this.cardMargin = parseInt(
        computedStyle.getPropertyValue("--card-margin")
      );
    },

    async createDeck() {
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
        const tarotCards = await this.fetchTarotCards();

        if (tarotCards.length === 0) {
          throw new Error("No tarot cards were loaded");
        }

        // Create a card element for each tarot card
        for (let i = 0; i < tarotCards.length; i++) {
          const tarotCard = tarotCards[i];
          const card = document.createElement("div");
          card.classList.add("card", "card-back");

          // Store tarot card data
          card.dataset.cardId = i;
          card.dataset.tarotId = tarotCard.id;
          card.dataset.cardNumber = tarotCard.cardNumber;
          card.dataset.title = tarotCard.title;

          // Try to use direct image URL if available
          if (tarotCard.imageUrl) {
            card.dataset.imageUrl = tarotCard.imageUrl;
          } else if (tarotCard.featuredMediaId) {
            // Fallback to fetching image if needed
            const imageUrl = await this.fetchCardImage(
              tarotCard.featuredMediaId
            );
            if (imageUrl) {
              card.dataset.imageUrl = imageUrl;
            }
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

        return true;
      } catch (error) {
        console.error("Error creating tarot deck:", error);
        loadingMessage.textContent = "Error loading cards. Please refresh.";
        loadingMessage.style.color = "red";
        return false;
      }
    },

    async fetchTarotCards() {
      try {
        console.log("Fetching cards from API...");
        const response = await fetch(this.content.apiUrl, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
          credentials: "omit",
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error("API returned non-OK status:", response.status);
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
            "API returned HTML instead of JSON:",
            responseText.substring(0, 500) + "..."
          );
          throw new Error("API returned HTML instead of JSON");
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError);
          console.error(
            "Response text:",
            responseText.substring(0, 500) + "..."
          );
          throw parseError;
        }

        if (!Array.isArray(data)) {
          console.warn("API response is not an array:", data);
          data = [data];
        }

        // Map the API response to our card format
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

        if (tarotCards.length === 0) {
          console.warn("No cards received from API, using fallback data");
          return this.createFallbackCards();
        }

        return tarotCards.sort(
          (a, b) => parseInt(a.cardNumber) - parseInt(b.cardNumber)
        );
      } catch (error) {
        console.error("Error fetching tarot cards:", error);
        console.log("Using fallback cards due to API error");
        return this.createFallbackCards();
      }
    },

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

      // Add Major Arcana
      majorArcana.forEach((title, index) => {
        fallbackCards.push({
          id: `major-${index}`,
          title: title,
          cardNumber: index.toString(),
          featuredMediaId: null,
          imageUrl: null,
        });
      });

      // Add Minor Arcana
      suits.forEach((suit) => {
        values.forEach((value, index) => {
          fallbackCards.push({
            id: `${suit.toLowerCase()}-${index + 1}`,
            title: `${value} of ${suit}`,
            cardNumber: (index + 1).toString(),
            featuredMediaId: null,
            imageUrl: null,
          });
        });
      });

      return fallbackCards;
    },

    async fetchCardImage(mediaId) {
      if (!mediaId) return null;

      try {
        const response = await fetch(
          `https://b145kh3.myrdbx.io/wp-json/wp/v2/media/${mediaId}`
        );

        if (!response.ok) {
          console.error(
            `Failed to fetch image with ID ${mediaId}, status: ${response.status}`
          );
          return null;
        }

        const responseText = await response.text();

        try {
          const media = JSON.parse(responseText);
          return media.source_url || null;
        } catch (parseError) {
          console.error("Failed to parse image response as JSON:", parseError);
          return null;
        }
      } catch (error) {
        console.error("Error fetching card image:", error);
        return null;
      }
    },

    updatePlaceholderCards() {
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
    },

    adjustGameAreaHeight() {
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
      if (this.isAnimating || this.deckCards.length < 1) return;

      this.isAnimating = true;
      const shuffleDealButton = this.$refs.shuffleDealButton;
      shuffleDealButton.disabled = true;
      shuffleDealButton.classList.add("shuffling");
      const deckElement = this.$refs.deckElement;

      // Set animation timeout safety
      const animationTimeout = setTimeout(() => {
        if (this.isAnimating) {
          this.isAnimating = false;
          shuffleDealButton.disabled = false;
          shuffleDealButton.classList.remove("shuffling");
          gsap.set(deckElement, { x: 0, y: 0, rotation: 0 });
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

      // Reset deck to starting position
      gsap.set(deckElement, {
        left: "20px",
        top: "20px",
        x: 0,
        y: 0,
        rotation: 0,
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

      // Get game area dimensions
      const gameAreaRect = this.$refs.gameArea.getBoundingClientRect();
      const deckTopPosition = gameAreaRect.height * 0.2; // 20% from top

      // Create animation timeline
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          this.dealCards();
          clearTimeout(animationTimeout);
        },
      });

      // Move deck to center
      tl.to(deckElement, {
        duration: 0.7,
        left: "50%", // Center horizontally
        top: deckTopPosition + "px", // Position at 20% from top
        x: "-50%", // Offset to truly center
        y: 0,
        rotation: 2, // Subtle rotation
        ease: "power1.inOut",
      })
        // Spread cards
        .add(() => {
          tl.to(this.deckCards, {
            x: (i) => (i % 2 === 0 ? -3 : 3),
            y: (i) => (i % 3 === 0 ? -2 : 2),
            stagger: { amount: 0.2, from: "center" },
            duration: 0.2,
          });
        })
        // Shuffle animation
        .add(() => {
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
      // Get placeholders
      const playerHandElement = this.$refs.playerHandElement;
      const placeholderContainer = playerHandElement.querySelector("div");
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

              if (card.dataset.imageUrl) {
                card.style.backgroundImage = `url('${card.dataset.imageUrl}')`;
                card.style.backgroundSize = "cover";
                card.style.backgroundPosition = "center";

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
                  titleContainer.style.maxWidth = "120%";

                  card.appendChild(titleContainer);
                }
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
    },

    moveRemainingDeckBack() {
      const deckElement = this.$refs.deckElement;
      gsap.to(deckElement, {
        duration: 0.7,
        left: "20px",
        top: "20px",
        x: 0,
        y: 0,
        rotation: 0,
        ease: "back.out(1.2)",
        onComplete: () => {
          this.isAnimating = false;
          this.$refs.shuffleDealButton.disabled = false;
          this.$refs.shuffleDealButton.classList.remove("shuffling");

          // Final settling animation
          gsap.fromTo(
            deckElement,
            { y: -3 },
            { y: 0, duration: 0.3, ease: "elastic.out(2, 0.3)" }
          );
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.tarot-reader {
  /* Root variables - will be overridden by computed cssVars */
  --main-color: v-bind("content.mainColor");
  --secondary-color: v-bind("content.secondaryColor");
  --main-dark: v-bind("adjustColor(content.mainColor, -20)");
  --secondary-dark: v-bind("adjustColor(content.secondaryColor, -20)");
  --light-accent: v-bind("content.lightColor");
  --dark-accent: v-bind("content.darkColor");
  --card-width: min(120px, 20vw);
  --card-height: min(168px, 28vw);
  --card-margin: min(10px, 2vw);
  --font-size: min(18px, 3.5vw);

  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  background-color: var(--dark-accent);
  overflow: hidden;
  perspective: 1000px;
  width: 100%;
  height: 100%;
}

.game-area {
  position: relative;
  width: min(80vw, 800px);
  height: min(70vh, 600px);
  border: 2px solid var(--main-color);
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
  width: var(--card-width);
  height: var(--card-height);
  transform: none;
}

/* Deck cards styling */
.deck-area .card {
  position: absolute;
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
  margin-top: calc(0.2px * var(--index, 0));
  margin-left: calc(0.1px * var(--index, 0));
}

/* Enhanced card stacking effect */
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

/* Top card shadow */
.deck-area .card:last-child {
  box-shadow: 0 1px 8px rgba(158, 21, 191, 0.6), 0 0 2px rgba(0, 0, 0, 0.3);
  transform: translateZ(6px);
}

/* Player hand area */
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

/* Card placeholders */
.rec-card {
  width: var(--card-width);
  height: var(--card-height);
  border: 1.5px solid var(--secondary-color);
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
  width: var(--card-width);
  height: var(--card-height);
  background-color: var(--light-accent);
  border: 1px solid var(--main-dark);
  border-radius: 8px;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size);
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

button {
  padding: min(10px, 2vw) min(20px, 4vw);
  font-size: min(16px, 4vw);
  cursor: pointer;
  background-color: var(--main-color);
  color: white;
  border: none;
  border-radius: 5px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: var(--main-dark);
  }

  &:active {
    background-color: var(--dark-accent);
    transform: translateY(1px);
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  }

  &.shuffling {
    background-color: var(--secondary-color);
    cursor: not-allowed;
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    background-color: var(--secondary-color);
  }
  50% {
    opacity: 0.7;
    background-color: var(--secondary-dark);
  }
  100% {
    opacity: 1;
    background-color: var(--secondary-color);
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
  color: var(--light-accent);
  font-weight: bold;
}

select {
  padding: 5px;
  border-radius: 5px;
  background-color: var(--main-color);
  color: white;
  border: none;
  cursor: pointer;

  &:focus {
    outline: none;
    box-shadow: 0 0 5px var(--secondary-color);
  }
}

/* Card back design */
.card-back {
  background-image: v-bind("'url(' + content.cardbackImageUrl + ')'");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 1.5px solid var(--main-color);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.card-back span {
  opacity: 0;
}

.deck-area .card span {
  display: none;
}

.tarot-title {
  color: var(--light-accent);
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px var(--main-color), 0 0 20px var(--main-color);
  font-family: "Georgia", serif;
}

.tarot-intro {
  color: var(--secondary-color);
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
  color: var(--light-accent);
  margin-top: 8px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
  max-width: 120%;
  padding: 0 2px;
}

/* Media Queries */
@media (max-width: 768px) {
  :root {
    --card-width: min(90px, 19vw);
    --card-height: min(126px, 26.6vw);
    --card-margin: min(8px, 1.5vw);
    --font-size: min(14px, 3vw);
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
  :root {
    --card-width: min(70px, 18vw);
    --card-height: min(98px, 25.2vw);
    --font-size: min(12px, 2.5vw);
  }

  .tarot-title {
    font-size: 1.5rem;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .game-area {
    height: 78vh;
  }

  :root {
    --card-width: min(70px, 12vw);
    --card-height: min(98px, 16.8vw);
  }
}
</style>
