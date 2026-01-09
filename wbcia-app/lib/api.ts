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
    // Fetching from Source 2 (WDI) to get most common ones. 
    // Optimization: In a real app, we'd cache this or use a more specific search endpoint.
    // Here we fetch a batch and filter client-side for the prototype to ensure relevance.
    const response = await axios.get(`${BASE_URL}/indicator?format=json&source=2&per_page=500`);
    const data = response.data[1];
    
    if (!query) return data.slice(0, 20).map((i: any) => ({ id: i.id, name: i.name, sourceNote: i.sourceNote }));

    const lowerQuery = query.toLowerCase();
    return data
      .filter((i: any) => i.name.toLowerCase().includes(lowerQuery) || i.id.toLowerCase().includes(lowerQuery))
      .map((i: any) => ({
        id: i.id,
        name: i.name,
        sourceNote: i.sourceNote
      }))
      .slice(0, 20);
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
