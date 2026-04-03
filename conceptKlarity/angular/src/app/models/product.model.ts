export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  status: 'available' | 'out_of_stock' | 'discontinued';
}

export interface CreateProductRequest {
  name: string;
  price: number;
  description?: string;
}

export interface UpdateProductRequest {
  name: string;
  price: number;
  description?: string;
  status?: 'available' | 'out_of_stock' | 'discontinued';
}
