<template>
  <div class="tarot-reader" :style="componentStyles">
    <!-- Loading state -->
    <div v-if="isLoading" class="skeleton-loader">
      <div class="skeleton-deck"></div>
      <div class="skeleton-placeholders">
        <div
          v-for="i in actualNumberOfCards"
          :key="`skeleton-${i}`"
          class="skeleton-card"
          :style="{ '--i': i }" />
      </div>
      <div class="skeleton-button"></div>
    </div>

    <!-- Main game area -->
    <div
      v-show="!isLoading"
      class="game-area"
      ref="gameArea"
      :style="gameAreaStyles">
      <!-- Deck -->
      <div ref="deckElement" class="deck-area">
        <!-- Deck cards rendered by Vue -->
        <div
          v-for="(card, index) in visibleDeckCards"
          :key="`deck-${card.id}`"
          :ref="`deckCard${index}`"
          class="card card-back"
          :style="{
            zIndex: index,
            transform: `translate(${index * 0.1}px, ${index * 0.1}px) rotate(${
              index * 0.1
            }deg)`,
          }" />

        <div
          v-if="!isAnimating && visibleDeckCards.length > 0"
          class="deck-overlay"
          @click="handleShuffle">
          <span :style="overlayTextStyles">{{ content.overlayText }}</span>
        </div>
      </div>

      <!-- Player hand area -->
      <div ref="playerHandElement" class="player-hand-area">
        <div
          class="placeholders-container"
          :class="`pattern-${content.cardPattern || 'simple'}`">
          <div
            v-for="i in actualNumberOfCards"
            :key="`placeholder-${i}`"
            class="card-placeholder"
            :class="`position-${i}`">
            <!-- Dealt card if exists -->
            <div
              v-if="dealtCards[i - 1]"
              :ref="`dealtCard${i - 1}`"
              class="card card-face dealt-card"
              :class="{ 'card-flipped': dealtCards[i - 1].isFlipped }"
              :style="{
                backgroundImage: dealtCards[i - 1].imageUrl
                  ? `url('${dealtCards[i - 1].imageUrl}')`
                  : '',
              }" />
            <div v-if="dealtCards[i - 1]" class="card-title">
              {{ dealtCards[i - 1].title }}
            </div>
            <div v-if="positionLabels[i]" class="position-label">
              {{ positionLabels[i] }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div v-show="!isLoading" class="controls">
      <button
        class="shuffle-button"
        :class="{ shuffling: isAnimating }"
        :disabled="isAnimating"
        @click="handleShuffle">
        {{ content.buttonText }}
      </button>
    </div>

    <!-- Debug info -->
    <div v-if="content.showDebugInfo" class="debug-info">
      <h4>Debug Info</h4>
      <div>Cards Data Length: {{ content.cardsData?.length || 0 }}</div>
      <div>Visible Deck Cards: {{ visibleDeckCards.length }}</div>
      <div>Dealt Cards: {{ dealtCards.length }}</div>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script>
import { gsap } from "gsap";

export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ["update:content", "trigger-event"],
  data() {
    return {
      isLoading: true,
      isAnimating: false,
      allCards: [],
      visibleDeckCards: [],
      dealtCards: this.content.resultCards || [],
      hasInitialized: false,
    };
  },
  computed: {
    actualNumberOfCards() {
      // Return number of cards based on pattern
      switch (this.content.cardPattern) {
        case "simple":
          return 3;
        case "relationship":
          return 7;
        case "custom":
          return this.content.numberOfCards || 3;
        default:
          return this.content.numberOfCards || 3;
      }
    },
    isEditing() {
      /* wwEditor:start */
      return this.wwEditorState?.editMode === true;
      /* wwEditor:end */
      // eslint-disable-next-line no-unreachable
      return false;
    },
    componentStyles() {
      return {
        "--deck-border-color": this.content.deckBorderColor || "#9e15bf",
        "--placeholder-border-color":
          this.content.placeholderBorderColor || "#4ac6d2",
        "--placeholder-background":
          this.content.placeholderBackgroundColor || "transparent",
        "--button-background": this.content.buttonBackgroundColor || "#9e15bf",
        "--button-text-color": this.content.buttonTextColor || "#ffffff",
        "--card-text-color": this.content.cardTextColor || "#f8f0fc",
        "--title-color": this.content.titleColor || "#f8f0fc",
        "--title-font-size": `${this.content.titleFontSize || 14}px`,
        "--overlay-text-color": this.content.overlayTextColor || "#ffffff",
        "--overlay-text-size": `${this.content.overlayTextSize || 14}px`,
        "--card-back-image": `url('${
          this.content.cardbackImageUrl ||
          "https://b145kh3.myrdbx.io/wp-content/uploads/2025/02/tarot-karte-ziehen-online-179x300-1.jpg"
        }')`,
        backgroundColor: this.content.backgroundColor || "#38074a",
        minHeight: this.content.minHeight
          ? `${this.content.minHeight}px`
          : "450px",
      };
    },
    gameAreaStyles() {
      const minHeight =
        this.content.cardPattern === "relationship" ? "600px" : "400px";
      return {
        border: `2px solid ${this.content.deckBorderColor || "#9e15bf"}`,
        background: `linear-gradient(135deg, ${this.adjustColor(
          this.content.backgroundColor || "#38074a",
          5
        )}, ${this.adjustColor(
          this.content.backgroundColor || "#38074a",
          -15
        )})`,
        borderRadius: "10px",
        minHeight: minHeight,
        height: this.content.cardPattern === "relationship" ? "auto" : "400px",
      };
    },
    overlayTextStyles() {
      return {
        color: this.content.overlayTextColor || "#ffffff",
        fontSize: `${this.content.overlayTextSize || 14}px`,
      };
    },
    debugInfo() {
      return {
        dealtCards: this.dealtCards,
        cardCount: this.dealtCards.length,
        isAnimating: this.isAnimating,
        hasData: !!this.content.cardsData,
        dataLength: this.content.cardsData?.length || 0,
      };
    },
    positionLabels() {
      if (this.content.cardPattern === "relationship") {
        return {
          1: "You",
          2: "Partner",
          3: "Relationship",
          4: "Your Feelings",
          5: "Partner's Feelings",
          6: "Challenge",
          7: "Outcome",
        };
      }
      return {};
    },
  },
  watch: {
    dealtCards: {
      handler(newVal, oldVal) {
        // Skip if no actual change
        if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return;

        // Emit update only if value changed
        if (
          JSON.stringify(newVal) !== JSON.stringify(this.content.resultCards)
        ) {
          this.$emit("update:content", {
            ...this.content,
            resultCards: newVal || [],
          });
        }
      },
      deep: true,
    },
    "content.cardsData": {
      handler(newVal) {
        if (newVal && Array.isArray(newVal)) {
          this.initializeCards();
        }
      },
      immediate: true,
    },
    "content.resultCards": {
      handler(newVal) {
        if (
          newVal &&
          Array.isArray(newVal) &&
          JSON.stringify(newVal) !== JSON.stringify(this.dealtCards)
        ) {
          this.dealtCards = [...newVal];
        }
      },
      deep: true,
      immediate: true,
    },
  },
  created() {
    // Initialize resultCards if not set
    if (!this.content.resultCards) {
      this.$emit("update:content", {
        ...this.content,
        resultCards: [],
      });
    }
  },

  mounted() {
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  },
  methods: {
    // Public method for WeWeb to get dealt cards
    getDealtCards() {
      return this.dealtCards || [];
    },

    // Helper functions
    adjustColor(hex, percent) {
      const num = parseInt(hex.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = ((num >> 8) & 0x00ff) + amt;
      const B = (num & 0x0000ff) + amt;
      return (
        "#" +
        (
          0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
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

    // Initialize cards from data
    initializeCards() {
      const cardsData = this.processCardsData();
      this.allCards = cardsData;
      this.visibleDeckCards = [...cardsData];
      this.hasInitialized = true;
    },

    // Process cards data from binding
    processCardsData() {
      if (!this.content.cardsData || !Array.isArray(this.content.cardsData)) {
        return this.createFallbackCards();
      }

      return this.content.cardsData.map((card, index) => ({
        id: card.id?.toString() || index.toString(),
        title: card.card_title || card.title || `Card ${index + 1}`,
        cardNumber:
          card.card_number?.toString() ||
          card.cardNumber?.toString() ||
          index.toString(),
        imageUrl: card.image?.url || card.imageUrl || null,
        card_description: card.card_description || "",
        long_description: card.long_description || "",
        description_reversed: card.description_reversed || "",
        card_meaning: Array.isArray(card.card_meaning) ? card.card_meaning : [],
        card_meaning_reversed: Array.isArray(card.card_meaning_reversed)
          ? card.card_meaning_reversed
          : [],
      }));
    },

    createFallbackCards() {
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

      return majorArcana.map((title, index) => ({
        id: `major-${index}`,
        title,
        cardNumber: index.toString(),
        imageUrl: `https://placehold.co/120x168/9e15bf/ffffff?text=${encodeURIComponent(
          title
        )}`,
        card_description: `${title} card description`,
        card_meaning: [],
        card_meaning_reversed: [],
      }));
    },

    // Shuffle and deal animation
    async handleShuffle() {
      if (this.isAnimating || this.visibleDeckCards.length === 0) {
        return;
      }

      this.isAnimating = true;

      // Clear previous cards
      if (this.dealtCards.length > 0) {
        this.dealtCards = [];
        // Emit update to clear resultCards
        this.$emit("update:content", {
          ...this.content,
          resultCards: [],
        });
        this.$emit("trigger-event", { name: "cards-cleared", event: {} });
      }

      await this.$nextTick();

      try {
        // Animate shuffle
        await this.animateShuffle();

        // Deal cards
        await this.dealCards();

        // Restore deck after dealing
        this.visibleDeckCards = [...this.allCards];

        this.isAnimating = false;
      } catch (error) {
        console.error("Error during shuffle:", error);
        this.isAnimating = false;
      }
    },

    async animateShuffle() {
      if (!this.$refs.gameArea || !this.$refs.deckElement) return;

      const gameAreaRect = this.$refs.gameArea.getBoundingClientRect();
      const centerX = gameAreaRect.width / 2 - 60;
      const centerY = 100;

      // Move deck to center
      await gsap.to(this.$refs.deckElement, {
        x: centerX - 20,
        y: centerY - 20,
        duration: 0.4,
        ease: "power2.inOut",
      });

      // Get deck card elements
      const deckCardElements = [];
      for (let i = 0; i < this.visibleDeckCards.length; i++) {
        if (this.$refs[`deckCard${i}`]) {
          deckCardElements.push(this.$refs[`deckCard${i}`][0]);
        }
      }

      // Shuffle animation
      const tl = gsap.timeline();
      const shuffleCards = deckCardElements.slice(
        0,
        Math.min(30, deckCardElements.length)
      );

      tl.to(shuffleCards, {
        x: (i) => (i % 2 === 0 ? -25 : 25),
        y: (i) => (i % 3 === 0 ? -15 : 15),
        stagger: { amount: 0.1, from: "center" },
        duration: 0.15,
      }).to(shuffleCards, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.2,
        ease: "power2.inOut",
      });

      await tl;

      // Shuffle deck order
      this.visibleDeckCards = this.shuffleArray(this.visibleDeckCards);
    },

    async dealCards() {
      const numCards = Math.min(
        this.actualNumberOfCards,
        this.visibleDeckCards.length
      );

      if (numCards === 0) {
        console.warn("No cards to deal");
        return;
      }

      const cardsToDeal = this.visibleDeckCards.slice(-numCards);
      const newDealtCards = [];

      for (let i = 0; i < numCards; i++) {
        const card = cardsToDeal[i];

        const shouldFlip =
          this.content.enableCardFlipping &&
          Math.random() * 100 < this.content.cardFlipProbability &&
          i < this.content.maxFlippedCards;

        newDealtCards.push({
          ...card,
          isFlipped: shouldFlip,
          index: i,
        });
      }

      // Remove dealt cards from deck
      this.visibleDeckCards = this.visibleDeckCards.slice(0, -numCards);

      // Update dealt cards
      this.dealtCards = newDealtCards;

      // Explicitly emit the update to ensure binding works
      this.$emit("update:content", {
        ...this.content,
        resultCards: newDealtCards,
      });

      // Wait for DOM update
      await this.$nextTick();

      // Animate dealt cards from deck position to their placeholders
      const deckRect = this.$refs.deckElement.getBoundingClientRect();

      for (let i = 0; i < newDealtCards.length; i++) {
        if (this.$refs[`dealtCard${i}`] && this.$refs[`dealtCard${i}`][0]) {
          const cardEl = this.$refs[`dealtCard${i}`][0];
          const cardRect = cardEl.getBoundingClientRect();

          // Calculate initial position relative to deck
          const offsetX =
            deckRect.left -
            cardRect.left +
            deckRect.width / 2 -
            cardRect.width / 2;
          const offsetY =
            deckRect.top -
            cardRect.top +
            deckRect.height / 2 -
            cardRect.height / 2;

          // Set card at deck position initially
          gsap.set(cardEl, {
            x: offsetX,
            y: offsetY,
            scale: 0.8,
            opacity: 0,
            rotationY: 0,
            zIndex: 100 + i,
          });

          // Animate to final position
          gsap.to(cardEl, {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            rotationY: 180,
            duration: 0.7,
            delay: i * 0.15,
            ease: "power2.out",
          });
        }
      }

      // Move deck back to original position
      setTimeout(async () => {
        await gsap.to(this.$refs.deckElement, {
          x: 0,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.2)",
        });
      }, 300);

      // Emit event and final update after animation
      setTimeout(() => {
        // Force update the component's content
        const updatedContent = {
          ...this.content,
          resultCards: [...this.dealtCards],
        };

        // Emit the update
        this.$emit("update:content", updatedContent);

        this.$emit("trigger-event", {
          name: "cards-dealt",
          event: {
            cards: this.dealtCards,
            count: this.dealtCards.length,
          },
        });
      }, 1200);
    },
  },
};
</script>

<style lang="scss" scoped>
.tarot-reader {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 450px;
  padding: 20px;
  box-sizing: border-box;
  font-family: inherit;
}

.game-area {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
}

.deck-area {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 120px;
  height: 168px;
  z-index: 50;

  .card {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    top: 0;
    left: 0;
  }

  .deck-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.8);
    }

    span {
      color: var(--overlay-text-color);
      font-size: var(--overlay-text-size);
      font-weight: bold;
      text-align: center;
      padding: 10px;
    }
  }
}

.player-hand-area {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  min-height: 200px;
}

.placeholders-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  width: 100%;
  position: relative;
  min-height: 200px;

  // Simple pattern (3 cards in a row)
  &.pattern-simple {
    flex-direction: row;
  }

  // Relationship pattern (7 cards in specific layout)
  &.pattern-relationship {
    display: grid;
    grid-template-columns: repeat(3, 120px);
    grid-template-rows: repeat(3, 168px);
    gap: 20px;
    width: auto;
    height: auto;
    justify-content: center;
    align-items: center;

    .card-placeholder {
      &.position-1 {
        grid-column: 1;
        grid-row: 1;
      } // You - top left
      &.position-2 {
        grid-column: 3;
        grid-row: 1;
      } // Partner - top right
      &.position-3 {
        grid-column: 2;
        grid-row: 1;
      } // Relationship - top center
      &.position-4 {
        grid-column: 1;
        grid-row: 2;
      } // Your feelings - middle left
      &.position-5 {
        grid-column: 3;
        grid-row: 2;
      } // Partner feelings - middle right
      &.position-6 {
        grid-column: 2;
        grid-row: 2;
      } // Challenge - center
      &.position-7 {
        grid-column: 2;
        grid-row: 3;
      } // Outcome - bottom center
    }
  }

  // Custom pattern
  &.pattern-custom {
    flex-direction: row;
  }
}

.card-placeholder {
  position: relative;
  width: 120px;
  height: 168px;
  border: 2px solid var(--placeholder-border-color);
  border-radius: 8px;
  background: var(--placeholder-background);
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1) inset;
}

.card {
  width: 120px;
  height: 168px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;

  &.card-back {
    background-image: var(--card-back-image);
    background-size: cover;
    background-position: center;
    border: 2px solid var(--deck-border-color);
  }

  &.card-face {
    background-size: cover;
    background-position: center;
    background-color: #f8f0fc;
    border: 2px solid var(--deck-border-color);
  }

  &.dealt-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &.card-flipped {
    transform: rotate(180deg);

    &::after {
      content: "REVERSED";
      position: absolute;
      bottom: 5px;
      left: 50%;
      transform: translateX(-50%) rotate(180deg);
      background: rgba(255, 0, 0, 0.7);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
    }
  }
}

.card-title {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 100%;
  text-align: center;
  color: var(--title-color);
  font-size: var(--title-font-size);
  font-weight: bold;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

.position-label {
  position: absolute;
  top: -25px;
  left: 0;
  width: 100%;
  text-align: center;
  color: var(--title-color);
  font-size: 12px;
  font-weight: normal;
  text-transform: uppercase;
  opacity: 0.8;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

.controls {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.shuffle-button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  color: var(--button-text-color);
  background-color: var(--button-background);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.shuffling {
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.skeleton-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  width: 100%;
}

.skeleton-deck,
.skeleton-card,
.skeleton-button {
  background: linear-gradient(90deg, #3a0950 25%, #4c0a68 50%, #3a0950 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-deck {
  width: 120px;
  height: 168px;
  margin-bottom: 40px;
}

.skeleton-placeholders {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.skeleton-card {
  width: 120px;
  height: 168px;
  animation-delay: calc(var(--i) * 0.2s);
}

.skeleton-button {
  width: 180px;
  height: 48px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.debug-info {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  max-width: 300px;
  max-height: 400px;
  overflow: auto;
  z-index: 9999;

  h4 {
    margin: 0 0 10px 0;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
  }
}

// Responsive styles
@media (max-width: 768px) {
  .card,
  .card-placeholder,
  .skeleton-card {
    width: 90px;
    height: 126px;
  }

  .deck-area {
    width: 90px;
    height: 126px;
  }

  .placeholders-container {
    gap: 10px;
  }

  .shuffle-button {
    padding: 10px 20px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .card,
  .card-placeholder,
  .skeleton-card {
    width: 70px;
    height: 98px;
  }

  .deck-area {
    width: 70px;
    height: 98px;
    top: 10px;
    left: 10px;
  }

  .game-area {
    height: 300px;
  }
}
</style>
