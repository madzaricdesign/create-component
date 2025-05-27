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
          }">
          <div
            v-if="
              !isAnimating &&
              visibleDeckCards.length > 0 &&
              index === visibleDeckCards.length - 1
            "
            class="deck-overlay"
            @click="handleShuffle">
            <span :style="overlayTextStyles">{{ content.overlayText }}</span>
          </div>
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
            <!-- Position label always on top, outside the card -->
            <div v-if="positionLabels[i]" class="position-label">
              {{ positionLabels[i] }}
            </div>
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
              }"></div>
            <div v-if="dealtCards[i - 1]" class="card-title">
              {{ dealtCards[i - 1].title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls (button) below the game-area) -->
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
      dealtCards: [],
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
          : undefined,
        width: "100%",
        height: "auto",
      };
    },
    gameAreaStyles() {
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
        width: "100%",
        height: this.content.gameAreaHeight
          ? `${this.content.gameAreaHeight}px`
          : "400px",
        minHeight: 0,
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
      // If position labels are not enabled, return empty object
      if (!this.content.enablePositionLabels) {
        return {};
      }

      // Only return labels for the actual number of cards
      const labels = {};
      const numCards = this.actualNumberOfCards;
      for (let i = 1; i <= numCards; i++) {
        const label = this.content[`position${i}Label`];
        if (label && label.trim() !== "") {
          labels[i] = label;
        }
      }

      // If no custom labels are set, use defaults based on pattern
      if (Object.keys(labels).length === 0) {
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
        } else if (this.content.cardPattern === "simple") {
          return {
            1: "Past",
            2: "Present",
            3: "Future",
          };
        }
      }

      // Only return labels for the number of cards in the spread
      return labels;
    },
  },
  watch: {
    "content.cardsData": {
      handler(newVal) {
        if (newVal && Array.isArray(newVal)) {
          this.initializeCards();
        }
      },
      immediate: true,
    },
  },
  created() {},

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

      const gameAreaRect = this.$refs.gameArea?.getBoundingClientRect?.();
      const centerX = gameAreaRect ? gameAreaRect.width / 2 - 60 : 0;
      const centerY = 100;

      // Move deck to center
      if (this.$refs.deckElement) {
        await gsap.to(this.$refs.deckElement, {
          x: centerX - 20,
          y: centerY - 20,
          duration: 0.4,
          ease: "power2.inOut",
        });
      }

      // Get deck card elements
      const deckCardElements = [];
      for (let i = 0; i < this.visibleDeckCards.length; i++) {
        if (this.$refs[`deckCard${i}`] && this.$refs[`deckCard${i}`][0]) {
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

      // Wait for DOM update
      await this.$nextTick();

      // Animate dealt cards from deck position to their placeholders
      const deckRect = this.$refs.deckElement?.getBoundingClientRect?.();

      for (let i = 0; i < newDealtCards.length; i++) {
        if (
          this.$refs[`dealtCard${i}`] &&
          this.$refs[`dealtCard${i}`][0] &&
          deckRect
        ) {
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
        if (this.$refs.deckElement) {
          await gsap.to(this.$refs.deckElement, {
            x: 0,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.2)",
          });
        }
      }, 300);

      // Emit event and final update after animation
      setTimeout(() => {
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
  beforeUnmount() {
    // Kill all GSAP tweens/timelines to prevent accessing null refs after unmount
    if (window.gsap && window.gsap.globalTimeline) {
      window.gsap.globalTimeline.clear();
    }
    // If you have custom timeouts/intervals, clear them here
    // Example: clearTimeout(this.myTimeout);
  },
};
</script>

<style lang="scss" scoped>
.tarot-reader {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: auto;
  min-height: 450px;
  padding: 20px;
  box-sizing: border-box;
  font-family: inherit;
}

.game-area {
  position: relative;
  width: 100%;
  min-height: 0;
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
    background: rgba(0, 0, 0, 0.55);
    border-radius: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: background-color 0.2s;
    overflow: hidden;

    &:hover {
      background-color: rgba(0, 0, 0, 0.8);
    }

    span {
      color: var(--overlay-text-color);
      font-size: var(--overlay-text-size);
      font-weight: bold;
      text-align: center;
      padding: 12px 18px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.25);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
      line-height: 1.2;
      pointer-events: none;
    }
  }
}

.player-hand-area {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
}

.placeholders-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  width: 100%;
  position: relative;
}

.card-placeholder {
  position: relative;
  width: 120px;
  height: 168px;
  border: 2px solid var(--placeholder-border-color);
  border-radius: 8px;
  background: var(--placeholder-background);
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1) inset;
  overflow: visible;
}

.card {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
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
    border: none;
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
  top: 0;
  left: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  background: #1e0a2d;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 6px 0 4px 0;
  letter-spacing: 1px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  z-index: 1000;
  opacity: 0.95;
  pointer-events: none;
  backface-visibility: hidden;
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
    width: 70px;
    height: 98px;
  }
  .deck-area {
    width: 70px;
    height: 98px;
  }
  .placeholders-container.pattern-relationship {
    grid-template-columns: repeat(3, 70px);
    grid-template-rows: repeat(3, 98px);
    gap: 8px;
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
}

// Relationship pattern (7 cards in specific layout)
.pattern-relationship {
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
      grid-column: 2;
      grid-row: 2;
    } // Center
    &.position-2 {
      grid-column: 3;
      grid-row: 1;
    } // Top right
    &.position-3 {
      grid-column: 3;
      grid-row: 2;
    } // Middle right
    &.position-4 {
      grid-column: 3;
      grid-row: 3;
    } // Bottom right
    &.position-5 {
      grid-column: 1;
      grid-row: 3;
    } // Bottom left
    &.position-6 {
      grid-column: 1;
      grid-row: 2;
    } // Middle left
    &.position-7 {
      grid-column: 1;
      grid-row: 1;
    } // Top left
  }
}
</style>
