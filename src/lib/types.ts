export type Order = {
  status: 'pending' | 'pending payment' | 'accepted' | 'out for delivery' | 'delivered' | 'cancelled';
};
export type MedicineRequest = {
    status: 'pending-review' | 'approved' | 'rejected';
};
