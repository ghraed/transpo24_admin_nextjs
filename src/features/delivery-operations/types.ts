export type DeliveryParty = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type DeliveryOffer = {
  id: string;
  driver: DeliveryParty;
  price: number;
  currency: string;
  status: string;
  message: string | null;
  estimatedPickupAt: string | null;
  estimatedDeliveryAt: string | null;
  estimatedDurationMinutes: number | null;
  sentAt: string;
  respondedAt: string | null;
};

export type DeliveryPhoto = {
  id: string;
  url: string;
  type: string | null;
  originalName: string | null;
  createdAt: string;
};

export type DeliveryOperation = {
  id: string;
  status: string;
  service: string;
  createdAt: string;
  submittedAt: string | null;
  scheduledPickupAt: string | null;
  isImmediate: boolean;
  customer: DeliveryParty;
  assignedDriver: DeliveryParty | null;
  acceptedOfferId: string | null;
  route: { pickupAddress: string | null; dropoffAddress: string | null };
  item: {
    title: string | null;
    type: string | null;
    description: string | null;
    details: Record<string, string | number | boolean | null>;
  };
  offers: DeliveryOffer[];
  delivery: {
    acceptedAt: string | null;
    driverArrivedPickupAt: string | null;
    itemPickedUpAt: string | null;
    driverGoingToDropoffAt: string | null;
    deliveredAt: string | null;
    completedAt: string | null;
    pickupNotes: string | null;
    deliveryNotes: string | null;
    pickupConfirmedByDriver: boolean;
    deliveryConfirmedByDriver: boolean;
  };
  payment: {
    finalPrice: number | null;
    currency: string | null;
    status: string | null;
    method: string | null;
    heldAmount: number | null;
    capturedAmount: number | null;
  };
  photos: DeliveryPhoto[];
  proofPhotos: DeliveryPhoto[];
};

export type DeliveryOperationsResponse = {
  items: DeliveryOperation[];
  total: number;
  summary: { total: number; active: number; unassigned: number; completed: number };
};

export type DeliveryOperationsView = "all" | "active" | "unassigned" | "completed" | "cancelled";
