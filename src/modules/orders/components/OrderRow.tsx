import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Text } from '@/components/ui';
import { productSetIdSchema, type Order, type JsonRecord } from '../schemas';
import { orderMoney } from '../utils';
import { RecordFields } from './RecordFields';

export function OrderRow({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const checkout = productSetIdSchema.safeParse(order.product_set_id);
  const name = order.customerName || [order.firstName, order.lastName].filter(Boolean).join(' ') || order.email || 'Customer unavailable';
  const details: JsonRecord = {};
  for (const key of ['id', 'paymentMethod', 'discount', 'fees', 'promos', 'refundedAmount', 'refLabel', 'walletLink', 'eventId', 'cancelled', 'manuallyAdded', 'comped', 'latestCharge', 'disputeStatus', 'accessCodes', 'product_set_id'] as const) details[key] = order[key] ?? null;
  return <View className="mb-3 gap-3 rounded-control border border-border p-4">
    <Text variant="heading" accessibilityRole="header">{name}</Text>
    <Text>{order.email || 'Email unavailable'}</Text>
    <Text>Placed: {order.date ? new Date(order.date).toLocaleString() : 'Unavailable'}</Text>
    <Text>Type: {order.type ?? 'Unavailable'} · Status: {order.orderStatus ?? (order.status ? 'Paid/completed' : 'Unavailable')}</Text>
    <Text>Quantity: {order.quantity} · Gross: {orderMoney(order.amount, order.currency)}</Text>
    <Text>Refunded: {order.refunded === undefined ? 'Unavailable' : order.refunded ? 'Yes' : 'No'} · Box office: {order.isBoxOffice === undefined ? 'Unavailable' : order.isBoxOffice ? 'Yes' : 'No'}</Text>
    <Button label="Order information" accessibilityLabel={`Order information for ${order.id}`} variant="secondary" accessibilityState={{ expanded: isExpanded }} onPress={() => setIsExpanded(previous => !previous)} />
    {isExpanded ? <RecordFields value={details} /> : null}
    {checkout.success ? <Button label="View checkout details" accessibilityLabel={`View checkout details for ${order.id}`} variant="secondary" onPress={() => router.push({ pathname: '/finance/orders/checkout/[productSetId]', params: { productSetId: checkout.data } })} /> : <Text variant="muted">Checkout details unavailable for this order.</Text>}
  </View>;
}
