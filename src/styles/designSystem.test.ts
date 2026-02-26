import { describe, it, expect } from 'vitest';
import {
  typography,
  backgrounds,
  containers,
  buttons,
  spacing,
  animations,
  getPageTitleClasses,
  getPageBackgroundClasses,
  getCardClasses,
  getPageContainerClasses,
  getPrimaryButtonClasses,
  type TypographyKey,
  type BackgroundKey,
  type ContainerKey,
  type ButtonKey,
  type SpacingKey,
  type AnimationKey,
} from './designSystem';

describe('Design System Module', () => {
  describe('Token Objects', () => {
    it('should export typography tokens with all required keys', () => {
      expect(typography).toBeDefined();
      expect(typography.pageTitle).toBeDefined();
      expect(typography.pageTitle.base).toBeTruthy();
      expect(typography.pageTitle.gradient).toBeTruthy();
      expect(typography.pageTitle.combined).toBeTruthy();
      expect(typography.subtitle).toBeTruthy();
      expect(typography.sectionHeading).toBeTruthy();
    });

    it('should export background tokens with all required keys', () => {
      expect(backgrounds).toBeDefined();
      expect(backgrounds.page).toBeTruthy();
      expect(backgrounds.pageAlt).toBeTruthy();
      expect(backgrounds.minHeight).toBeTruthy();
    });

    it('should export container tokens with all required keys', () => {
      expect(containers).toBeDefined();
      expect(containers.card).toBeTruthy();
      expect(containers.cardGlass).toBeTruthy();
      expect(containers.maxWidth).toBeDefined();
      expect(containers.maxWidth.sm).toBeTruthy();
      expect(containers.maxWidth.md).toBeTruthy();
      expect(containers.maxWidth.lg).toBeTruthy();
      expect(containers.padding).toBeTruthy();
      expect(containers.paddingLarge).toBeTruthy();
    });

    it('should export button tokens with all required keys', () => {
      expect(buttons).toBeDefined();
      expect(buttons.primary).toBeTruthy();
      expect(buttons.primaryStrong).toBeTruthy();
    });

    it('should export spacing tokens with all required keys', () => {
      expect(spacing).toBeDefined();
      expect(spacing.pageContainer).toBeTruthy();
      expect(spacing.pageContainerLarge).toBeTruthy();
      expect(spacing.sectionGap).toBeTruthy();
      expect(spacing.sectionGapLarge).toBeTruthy();
      expect(spacing.gridGap).toBeTruthy();
      expect(spacing.gridGapLarge).toBeTruthy();
    });

    it('should export animation tokens with all required keys', () => {
      expect(animations).toBeDefined();
      expect(animations.hoverTransform).toBeTruthy();
      expect(animations.hoverShadow).toBeTruthy();
      expect(animations.transition).toBeTruthy();
      expect(animations.transitionColors).toBeTruthy();
    });

    it('should have non-empty string values for all tokens', () => {
      // Typography
      expect(typeof typography.pageTitle.base).toBe('string');
      expect(typography.pageTitle.base.length).toBeGreaterThan(0);
      expect(typeof typography.subtitle).toBe('string');
      expect(typography.subtitle.length).toBeGreaterThan(0);
      
      // Backgrounds
      expect(typeof backgrounds.page).toBe('string');
      expect(backgrounds.page.length).toBeGreaterThan(0);
      
      // Containers
      expect(typeof containers.card).toBe('string');
      expect(containers.card.length).toBeGreaterThan(0);
      
      // Buttons
      expect(typeof buttons.primary).toBe('string');
      expect(buttons.primary.length).toBeGreaterThan(0);
      
      // Spacing
      expect(typeof spacing.pageContainer).toBe('string');
      expect(spacing.pageContainer.length).toBeGreaterThan(0);
      
      // Animations
      expect(typeof animations.transition).toBe('string');
      expect(animations.transition.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    describe('getPageTitleClasses', () => {
      it('should return a non-empty string', () => {
        const result = getPageTitleClasses();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return the combined page title classes', () => {
        const result = getPageTitleClasses();
        expect(result).toBe(typography.pageTitle.combined);
      });
    });

    describe('getPageBackgroundClasses', () => {
      it('should return a non-empty string', () => {
        const result = getPageBackgroundClasses();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should include min-height by default', () => {
        const result = getPageBackgroundClasses();
        expect(result).toContain(backgrounds.page);
        expect(result).toContain(backgrounds.minHeight);
      });

      it('should exclude min-height when includeMinHeight is false', () => {
        const result = getPageBackgroundClasses(false);
        expect(result).toContain(backgrounds.page);
        expect(result).not.toContain(backgrounds.minHeight);
      });

      it('should include min-height when includeMinHeight is true', () => {
        const result = getPageBackgroundClasses(true);
        expect(result).toContain(backgrounds.page);
        expect(result).toContain(backgrounds.minHeight);
      });
    });

    describe('getCardClasses', () => {
      it('should return a non-empty string', () => {
        const result = getCardClasses();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return standard card with normal padding by default', () => {
        const result = getCardClasses();
        expect(result).toContain(containers.card);
        expect(result).toContain(containers.padding);
      });

      it('should return glass variant when specified', () => {
        const result = getCardClasses('glass');
        expect(result).toContain(containers.cardGlass);
      });

      it('should return large padding when specified', () => {
        const result = getCardClasses('standard', 'large');
        expect(result).toContain(containers.paddingLarge);
      });

      it('should combine glass variant with large padding', () => {
        const result = getCardClasses('glass', 'large');
        expect(result).toContain(containers.cardGlass);
        expect(result).toContain(containers.paddingLarge);
      });
    });

    describe('getPageContainerClasses', () => {
      it('should return a non-empty string', () => {
        const result = getPageContainerClasses();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return large max-width with normal padding by default', () => {
        const result = getPageContainerClasses();
        expect(result).toContain(spacing.pageContainer);
        expect(result).toContain(containers.maxWidth.lg);
      });

      it('should return small max-width when specified', () => {
        const result = getPageContainerClasses('sm');
        expect(result).toContain(containers.maxWidth.sm);
      });

      it('should return medium max-width when specified', () => {
        const result = getPageContainerClasses('md');
        expect(result).toContain(containers.maxWidth.md);
      });

      it('should return large padding when specified', () => {
        const result = getPageContainerClasses('lg', 'large');
        expect(result).toContain(spacing.pageContainerLarge);
      });

      it('should combine small max-width with large padding', () => {
        const result = getPageContainerClasses('sm', 'large');
        expect(result).toContain(containers.maxWidth.sm);
        expect(result).toContain(spacing.pageContainerLarge);
      });
    });

    describe('getPrimaryButtonClasses', () => {
      it('should return a non-empty string', () => {
        const result = getPrimaryButtonClasses();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return standard primary button by default', () => {
        const result = getPrimaryButtonClasses();
        expect(result).toBe(buttons.primary);
      });

      it('should return primary button without !important by default', () => {
        const result = getPrimaryButtonClasses(false);
        expect(result).toBe(buttons.primary);
      });

      it('should return primary button with !important when useImportant is true', () => {
        const result = getPrimaryButtonClasses(true);
        expect(result).toBe(buttons.primaryStrong);
        expect(result).toContain('!');
      });
    });
  });

  describe('TypeScript Types', () => {
    it('should export TypographyKey type', () => {
      const key: TypographyKey = 'pageTitle';
      expect(key).toBeDefined();
    });

    it('should export BackgroundKey type', () => {
      const key: BackgroundKey = 'page';
      expect(key).toBeDefined();
    });

    it('should export ContainerKey type', () => {
      const key: ContainerKey = 'card';
      expect(key).toBeDefined();
    });

    it('should export ButtonKey type', () => {
      const key: ButtonKey = 'primary';
      expect(key).toBeDefined();
    });

    it('should export SpacingKey type', () => {
      const key: SpacingKey = 'pageContainer';
      expect(key).toBeDefined();
    });

    it('should export AnimationKey type', () => {
      const key: AnimationKey = 'transition';
      expect(key).toBeDefined();
    });
  });
});
