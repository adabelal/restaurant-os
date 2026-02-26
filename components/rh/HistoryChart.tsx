'use client'

import React from 'react'

interface HistoryChartProps {
    data: { label: string, hours: number }[]
    maxHours: number
}

export function HistoryChart({ data, maxHours }: HistoryChartProps) {
    return (
        <div className="w-full h-48 flex items-end gap-2 px-2 pt-8">
            {data.map((month, i) => {
                const height = (month.hours / maxHours) * 100
                return (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-4 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {month.hours.toFixed(1)} h
                        </div>

                        {/* Bar */}
                        <div
                            className="w-full bg-blue-500/20 dark:bg-blue-500/40 rounded-t-sm group-hover:bg-blue-500 transition-all duration-500 ease-out border-b-2 border-blue-500/50"
                            style={{ height: `${Math.max(height, 2)}%` }}
                        ></div>

                        {/* Label */}
                        <span className="text-[10px] text-muted-foreground uppercase font-bold truncate w-full text-center">
                            {month.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
