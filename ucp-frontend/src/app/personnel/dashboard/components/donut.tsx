"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export type DonutPieSegment = {
  label: string;
  value: number;
  color: string;
};

export type DonutPercentLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
};

type DonutPieChartProps = {
  segments: DonutPieSegment[];
  label?: ((props: DonutPercentLabelProps) => ReactNode) | undefined;
};

export function DonutPieChart({ segments, label }: DonutPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[{ name: "bg", value: 1 }]}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          isAnimationActive={false}
          stroke="none"
        >
          <Cell fill="#f1f5f9" />
        </Pie>
        <Pie
          data={segments.map((segment) => ({ name: segment.label, value: segment.value, color: segment.color }))}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={5}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
          startAngle={90}
          endAngle={-270}
          labelLine={false}
          label={label}
        >
          {segments.map((segment) => (
            <Cell key={segment.label} fill={segment.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
