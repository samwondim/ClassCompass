'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterProps {
  options: { label: string; value: string }[];
  placeholder: string;
  paramName: string;
  allLabel?: string;
}

function FilterInner({ options, placeholder, paramName, allLabel = 'ሁሉም' }: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleValueChange} defaultValue={searchParams.get(paramName) || 'all'}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Filter(props: FilterProps) {
  return (
    <Suspense fallback={
      <div className="w-full sm:w-[180px] h-10 rounded-md border bg-muted animate-pulse" />
    }>
      <FilterInner {...props} />
    </Suspense>
  );
}
