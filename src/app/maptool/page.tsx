'use client'
import dynamic from 'next/dynamic';

const MapTool = dynamic(() => import('@/components/Maptool'), {
  ssr: false,
});

export default function Page() {
  return <MapTool />;
}
