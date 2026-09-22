import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersInputSchema, type OrdersInput } from './schemas';
import { ordersQueryOptions } from './queries';

export function useOrdersList() {
  const [input, setInput] = useState<OrdersInput>({});
  const values = ordersInputSchema.parse(input);
  const query = useQuery(ordersQueryOptions(values));
  return { input: values, setInput, query };
}
