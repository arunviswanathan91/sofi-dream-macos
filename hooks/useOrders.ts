/**
 * useOrders — re-exports the shared context hook.
 * All state is managed in context/OrdersContext.tsx.
 * This file exists so existing imports of 'hooks/useOrders' keep working.
 */
export { useOrders } from '../context/OrdersContext';
