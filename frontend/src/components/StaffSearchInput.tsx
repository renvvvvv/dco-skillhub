import { useState, useEffect, useRef, useCallback } from 'react';

export interface Staff {
  name: string;
  employee_id: string;
  new_employee_id: string;
  department: string;
  organization: string;
}

interface StaffSearchInputProps {
  onSelect: (staff: Staff) => void;
  placeholder?: string;
  className?: string;
}

// 全局缓存字典数据
let staffCache: Staff[] | null = null;
let cachePromise: Promise<Staff[]> | null = null;

async function loadStaffDictionary(): Promise<Staff[]> {
  if (staffCache) return staffCache;
  if (cachePromise) return cachePromise;
  
  cachePromise = fetch('/staff_dictionary.json')
    .then(res => res.json())
    .then(data => {
      staffCache = data;
      return data;
    });
  
  return cachePromise;
}

export function StaffSearchInput({ onSelect, placeholder = "搜索姓名或工号...", className = "" }: StaffSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Staff[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 搜索逻辑
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const staffList = await loadStaffDictionary();
    const lowerQuery = searchQuery.toLowerCase();
    
    const filtered = staffList.filter(staff => 
      staff.name.toLowerCase().includes(lowerQuery) ||
      staff.employee_id.toLowerCase().includes(lowerQuery) ||
      staff.new_employee_id.toLowerCase().includes(lowerQuery)
    ).slice(0, 10); // 最多显示10条
    
    setResults(filtered);
    setIsLoading(false);
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (staff: Staff) => {
    onSelect(staff);
    setQuery(staff.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((staff, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(staff)}
              className="w-full px-4 py-2 text-left hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{staff.name}</span>
                <span className="text-sm text-gray-500">
                  {staff.employee_id || staff.new_employee_id || '-'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {staff.department} · {staff.organization}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-sm">未找到匹配的人员</div>
        </div>
      )}
    </div>
  );
}

export default StaffSearchInput;
