import type { Href } from 'expo-router';
import type { IconProps } from '@/components/ui/Icon';

type NavigationItem = { title: string; route: string; href: Href; icon: IconProps['name'] };
type NavigationSection = { title: string; items: readonly NavigationItem[] };

export const navigationSections = [
  { title: 'Events', items: [
    { title: 'My Events', route: 'events/my-events', href: '/events/my-events', icon: 'calendar-outline' },
    { title: 'Collections', route: 'events/collections', href: '/events/collections', icon: 'folder-multiple-outline' },
    { title: 'Seating Charts', route: 'events/seating-charts', href: '/events/seating-charts', icon: 'seat-outline' },
    { title: 'Waitlists', route: 'events/waitlists', href: '/events/waitlists', icon: 'clipboard-list-outline' },
    { title: 'Affiliate Sellers', route: 'events/affiliate-sellers', href: '/events/affiliate-sellers', icon: 'account-group-outline' },
  ] },
  { title: 'Marketing', items: [
    { title: 'Emails', route: 'marketing/emails', href: '/marketing/emails', icon: 'email-outline' },
    { title: 'Forms', route: 'marketing/forms', href: '/marketing/forms', icon: 'form-select' },
    { title: 'Social Media', route: 'marketing/social-media', href: '/marketing/social-media', icon: 'share-variant-outline' },
    { title: 'QR Code Generator', route: 'marketing/qr-code-generator', href: '/marketing/qr-code-generator', icon: 'qrcode' },
  ] },
  { title: 'CRM', items: [
    { title: 'Contacts', route: 'crm/contacts', href: '/crm/contacts', icon: 'account-box-outline' },
    { title: 'Properties', route: 'crm/properties', href: '/crm/properties', icon: 'tag-outline' },
    { title: 'Segments', route: 'crm/segments', href: '/crm/segments', icon: 'account-multiple-outline' },
  ] },
  { title: 'Commerce', items: [
    { title: 'Products', route: 'commerce/products', href: '/commerce/products', icon: 'package-variant-closed' },
    { title: 'Promo Codes', route: 'commerce/promo-codes', href: '/commerce/promo-codes', icon: 'ticket-percent-outline' },
    { title: 'Checkouts', route: 'commerce/checkouts', href: '/commerce/checkouts', icon: 'cart-outline' },
    { title: 'Invoices', route: 'commerce/invoices', href: '/commerce/invoices', icon: 'file-document-outline' },
  ] },
  { title: 'Analytics', items: [
    { title: 'Dashboard', route: 'analytics/dashboard', href: '/analytics/dashboard', icon: 'chart-box-outline' },
  ] },
  { title: 'Finance', items: [
    { title: 'Banking', route: 'finance/banking', href: '/finance/banking', icon: 'bank-outline' },
    { title: 'Orders', route: 'finance/orders', href: '/finance/orders', icon: 'receipt-text-outline' },
    { title: 'Refunds', route: 'finance/refunds', href: '/finance/refunds', icon: 'cash-refund' },
    { title: 'Top ups', route: 'finance/top-ups', href: '/finance/top-ups', icon: 'cash-plus' },
    { title: 'Disputes', route: 'finance/disputes', href: '/finance/disputes', icon: 'scale-balance' },
  ] },
] as const satisfies readonly NavigationSection[];
