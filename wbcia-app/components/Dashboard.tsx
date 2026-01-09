"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { fetchCountries, searchIndicators, fetchData, Country, Indicator, getRandomColor } from '@/lib/api';
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

  // Initialize Active Series from URL
  useEffect(() => {
    const seriesParam = searchParams.get('series');
    if (seriesParam && !isInitialized) {
      const initSeries = async () => {
        const seriesMetas = seriesParam.split(',').map(s => {
          const [id, color, encodedName] = s.split('~');
          return { id, color, name: decodeURIComponent(encodedName) };
        });

        const loadedSeries = await Promise.all(seriesMetas.map(async (meta) => {
          const data = await fetchData(selectedCountry, meta.id);
          return {
            id: `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            indicatorId: meta.id,
            indicatorName: meta.name,
            color: meta.color,
            data: data
          };
        }));
        
        setActiveSeries(loadedSeries);
        setIsInitialized(true);
      };
      initSeries();
    } else {
      setIsInitialized(true);
    }
  }, []); // Run once on mount

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


  // Update data when country changes (only after initialization)
  useEffect(() => {
    if (isInitialized && activeSeries.length > 0) {
      const reloadData = async () => {
        const updatedSeriesPromises = activeSeries.map(async (s) => {
          const newData = await fetchData(selectedCountry, s.indicatorId);
          return { ...s, data: newData };
        });
        const updatedSeries = await Promise.all(updatedSeriesPromises);
        setActiveSeries(updatedSeries);
      };
      reloadData();
    }
  }, [selectedCountry]); // Remove activeSeries from dep to avoid loop, we rely on selectedCountry changing

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
      color: getRandomColor(),
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
