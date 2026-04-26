/**
 * Sabbath detection utility
 * Sabbath runs from sunset Friday to sunset Saturday.
 * Uses solar position calculation based on host's GPS coordinates.
 */

/** Calculate sunset time for a given date and location */
function getSunsetTime(date: Date, lat: number, lng: number): Date {
  // Solar calculation based on NOAA algorithm
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Fractional year (radians)
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  // Equation of time (minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.04089 * Math.sin(2 * gamma));

  // Solar declination (radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Hour angle for sunset (degrees)
  // Using -0.833 degrees for standard atmospheric refraction
  const zenith = 90.833 * rad;
  const latRad = lat * rad;

  const cosHourAngle =
    (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl))) -
    (Math.tan(latRad) * Math.tan(decl));

  // Handle polar regions where sun doesn't set/rise
  if (cosHourAngle > 1) {
    // Sun never rises — use 4pm as default
    const d = new Date(date);
    d.setHours(16, 0, 0, 0);
    return d;
  }
  if (cosHourAngle < -1) {
    // Sun never sets — use 10pm as default
    const d = new Date(date);
    d.setHours(22, 0, 0, 0);
    return d;
  }

  const hourAngle = Math.acos(cosHourAngle) / rad;

  // Sunset time in minutes from midnight (UTC)
  const sunsetUTC = 720 - (4 * (lng + hourAngle)) - eqTime;

  // Convert to local Date
  const sunsetDate = new Date(date);
  sunsetDate.setUTCHours(0, 0, 0, 0);
  sunsetDate.setUTCMinutes(sunsetUTC);

  return sunsetDate;
}

/** Get the Friday date for the current week (or today if Friday) */
function getFriday(now: Date): Date {
  const d = new Date(now);
  const day = d.getDay();
  // If Sunday(0)-Thursday(4), go back to last Friday
  // If Friday(5), use today
  // If Saturday(6), go back 1 day
  if (day === 6) {
    d.setDate(d.getDate() - 1);
  } else if (day < 5) {
    d.setDate(d.getDate() - (day + 2));
  }
  d.setHours(12, 0, 0, 0); // noon for accurate sunset calc
  return d;
}

/** Get the Saturday date for the current week */
function getSaturday(now: Date): Date {
  const friday = getFriday(now);
  const d = new Date(friday);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Check if it's currently Sabbath based on coordinates.
 * Requires host's latitude and longitude.
 * Falls back to approximate 6pm-8pm if no coordinates available.
 */
export function isSabbath(lat?: number, lng?: number): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

  // Only possible on Friday or Saturday
  if (day !== 5 && day !== 6) return false;

  // If no coordinates, use approximate times
  if (lat === undefined || lng === undefined) {
    const hour = now.getHours();
    if (day === 5 && hour >= 18) return true;
    if (day === 6 && hour < 20) return true;
    return false;
  }

  // Calculate actual sunset times
  const friday = getFriday(now);
  const saturday = getSaturday(now);

  const fridaySunset = getSunsetTime(friday, lat, lng);
  const saturdaySunset = getSunsetTime(saturday, lat, lng);

  // Sabbath: from Friday sunset to Saturday sunset
  return now >= fridaySunset && now <= saturdaySunset;
}

/**
 * Request the user's location and check Sabbath.
 * Returns a promise. If geolocation denied, uses approximate times.
 */
export function checkSabbathWithLocation(): Promise<{
  isSabbath: boolean;
  lat?: number;
  lng?: number;
  sunsetInfo?: string;
}> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ isSabbath: isSabbath() });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const sabbath = isSabbath(latitude, longitude);

        // Calculate sunset times for display
        let sunsetInfo: string | undefined;
        if (sabbath) {
          const now = new Date();
          const saturday = getSaturday(now);
          const satSunset = getSunsetTime(saturday, latitude, longitude);
          const hours = satSunset.getHours();
          const mins = satSunset.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
          sunsetInfo = `Sabbath ends at sunset (${h12}:${mins} ${ampm})`;
        }

        resolve({ isSabbath: sabbath, lat: latitude, lng: longitude, sunsetInfo });
      },
      () => {
        // Geolocation denied — fall back to approximate
        resolve({ isSabbath: isSabbath() });
      },
      { timeout: 5000, maximumAge: 600000 }
    );
  });
}
