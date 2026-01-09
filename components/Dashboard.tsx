"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { fetchCountries, searchIndicators, fetchData, Country, Indicator, getColorForSeries } from '@/lib/api';
import ControlPanel from './ControlPanel';
import ChartComponent from './ChartComponent';
import { uniq, sortBy } from 'lodash';
import { Loader2 } from 'lucide-react';

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

interface ActiveSeries {
  id: string; 
  indicatorId: string;
  indicatorName: string;
  color: string;
  data: { year: number; value: number }[];
}

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [countries, setCountries] = useState<Country[]>([]);
  
  // Initialize state from URL or defaults
  const [selectedCountry, setSelectedCountry] = useState<string>(() => 
    searchParams.get('country') || ""
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
  const [isLoading, setIsLoading] = useState(false);

  // Load countries on mount
  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  // Initialize Active Series from URL or Defaults
  useEffect(() => {
    if (isInitialized) return;

    const seriesParam = searchParams.get('series');
    
    const initSeries = async () => {
      setIsLoading(true);
      let seriesToLoad: { id: string; color: string; name: string }[] = [];

      if (seriesParam) {
        seriesToLoad = seriesParam.split(',').map(s => {
          const [id, color, encodedName] = s.split('~');
          return { id, color, name: decodeURIComponent(encodedName) };
        });
      } else if (selectedCountry) {
        // Use defaults if nothing in URL but country is selected
        seriesToLoad = DEFAULT_INDICATORS.map((ind, idx) => ({
          id: ind.id,
          name: ind.name,
          color: getColorForSeries(idx)
        }));
      }

      if (seriesToLoad.length > 0 && selectedCountry) {
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
      }

      setIsInitialized(true);
      setIsLoading(false);
    };

    initSeries();
  }, [selectedCountry, isInitialized, searchParams]);

  // Sync URL with State
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    if (selectedCountry) params.set('country', selectedCountry);
    params.set('source', source);
    params.set('range', `${dateRange[0]}-${dateRange[1]}`);
    
    if (activeSeries.length > 0) {
      const seriesString = activeSeries
        .map(s => `${s.indicatorId}~${s.color}~${encodeURIComponent(s.indicatorName)}`)
        .join(',');
      params.set('series', seriesString);
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [selectedCountry, source, dateRange, activeSeries, isInitialized, pathname, router]);


  // Update data when country changes (only after initialization)
  useEffect(() => {
    if (isInitialized && selectedCountry) {
      const reloadData = async () => {
        setIsLoading(true);
        
        let seriesToLoad = activeSeries.map(s => ({
          id: s.indicatorId,
          name: s.indicatorName,
          color: s.color
        }));

        // If switching from a state with no series, load defaults
        if (seriesToLoad.length === 0) {
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
        setIsLoading(false);
      };
      reloadData();
    } else if (isInitialized && !selectedCountry) {
      setActiveSeries([]);
    }
  }, [selectedCountry]); 

  const handleAddSeries = async (indicator: Indicator) => {
    if (!selectedCountry) {
      alert("Please select a country first.");
      return;
    }
    
    setIsLoading(true);
    const data = await fetchData(selectedCountry, indicator.id);
    setIsLoading(false);
    
    if (data.length === 0) {
      alert("No data found for this indicator in the selected country.");
      return;
    }

    const newSeries: ActiveSeries = {
      id: `series_${Math.random().toString(36).substr(2, 9)}`,
      indicatorId: indicator.id,
      indicatorName: indicator.name,
      color: getColorForSeries(activeSeries.length),
      data: data
    };

    setActiveSeries(prev => [...prev, newSeries]);
  };

  const chartData = useMemo(() => {
    if (activeSeries.length === 0) return [];
    const allYears = uniq(activeSeries.flatMap(s => s.data.map(d => d.year)));
    const sortedYears = sortBy(allYears);
    return sortedYears.map(year => {
      const point: any = { year };
      activeSeries.forEach(s => {
        const d = s.data.find(item => item.year === year);
        if (d) point[s.id] = d.value;
      });
      return point;
    });
  }, [activeSeries]);

  const countryName = useMemo(() => {
    return countries.find(c => c.id === selectedCountry)?.name || selectedCountry;
  }, [countries, selectedCountry]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
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
        activeSeries={activeSeries}
        onRemoveSeries={(id) => setActiveSeries(prev => prev.filter(item => item.id !== id))}
      />

      <div className="flex-1 p-4 h-full flex flex-col min-w-0 relative">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 flex-shrink-0">
          World Bank Data Visualizer {selectedCountry && ` - ${countryName}`}
        </h1>
        <div className="flex-1 min-h-0 bg-white rounded-lg shadow-md border border-gray-200 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          )}
          
          {!selectedCountry && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <p>Select a country to view data</p>
            </div>
          )}

          {selectedCountry && (
            <ChartComponent 
              data={chartData}
              seriesList={activeSeries}
              xDomain={dateRange}
              onDomainChange={setDateRange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
