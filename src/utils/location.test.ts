import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateDistanceForItem,
  formatDistanceDisplay,
  type Coordinates,
} from './location';

describe('location utilities', () => {
  describe('Property-Based Tests', () => {
    describe('Property 25: Distance calculation', () => {
      it('should calculate distance using haversine formula with correct properties', async () => {
        /**
         * Feature: enhanced-listing-experience, Property 25: Distance calculation
         * **Validates: Requirements 9.7**
         * 
         * For any two coordinate pairs, the distance calculation should use the haversine formula
         * and return the distance in kilometers.
         */
        const fc = await import('fast-check');

        await fc.assert(
          fc.property(
            fc.record({
              lat1: fc.double({ min: -90, max: 90, noNaN: true }),
              lon1: fc.double({ min: -180, max: 180, noNaN: true }),
              lat2: fc.double({ min: -90, max: 90, noNaN: true }),
              lon2: fc.double({ min: -180, max: 180, noNaN: true }),
            }),
            (coords) => {
              const coords1: Coordinates = {
                latitude: coords.lat1,
                longitude: coords.lon1,
              };
              const coords2: Coordinates = {
                latitude: coords.lat2,
                longitude: coords.lon2,
              };

              const distance = calculateDistance(coords1, coords2);

              // Property 1: Distance should be non-negative
              expect(distance).toBeGreaterThanOrEqual(0);

              // Property 2: Distance should be symmetric (distance A->B = distance B->A)
              const reverseDistance = calculateDistance(coords2, coords1);
              expect(distance).toBeCloseTo(reverseDistance, 5);

              // Property 3: Distance to self should be 0
              if (coords.lat1 === coords.lat2 && coords.lon1 === coords.lon2) {
                expect(distance).toBe(0);
              }

              // Property 4: Distance should not exceed Earth's half circumference (~20,000 km)
              expect(distance).toBeLessThanOrEqual(20100);

              // Property 5: Distance should be a finite number
              expect(Number.isFinite(distance)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two known coordinates', () => {
      // New York City
      const nyc: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      // Los Angeles
      const la: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const distance = calculateDistance(nyc, la);

      // Distance between NYC and LA is approximately 3944 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for identical coordinates', () => {
      const coords: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const distance = calculateDistance(coords, coords);

      expect(distance).toBe(0);
    });

    it('should handle coordinates at the equator', () => {
      const coord1: Coordinates = { latitude: 0, longitude: 0 };
      const coord2: Coordinates = { latitude: 0, longitude: 1 };

      const distance = calculateDistance(coord1, coord2);

      // 1 degree at equator is approximately 111 km
      expect(distance).toBeGreaterThan(110);
      expect(distance).toBeLessThan(112);
    });

    it('should handle coordinates at the poles', () => {
      const northPole: Coordinates = { latitude: 90, longitude: 0 };
      const southPole: Coordinates = { latitude: -90, longitude: 0 };

      const distance = calculateDistance(northPole, southPole);

      // Distance from north to south pole is approximately half Earth's circumference
      expect(distance).toBeGreaterThan(20000);
      expect(distance).toBeLessThan(20100);
    });
  });

  describe('calculateDistanceForItem', () => {
    it('should calculate distance when both coordinates are provided', () => {
      const userCoords: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const ownerCoords: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const distance = calculateDistanceForItem(userCoords, ownerCoords);

      expect(distance).not.toBeNull();
      expect(distance).toBeGreaterThan(3900);
    });

    it('should return null when user coordinates are null', () => {
      const ownerCoords: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const distance = calculateDistanceForItem(null, ownerCoords);

      expect(distance).toBeNull();
    });

    it('should return null when owner coordinates are null', () => {
      const userCoords: Coordinates = { latitude: 40.7128, longitude: -74.0060 };

      const distance = calculateDistanceForItem(userCoords, null);

      expect(distance).toBeNull();
    });

    it('should return null when both coordinates are null', () => {
      const distance = calculateDistanceForItem(null, null);

      expect(distance).toBeNull();
    });
  });

  describe('formatDistanceDisplay', () => {
    describe('edge cases', () => {
      it('should display distance < 1 km in meters', () => {
        // Test distance < 1 km displays in meters
        const result = formatDistanceDisplay(0.5, 'New York, NY');
        expect(result).toBe('500m away');

        const result2 = formatDistanceDisplay(0.123, 'Los Angeles, CA');
        expect(result2).toBe('123m away');

        const result3 = formatDistanceDisplay(0.999, 'Chicago, IL');
        expect(result3).toBe('999m away');
      });

      it('should display distance > 100 km as "100+ km away"', () => {
        // Test distance > 100 km displays "100+ km away"
        const result = formatDistanceDisplay(101, 'New York, NY');
        expect(result).toBe('100+ km away');

        const result2 = formatDistanceDisplay(500, 'Los Angeles, CA');
        expect(result2).toBe('100+ km away');

        const result3 = formatDistanceDisplay(1000, 'Chicago, IL');
        expect(result3).toBe('100+ km away');
      });

      it('should display distance exactly at 100 km as "100+ km away"', () => {
        const result = formatDistanceDisplay(100.1, 'Seattle, WA');
        expect(result).toBe('100+ km away');
      });

      it('should display distance exactly at 1 km in km format', () => {
        const result = formatDistanceDisplay(1, 'Boston, MA');
        expect(result).toBe('1.0km away');
      });

      it('should display very small distances in meters', () => {
        const result = formatDistanceDisplay(0.001, 'Portland, OR');
        expect(result).toBe('1m away');

        const result2 = formatDistanceDisplay(0.05, 'Denver, CO');
        expect(result2).toBe('50m away');
      });
    });

    it('should return location string when distance is null', () => {
      const result = formatDistanceDisplay(null, 'New York, NY');
      expect(result).toBe('New York, NY');

      const result2 = formatDistanceDisplay(null, 'Los Angeles, CA');
      expect(result2).toBe('Los Angeles, CA');
    });

    it('should format distance 1-10 km with one decimal place', () => {
      const result = formatDistanceDisplay(5.5, 'San Francisco, CA');
      expect(result).toBe('5.5km away');

      const result2 = formatDistanceDisplay(9.9, 'Austin, TX');
      expect(result2).toBe('9.9km away');
    });

    it('should format distance 10-100 km as rounded integer', () => {
      const result = formatDistanceDisplay(15.7, 'Miami, FL');
      expect(result).toBe('16km away');

      const result2 = formatDistanceDisplay(99.4, 'Phoenix, AZ');
      expect(result2).toBe('99km away');
    });
  });
});
