export interface OrderItem {
  product_name: string;
  quantity: number;
}

export interface RecipientInput {
  recipient_name: string;
  address: string;
  contact: string;
  request: string;
  items: OrderItem[];
}

export interface OrderInput {
  recipients: RecipientInput[];
}

export interface RecipientRow {
  recipient_id: number;
  order_id: number;
  orderer_name: string;
  orderer_contact: string;
  access_code_id: string;
  recipient_name: string;
  address: string;
  contact: string;
  request: string;
  products: string;
  tracking_number: string;
  created_at: string;
  status: string;
}
