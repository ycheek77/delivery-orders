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
  orderer_name: string;
  orderer_contact: string;
  recipients: RecipientInput[];
}

export interface RecipientRow {
  recipient_id: number;
  order_id: number;
  orderer_name: string;
  orderer_contact: string;
  recipient_name: string;
  address: string;
  contact: string;
  request: string;
  products: string;
  tracking_number: string;
  created_at: string;
  status: string;
}
