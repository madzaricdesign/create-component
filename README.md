# Tarot Card Reader Component for WeWeb

A modern, animated tarot card reader component for WeWeb that provides an interactive card dealing experience.

## Features

- **Animated Card Dealing**: Smooth animations for shuffling and dealing cards
- **Customizable Appearance**: Full control over colors, borders, and text styling
- **Card Flipping**: Optional reversed card functionality with probability controls
- **Responsive Design**: Adapts to different screen sizes
- **WeWeb Integration**: Uses WeWeb's component variable system for state management

## Usage

### Basic Setup

1. Add the component to your WeWeb page
2. Bind your card data to the `Cards Data` property
3. Configure the number of cards to deal (1-9)
4. Customize the appearance using the style properties

### Data Structure

The component expects card data in the following format:

```javascript
[
  {
    id: "1",
    title: "The Fool",
    card_number: "0",
    image: { url: "https://example.com/fool.jpg" },
    card_description: "New beginnings...",
    card_meaning: ["innocence", "new beginnings", "free spirit"],
  },
  // ... more cards
];
```

### Events

The component emits two events:

- **cards-dealt**: Fired when cards are dealt, includes the dealt cards array and count
- **cards-cleared**: Fired when cards are cleared

### Styling

All visual aspects can be customized through the component properties:

- Background and border colors
- Button styling
- Card title appearance
- Overlay text and styling
- Placeholder appearance

## Component Variables

The component exposes a `dealtCards` variable that contains the currently dealt cards. This can be accessed in workflows and bindings.

## Development

This component follows WeWeb's component standards:

- Uses Vue 3 Composition API
- Implements WeWeb's component variable system
- Follows WeWeb's event emission patterns
- No global variables or window references
