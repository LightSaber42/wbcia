"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { fetchCountries, searchIndicators, fetchData, Country, Indicator, getColorForSeries } from '@/lib/api';
import ControlPanel from './ControlPanel';
import ChartComponent from './ChartComponent';
import { uniq, sortBy } from 'lodash';

interface ActiveSeries {
  id: string; // Random internal ID for the chart line
  indicatorId: string;
  indicatorName: string;
  color: string;
  data: { year: number; value: number }[];
}

const DEFAULT_INDICATORS = [
  { id: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)' },
  { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP growth (annual %)' },
  { id: 'SP.POP.TOTL', name: 'Population, total' },
  { id: 'FP.CPI.TOTL.ZG', name: 'Inflation, consumer prices (annual %)' },
  { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment, total (% of total labor force)' },
  { id: 'SP.DYN.LE00.IN', name: 'Life expectancy at birth, total (years)' },
  { id: 'MS.MIL.XPND.GD.ZS', name: 'Military expenditure (% of GDP)' },
  { id: 'EN.ATM.CO2E.PC', name: 'CO2 emissions (metric tons per capita)' },
  { id: 'VC.IHR.PSRC.P5', name: 'Intentional homicides (per 100,000 people)' },
  { id: 'EG.ELC.ACCS.ZS', name: 'Access to electricity (% of population)' },
];

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [countries, setCountries] = useState<Country[]>([]);
  
  // Initialize state from URL or defaults
  const [selectedCountry, setSelectedCountry] = useState<string>(() => 
    searchParams.get('country') || "USA"
  );
  const [source, setSource] = useState(() => 
    searchParams.get('source') || "World Bank"
  );
  const [dateRange, setDateRange] = useState<[number, number]>(() => {
    const rangeParam = searchParams.get('range');
    if (rangeParam) {
      const [start, end] = rangeParam.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) return [start, end];
    }
    return [1960, 2023];
  });

  const [activeSeries, setActiveSeries] = useState<ActiveSeries[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load countries on mount
  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  // Initialize Active Series from URL or Defaults
  useEffect(() => {
    const seriesParam = searchParams.get('series');
    
    const initSeries = async () => {
      let seriesToLoad = [];

      if (seriesParam) {
        seriesToLoad = seriesParam.split(',').map(s => {
          const [id, color, encodedName] = s.split('~');
          return { id, color, name: decodeURIComponent(encodedName) };
        });
      } else {
        // Use defaults if nothing in URL
        seriesToLoad = DEFAULT_INDICATORS.map((ind, idx) => ({
          id: ind.id,
          name: ind.name,
          color: getColorForSeries(idx)
        }));
      }

      const loadedSeries = await Promise.all(seriesToLoad.map(async (meta) => {
        const data = await fetchData(selectedCountry, meta.id);
        return {
          id: `series_${Math.random().toString(36).substr(2, 9)}`,
          indicatorId: meta.id,
          indicatorName: meta.name,
          color: meta.color,
          data: data
        };
      }));
      
      setActiveSeries(loadedSeries.filter(s => s.data.length > 0));
      
      // Adapt range to first series if no range in URL
      if (!searchParams.get('range') && loadedSeries.length > 0 && loadedSeries[0].data.length > 0) {
        const years = loadedSeries[0].data.map(d => d.year);
        setDateRange([Math.min(...years), Math.max(...years)]);
      }

      setIsInitialized(true);
    };

    if (!isInitialized) {
      initSeries();
    }
  }, [selectedCountry, isInitialized, searchParams]);

  // Sync URL with State
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    params.set('country', selectedCountry);
    params.set('source', source);
    params.set('range', `${dateRange[0]}-${dateRange[1]}`);
    
    if (activeSeries.length > 0) {
      const seriesString = activeSeries
        .map(s => `${s.indicatorId}~${s.color}~${encodeURIComponent(s.indicatorName)}`)
        .join(',');
      params.set('series', seriesString);
    } else {
      params.delete('series');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [selectedCountry, source, dateRange, activeSeries, isInitialized, pathname, router]);


  // Reset to default indicators when country changes (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      const loadDefaults = async () => {
        const seriesToLoad = DEFAULT_INDICATORS.map((ind, idx) => ({
          id: ind.id,
          name: ind.name,
          color: getColorForSeries(idx)
        }));

        const loadedSeries = await Promise.all(seriesToLoad.map(async (meta) => {
          const data = await fetchData(selectedCountry, meta.id);
          return {
            id: `series_${Math.random().toString(36).substr(2, 9)}`,
            indicatorId: meta.id,
            indicatorName: meta.name,
            color: meta.color,
            data: data
          };
        }));
        
        setActiveSeries(loadedSeries.filter(s => s.data.length > 0));
      };
      loadDefaults();
    }
  }, [selectedCountry]);

  const handleAddSeries = async (indicator: Indicator) => {
    const data = await fetchData(selectedCountry, indicator.id);
    
    if (data.length === 0) {
      alert("No data found for this indicator in the selected country.");
      return;
    }

    const newSeries: ActiveSeries = {
      id: `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      indicatorId: indicator.id,
      indicatorName: indicator.name,
      color: getColorForSeries(activeSeries.length),
      data: data
    };

    setActiveSeries(prev => [...prev, newSeries]);

    // If it's the first series, set range based on data
    if (activeSeries.length === 0) {
      const years = data.map(d => d.year);
      setDateRange([Math.min(...years), Math.max(...years)]);
    }
  };

  const chartData = useMemo(() => {
    if (activeSeries.length === 0) return [];

    // Collect all unique years from all series
    const allYears = uniq(activeSeries.flatMap(s => s.data.map(d => d.year)));
    const sortedYears = sortBy(allYears);

    // Build the data objects
    return sortedYears.map(year => {
      const point: any = { year };
      activeSeries.forEach(s => {
        const d = s.data.find(item => item.year === year);
        if (d) {
          point[s.id] = d.value;
        }
      });
      return point;
    });
  }, [activeSeries]);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 min-h-screen bg-gray-50">
      <div className="w-full md:w-1/3 lg:w-1/4">
        <ControlPanel 
          countries={countries}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          source={source}
          onSelectSource={setSource}
          onAddSeries={handleAddSeries}
          onSearchIndicators={searchIndicators}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        
        {/* Active Series List (Legend/Delete) */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold mb-2">Active Series</h3>
          {activeSeries.length === 0 && <p className="text-sm text-gray-500">No series added.</p>}
          <ul className="space-y-2">
            {activeSeries.map(s => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: s.color }}></span>
                  <span className="truncate max-w-[150px]" title={s.indicatorName}>{s.indicatorName}</span>
                </div>
                <button 
                  onClick={() => setActiveSeries(prev => prev.filter(item => item.id !== s.id))}
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full md:w-2/3 lg:w-3/4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">World Bank Data Visualizer</h1>
        <ChartComponent 
          data={chartData}
          seriesList={activeSeries}
          xDomain={dateRange}
          onDomainChange={setDateRange}
        />
      </div>
    </div>
  );
}
