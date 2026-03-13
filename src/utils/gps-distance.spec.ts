import {
  haversineDistance,
  isWithinRadius,
  DEFAULT_GEOFENCE_RADIUS_METERS,
} from './gps-distance';

describe('GPS Distance Utilities', () => {
  describe('haversineDistance', () => {
    it('should return 0 for identical coordinates', () => {
      const distance = haversineDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should calculate distance between two known points', () => {
      // NYC to LA — approximately 3,944 km
      const distance = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3_900_000);
      expect(distance).toBeLessThan(4_000_000);
    });

    it('should calculate short distances accurately', () => {
      // ~111 meters (0.001 degrees latitude at equator)
      const distance = haversineDistance(0, 0, 0.001, 0);
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(120);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true when points are within default radius', () => {
      // Two points ~50m apart
      const result = isWithinRadius(40.7128, -74.006, 40.7132, -74.006);
      expect(result).toBe(true);
    });

    it('should return false when points are outside default radius', () => {
      // Two points ~1km apart
      const result = isWithinRadius(40.7128, -74.006, 40.722, -74.006);
      expect(result).toBe(false);
    });

    it('should respect custom radius', () => {
      // ~1km apart, 2000m radius
      const result = isWithinRadius(40.7128, -74.006, 40.722, -74.006, 2000);
      expect(result).toBe(true);
    });
  });

  describe('DEFAULT_GEOFENCE_RADIUS_METERS', () => {
    it('should be 200 meters', () => {
      expect(DEFAULT_GEOFENCE_RADIUS_METERS).toBe(200);
    });
  });
});
