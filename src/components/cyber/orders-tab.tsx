'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { PrintRequest } from '@/lib/types';
import { Check, X, Printer, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const PRINT_JOBS_STORAGE_KEY = 'grabclub-print-jobs';

export default function CyberOrdersTab() {
  const [jobs, setJobs] = useState<PrintRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const storedJobs = window.localStorage.getItem(PRINT_JOBS_STORAGE_KEY);
        if (storedJobs) {
            const parsedJobs = JSON.parse(storedJobs).map((j: any) => ({...j, createdAt: new Date(j.createdAt)}));
            setJobs(parsedJobs);
        }
    } catch (error) {
        console.error('Failed to load print jobs.', error);
    }
    
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === PRINT_JOBS_STORAGE_KEY && event.newValue) {
             try {
                const parsedJobs = JSON.parse(event.newValue).map((j: any) => ({...j, createdAt: new Date(j.createdAt)}));
                setJobs(parsedJobs);
             } catch (error) {
                console.error('Failed to parse jobs from storage event.', error);
             }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateJobs = (newJobs: PrintRequest[]) => {
    setJobs(newJobs);
    try {
        window.localStorage.setItem(PRINT_JOBS_STORAGE_KEY, JSON.stringify(newJobs));
    } catch (error) {
        console.error('Failed to save jobs to localStorage', error);
    }
  }

  const handleUpdateStatus = (jobId: string, status: PrintRequest['status']) => {
    const newJobs = jobs.map(job =>
        job.id === jobId ? { ...job, status } : job
      );
    updateJobs(newJobs);
    toast({ title: `Print Job ${status}`, description: `Job ${jobId.split('-').pop()} has been marked as ${status}.` });
  };
  
  const handleDownloadPdf = (fileDataUrl: string, fileName: string) => {
      const link = document.createElement('a');
      link.href = fileDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const sortedJobs = [...jobs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const pendingJobs = sortedJobs.filter(o => o.status === 'pending');
  const activeJobs = sortedJobs.filter(o => o.status === 'printing');
  const pastJobs = sortedJobs.filter(o => o.status === 'completed' || o.status === 'rejected');

  return (
    <div className="grid md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-2 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Print Jobs</CardTitle>
            <CardDescription>Review and process incoming jobs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingJobs.length > 0 ? (
              pendingJobs.map(job => (
                <div key={job.id} className="p-4 border rounded-lg bg-card shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold">{job.userName}</p>
                        <p className="text-sm text-muted-foreground">{job.phone}</p>
                        <p className="text-sm text-muted-foreground">{formatDistanceToNow(job.createdAt, { addSuffix: true })}</p>
                    </div>
                    <Badge variant="default" className="bg-blue-600 text-white capitalize">{job.status}</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Pickup:</span> <span className="font-medium text-right">{job.pickupLocation}</span></div>
                      <div className="flex justify-between"><span>Slot:</span> <span className="font-medium text-right">{job.pickupTimeSlot}</span></div>
                      <div className="flex justify-between"><span>File:</span> <span className="font-medium truncate max-w-xs">{job.fileName}</span></div>
                      <div className="flex justify-between"><span>Pages:</span> <span className="font-medium">{job.pageCount}</span></div>
                      <div className="flex justify-between"><span>Type:</span> <span className="font-medium uppercase">{job.printType}</span></div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-lg">Total: ₹{job.totalCost.toFixed(2)}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-red-500/10 text-red-600" onClick={() => handleUpdateStatus(job.id, 'rejected')}><X className="mr-1 h-4 w-4"/> Reject</Button>
                      <Button size="sm" onClick={() => handleUpdateStatus(job.id, 'printing')}><Printer className="mr-1 h-4 w-4"/> Start Printing</Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No new print jobs.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>In Progress</CardTitle>
                <CardDescription>Jobs currently being printed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activeJobs.length > 0 ? (
                    activeJobs.map(job => (
                        <div key={job.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold">{job.userName}</p>
                                    <p className="text-xs text-muted-foreground">{job.id.split('-').pop()}</p>
                                </div>
                                <Badge className="capitalize bg-amber-500 text-white">{job.status}</Badge>
                            </div>
                            <Button size="sm" variant="outline" className="w-full mb-2" onClick={() => handleDownloadPdf(job.fileDataUrl, job.fileName)}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                            <Button size="sm" className="w-full" onClick={() => handleUpdateStatus(job.id, 'completed')}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Completed
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No jobs in progress.</p>
                )}
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Past Jobs</CardTitle>
            <CardDescription>Completed or rejected jobs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             {pastJobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No past jobs.</p>}
            {pastJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between">
                  <div>
                       <p className="font-semibold">{job.userName}</p>
                       <p className="text-xs text-muted-foreground">{job.id.split('-').pop()}</p>
                  </div>
                  <Badge variant={job.status === 'rejected' ? 'destructive' : 'default'} className={cn("capitalize", {'bg-green-600 text-white': job.status === 'completed'})}>
                    {job.status}
                  </Badge>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
