import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface SkeletonProps {
  baseColor?: string;
  highlightColor?: string;
}

export const ArticleListSkeleton = (props: SkeletonProps) => {
  return (
    <SkeletonTheme {...props}>
      <div className='grid gap-[5px] mb-3'>
        <div className="h-5 w-[72%]"><Skeleton height="100%" /></div>
        <div className=''>
          <div className='h-[10px] mb-1'><Skeleton height="100%" /></div>
          <div className='h-[10px] w-[80%] mb-1'><Skeleton height="100%" /></div>
        </div>
        <div className='overflow-hidden'>
          <span className="float-left w-[20%] h-[10px]">
            <Skeleton height="100%" />
          </span>
          <span className="float-right w-[20%] h-[10px]">
            <Skeleton height="100%" />
          </span>
        </div>
      </div>

      <div className='grid gap-[5px] mb-3'>
        <div className="h-5 w-[72%]"><Skeleton height="100%" /></div>
        <div className=''>
          <div className='h-[10px] mb-1'><Skeleton height="100%" /></div>
          <div className='h-[10px] w-[80%] mb-1'><Skeleton height="100%" /></div>
        </div>
        <div className='overflow-hidden'>
          <span className="float-left w-[20%] h-[10px]">
            <Skeleton height="100%" />
          </span>
          <span className="float-right w-[20%] h-[10px]">
            <Skeleton height="100%" />
          </span>
        </div>
      </div>

      <div className='grid gap-[5px] mb-3'>
        <div className="h-5 w-[72%]"><Skeleton height="100%" /></div>
        <div className=''>
          <div className='h-[10px] mb-1'><Skeleton height="100%" /></div>
          <div className='h-[10px] w-[80%] mb-1'><Skeleton height="100%" /></div>
        </div>
        <div className='overflow-hidden'>
          <span className="float-left w-[20%] h-[10px]">
            <Skeleton height="100%" />
          </span>
          <span className="float-right w-[20%] h-[10px]">
            <Skeleton height="100%" />
          </span>
        </div>
      </div>
    </SkeletonTheme>
  )
}
