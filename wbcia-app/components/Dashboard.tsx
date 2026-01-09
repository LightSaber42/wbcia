"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("USA"); // Default USA
  const [source, setSource] = useState("World Bank");
  const [activeSeries, setActiveSeries] = useState<ActiveSeries[]>([]);
  const [dateRange, setDateRange] = useState<[number, number]>([1960, 2023]);

  // Load countries on mount
  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  // Update data when country changes? 
  // Requirement says "Select a country", then "Search for dataset".
  // If country changes, should we clear data or re-fetch for new country?
  // Usually re-fetch is better UX.
  useEffect(() => {
    if (activeSeries.length > 0) {
      // Reload all active series for the new country
      const reloadData = async () => {
        const updatedSeriesPromises = activeSeries.map(async (s) => {
          const newData = await fetchData(selectedCountry, s.indicatorId);
          return { ...s, data: newData };
        });
        const updatedSeries = await Promise.all(updatedSeriesPromises);
        setActiveSeries(updatedSeries);
        
        // Update range if needed, or keep user preference?
        // Let's keep user preference unless it's empty.
      };
      reloadData();
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
