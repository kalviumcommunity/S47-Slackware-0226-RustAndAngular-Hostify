export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  status: 'available' | 'out_of_stock' | 'discontinued';
}
