export type Hub = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  active_status: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  title: string;
  description: string | null;
  price_eur: number;
  price_bgn: number;
  image_url: string | null;
  hub_id: string | null;
  active: boolean;
  flower_count: number;
  tag: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "crafting"
  | "delivering"
  | "delivered";

export type PaymentMethod = "card" | "cod";

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  total_amount_eur: number;
  stripe_payment_intent_id: string | null;
  payment_method: PaymentMethod;
  hub_id: string | null;
  status: OrderStatus;
  flower_count_validated: boolean;
  photo_proof_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price_eur: number;
  created_at: string;
};

export type NameDay = {
  id: string;
  name: string;
  month: number;
  day: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Courier = {
  id: string;
  name: string;
  phone: string;
  viber_id: string | null;
  hub_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type NameDayOptin = {
  id: string;
  phone: string;
  name: string | null;
  viber_id: string | null;
  created_at: string;
};

/* Viber bot incoming event */
export type ViberWebhookEvent = {
  event: "message" | "subscribed" | "conversation_started" | "delivered" | "seen";
  sender?: { id: string; name: string };
  message?: { type: string; text: string };
  timestamp: number;
};
