import axios from 'axios';

const BASE_URL = 'https://api.worldbank.org/v2';

export interface Country {
  id: string;
  name: string;
}

export interface Indicator {
  id: string;
  name: string;
  sourceNote: string;
}

export interface DataPoint {
  year: number;
  value: number;
}

export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/country?format=json&per_page=300`);
    // API returns [metadata, data]
    const data = response.data[1];
    return data.map((c: any) => ({
      id: c.iso2Code,
      name: c.name
    })).filter((c: Country) => c.id !== 'XK'); // Filter out Kosovo if problematic or aggregates
  } catch (error) {
    console.error("Error fetching countries", error);
    return [];
  }
};

export const searchIndicators = async (query: string): Promise<Indicator[]> => {
  try {
    let directMatch: Indicator | null = null;
    
    // If query looks like an ID, try direct fetch
    if (query && query.includes('.') && query.length > 5) {
      try {
        const directRes = await axios.get(`${BASE_URL}/indicator/${query}?format=json`);
        if (directRes.data[1] && directRes.data[1].length > 0) {
          const item = directRes.data[1][0];
          directMatch = { id: item.id, name: item.name, sourceNote: item.sourceNote };
        }
      } catch (e) {
        // Ignore direct fetch errors
      }
    }

    // Fetching from Source 2 (WDI) with a large page size to get all.
    // 5000 is enough to cover the ~1500 active WDI indicators.
    const response = await axios.get(`${BASE_URL}/indicator?format=json&source=2&per_page=5000`);
    const data = response.data[1];
    
    if (!query) {
      const results = data.slice(0, 20).map((i: any) => ({ id: i.id, name: i.name, sourceNote: i.sourceNote }));
      return directMatch ? [directMatch, ...results] : results;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = data
      .filter((i: any) => i.name.toLowerCase().includes(lowerQuery) || i.id.toLowerCase().includes(lowerQuery))
      .map((i: any) => ({
        id: i.id,
        name: i.name,
        sourceNote: i.sourceNote
      }));

    // Dedup if direct match is also in list
    if (directMatch) {
      const exists = filtered.find((i: Indicator) => i.id === directMatch!.id);
      if (!exists) {
        filtered.unshift(directMatch);
      }
    }

    return filtered.slice(0, 50);
  } catch (error) {
    console.error("Error fetching indicators", error);
    return [];
  }
};

export const fetchData = async (countryCode: string, indicatorId: string): Promise<DataPoint[]> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/country/${countryCode}/indicator/${indicatorId}?format=json&per_page=100`
    );
    const data = response.data[1];
    
    if (!data) return [];

    return data
      .filter((d: any) => d.value !== null)
      .map((d: any) => ({
        year: parseInt(d.date),
        value: d.value
      }))
      .sort((a: DataPoint, b: DataPoint) => a.year - b.year);
  } catch (error) {
    console.error("Error fetching data", error);
    return [];
  }
};

export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
