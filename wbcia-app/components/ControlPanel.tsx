"use client";

import React, { useState, useEffect } from 'react';
import { Country, Indicator } from '@/lib/api';
import { Search, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';

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
  activeSeries: any[];
  onRemoveSeries: (id: string) => void;
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
  onDateRangeChange,
  activeSeries,
  onRemoveSeries
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Indicator[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className={`transition-all duration-300 ease-in-out bg-white shadow-md flex flex-col ${isCollapsed ? 'w-12 p-2 items-center' : 'w-full md:w-1/3 lg:w-1/4 p-6'}`}>
      <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center mb-4`}>
        {!isCollapsed && <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">Controls</h2>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="space-y-6 overflow-y-auto flex-1">
          {/* Active Series List */}
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <h3 className="font-bold text-sm text-gray-700 mb-2">Active Series</h3>
            {activeSeries.length === 0 && <p className="text-xs text-gray-500">No series added.</p>}
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {activeSeries.map(s => (
                <li key={s.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <div className="flex items-center overflow-hidden">
                    <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: s.color }}></span>
                    <span className="truncate text-gray-800 text-xs" title={s.indicatorName}>{s.indicatorName}</span>
                  </div>
                  <button 
                    onClick={() => onRemoveSeries(s.id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Country Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Country</label>
            <select 
              className="w-full p-2 border border-gray-400 bg-gray-50 text-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-900 mb-1">Source</label>
            <select 
              className="w-full p-2 border border-gray-400 bg-gray-50 text-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={source}
              onChange={(e) => onSelectSource(e.target.value)}
            >
              <option value="World Bank">World Bank</option>
              <option value="CIA World Factbook">CIA World Factbook (Limited)</option>
            </select>
          </div>

          {/* Dataset Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-900 mb-1">Add Dataset</label>
            <div className="flex items-center border border-gray-400 bg-gray-50 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <div className="p-2 text-gray-600">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                className="w-full p-2 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                placeholder="Search indicators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.sort((a, b) => a.name.localeCompare(b.name)).map(indicator => (
                  <div 
                    key={indicator.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-none"
                    onClick={() => {
                      onAddSeries(indicator);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    <span className="text-sm text-gray-900">{indicator.name}</span>
                    <Plus size={16} className="text-blue-500" />
                  </div>
                ))}
              </div>
            )}
            {isSearching && <div className="text-xs text-gray-500 mt-1">Searching...</div>}
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Year Range</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                className="w-1/2 p-2 border border-gray-400 bg-gray-50 text-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dateRange[0]}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onDateRangeChange([val, dateRange[1]]);
                }}
                placeholder="Start"
              />
              <input 
                type="number" 
                className="w-1/2 p-2 border border-gray-400 bg-gray-50 text-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      )}
    </div>
  );
};

export default ControlPanel;
