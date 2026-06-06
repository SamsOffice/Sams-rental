import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type RentalStatus = 'active' | 'overdue' | 'completed';
export type DriverStatus = 'assigned' | 'on_the_way' | 'picked_up' | 'delivered';
export type ExtensionStatus = 'pending' | 'approved' | 'denied';
export type CollectionStage = 'reminder' | 'warning' | 'final_notice' | 'lien_notice' | 'attorney';

export interface Rental {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_address: string;
  asset: string;
  category: string;
  assigned_driver: string;
  start_date: string;
  start_time: string;
  due_date: string;
  duration_days: number;
  price: number;
  payment_status: PaymentStatus;
  payment_method: string;
  rental_status: RentalStatus;
  driver_status: DriverStatus;
  portal_token: string;
  notes: string;
  created_at: string;
}

export interface DriverUpdate {
  id: string;
  rental_id: string;
  driver_name: string;
  status: DriverStatus;
  note: string;
  timestamp: string;
}

export interface ExtensionRequest {
  id: string;
  rental_id: string;
  client_name: string;
  extra_days: number;
  extra_cost: number;
  status: ExtensionStatus;
  requested_at: string;
}

export interface Collection {
  id: string;
  rental_id: string;
  client_name: string;
  amount_owed: number;
  days_overdue: number;
  stage: CollectionStage;
  lien_filed: boolean;
  attorney_referred: boolean;
  equipment_disabled: boolean;
  notes: string;
}
