// components/AnimatedSwitcher.tsx

import React from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// 1. Define the props for our component using TypeScript
type AnimatedSwitcherProps = {
  /** The boolean condition to determine which child to render. */
  condition: boolean;
  /**
   * Two children must be provided.
   * The first child is rendered if `condition` is true.
   * The second child is rendered if `condition` is false.
   */
  children: React.ReactNode;
};

const AnimatedSwitcher = ({ condition, children }: AnimatedSwitcherProps) => {
  // 2. Use React.Children.toArray for robust handling of children
  const childArray = React.Children.toArray(children);

  // 3. Add a developer-friendly warning for incorrect usage
  if (__DEV__) {
    if (childArray.length !== 2) {
      console.warn(
        `[AnimatedSwitcher] Expected 2 children, but received ${childArray.length}. The first child is for the 'true' state, and the second for the 'false' state.`
      );
    }
  }

  // 4. The key is now an internal implementation detail.
  //    It's tied to the condition, ensuring a remount on change.
  //    We select which child to display based on the condition.
  return (
    <Animated.View
      key={String(condition)}
      style={{ flex: 1 }}
      entering={FadeIn.duration(500)}
      exiting={FadeOut.duration(500)}
    >
      {condition ? childArray[0] : childArray[1]}
    </Animated.View>
  );
};

export default AnimatedSwitcher;