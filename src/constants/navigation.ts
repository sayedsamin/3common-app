import type { Href } from 'expo-router';
import type { IconProps } from '@/components/ui/Icon';

export type NavigationDestination = { title: string; description: string; href: Href; icon: IconProps['name'] };
type NavigationItem = NavigationDestination & { route: string };
type NavigationSection = { title: string; items: readonly NavigationItem[] };

export const navigationSections = [
  { title: 'Events', items: [
    { title: 'My Events', description: 'Plan, manage, and keep track of your events.', route: 'events/my-events', href: '/events/my-events', icon: 'calendar-outline' },
  ] },
  { title: 'Marketing', items: [
    { title: 'Emails', description: 'Create emails and follow their delivery.', route: 'marketing/emails', href: '/marketing/emails', icon: 'email-outline' },
  ] },
  { title: 'CRM', items: [
    { title: 'Contacts', description: 'Find people and view their activity.', route: 'crm/contacts', href: '/crm/contacts', icon: 'account-box-outline' },
    { title: 'Segments', description: 'Organize your audience into groups.', route: 'crm/segments', href: '/crm/segments', icon: 'account-multiple-outline' },
  ] },
  { title: 'Commerce', items: [
    { title: 'Checkouts', description: 'Browse checkouts and their products.', route: 'commerce/checkouts', href: '/commerce/checkouts', icon: 'cart-outline' },
    { title: 'Invoices', description: 'Manage invoices and payment details.', route: 'commerce/invoices', href: '/commerce/invoices', icon: 'file-document-outline' },
  ] },
  { title: 'Finance', items: [
    { title: 'Orders', description: 'Review purchases and order details.', route: 'finance/orders', href: '/finance/orders', icon: 'receipt-text-outline' },
  ] },
] as const satisfies readonly NavigationSection[];

export const navigationUtilities = [
  { title: 'Settings', description: 'Manage API access and sign out.', href: '/settings', icon: 'cog-outline' },
] as const satisfies readonly NavigationDestination[];
