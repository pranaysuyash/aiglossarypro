import type { Express, Request, Response } from 'express';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';

const locationCache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // Cache for 24 hours

export function registerLocationRoutes(app: Express): void {
  app.get('/api/location', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    const cacheKey = `location_${clientIp}`;

    try {
      const cachedLocation = locationCache.get(cacheKey);
      if (cachedLocation) {
        return res.json(cachedLocation);
      }

      const response = await fetch('https://ipapi.co/json/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Glossary/1.0)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure we have the required fields
      if (!data.country_code || !data.country_name) {
        throw new Error('Invalid response from IP geolocation service');
      }
      
      locationCache.set(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error('Error fetching location:', error);
      
      // Return default location data to prevent app crashes
      res.json({
        country_code: 'US',
        country_name: 'United States',
        region: 'Unknown',
        city: 'Unknown',
        postal: 'Unknown',
        latitude: 37.7749,
        longitude: -122.4194,
        ip: clientIp,
      });
    }
  });
}
