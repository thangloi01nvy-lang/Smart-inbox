export interface Student {
  id: string;
  name: string;
  dataPoints: number;
  status: 'READY' | 'PENDING';
  trend: number[]; // Array of values for the sparkline
}

export interface Class {
  id: string;
  name: string;
  studentIds: string[];
}
