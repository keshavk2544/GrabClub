'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PrintRequest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Printer, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const PRINT_JOBS_STORAGE_KEY = 'grabclub-print-jobs';

export default function CyberAnalyticsTab() {
  const [jobs, setJobs] = useState<PrintRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedJobs = window.localStorage.getItem(PRINT_JOBS_STORAGE_KEY);
      if (storedJobs) {
        const completedJobs = JSON.parse(storedJobs).filter((j: PrintRequest) => j.status === 'completed');
        setJobs(completedJobs);
      }
    } catch (error) {
      console.error('Failed to load print jobs for analytics', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analytics = useMemo(() => {
    if (jobs.length === 0) {
      return {
        totalRevenue: 0,
        totalJobs: 0,
        averageJobValue: 0,
        printTypeDistribution: [],
      };
    }

    const totalRevenue = jobs.reduce((sum, job) => sum + job.totalCost, 0);
    const totalJobs = jobs.length;
    const averageJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;
    
    const bwCount = jobs.filter(j => j.printType === 'bw').length;
    const colorCount = jobs.filter(j => j.printType === 'color').length;

    const printTypeDistribution = [
        { type: 'B&W', count: bwCount, fill: 'hsl(var(--muted-foreground))' },
        { type: 'Color', count: colorCount, fill: 'hsl(var(--primary))' },
    ];

    return { totalRevenue, totalJobs, averageJobValue, printTypeDistribution };
  }, [jobs]);


  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-4">
                <Skeleton className="h-80" />
            </div>
        </div>
    );
  }
  
  if (jobs.length === 0) {
      return (
        <div className="text-center py-16">
            <h3 className="text-xl font-headline font-bold">No Analytics Data</h3>
            <p className="mt-2 text-muted-foreground">
                There are no completed print jobs yet to generate analytics.
            </p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                    <Printer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{analytics.totalJobs}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Job Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{analytics.averageJobValue.toFixed(2)}</div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Print Type Distribution</CardTitle>
                <CardDescription>Number of B&W vs Color print jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-64">
                    <BarChart accessibilityLayer data={analytics.printTypeDistribution} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" dataKey="count" hide />
                        <YAxis type="category" dataKey="type" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="count" radius={5} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
