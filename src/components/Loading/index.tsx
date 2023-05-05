import React from "react"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'


export const Loading = (props: any) => (
  <div>
    <Skeleton />
    <Skeleton count={5} />
  </div>
)
