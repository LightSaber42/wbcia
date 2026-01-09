"use client";

import React, { useState, useEffect } from 'react';
import { Country, Indicator } from '@/lib/api';
import { Search, Plus } from 'lucide-react';

interface ControlPanelProps {
  countries: Country[];
  selectedCountry: string;
  onSelectCountry: (id: string) => void;
  source: string;
  onSelectSource: (source: string) => void;
  onAddSeries: (indicator: Indicator) => void;
  onSearchIndicators: (query: string) => Promise<Indicator[]>;
  dateRange: [number, number];
  onDateRangeChange: (range: [number, number]) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  countries,
  selectedCountry,
  onSelectCountry,
  source,
  onSelectSource,
  onAddSeries,
  onSearchIndicators,
  dateRange,
  onDateRangeChange
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Indicator[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        const results = await onSearchIndicators(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearchIndicators]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-xl font-bold mb-4">Controls</h2>
      
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select 
          className="w-full p-2 border border-gray-300 rounded-md"
          value={selectedCountry}
          onChange={(e) => onSelectCountry(e.target.value)}
        >
          <option value="">Select a country</option>
          {countries.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Source Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
        <select 
          className="w-full p-2 border border-gray-300 rounded-md"
          value={source}
          onChange={(e) => onSelectSource(e.target.value)}
        >
          <option value="World Bank">World Bank</option>
          <option value="CIA World Factbook">CIA World Factbook (Limited)</option>
        </select>
      </div>

      {/* Dataset Search */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Add Dataset</label>
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <div className="p-2 text-gray-500">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            className="w-full p-2 outline-none"
            placeholder="Search indicators (e.g. GDP, Population)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(indicator => (
              <div 
                key={indicator.id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => {
                  onAddSeries(indicator);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <span className="text-sm text-gray-800">{indicator.name}</span>
                <Plus size={16} className="text-blue-500" />
              </div>
            ))}
          </div>
        )}
        {isSearching && <div className="text-xs text-gray-500 mt-1">Searching...</div>}
      </div>

      {/* Date Range Inputs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Year Range (X-Axis)</label>
        <div className="flex space-x-2">
          <input 
            type="number" 
            className="w-1/2 p-2 border border-gray-300 rounded-md"
            value={dateRange[0]}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) onDateRangeChange([val, dateRange[1]]);
            }}
            placeholder="Start"
          />
          <input 
            type="number" 
            className="w-1/2 p-2 border border-gray-300 rounded-md"
            value={dateRange[1]}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) onDateRangeChange([dateRange[0], val]);
            }}
            placeholder="End"
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
